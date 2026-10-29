import { ApiError, putToS3, studioApi } from "./api";

// Browser-decodable image types we accept. Others (HEIC, RAW, video, etc.) are skipped — the browser
// can't read their dimensions and the API requires width/height.
const EXT_TO_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const BATCH_MAX = 100; // server cap on totalCount per upload batch
const MAX_HASH_BYTES = 40 * 1024 * 1024; // skip dedup hashing for very large files (bounds memory)

export type UploadProgress = {
  total: number; // accepted (non-skipped) files
  done: number;
  duplicate: number;
  error: number;
  skipped: number;
  inFlight: number;
  errors: { name: string; reason: string }[]; // capped sample for display
  // Set when a terminal, group-wide condition stopped the run early (out of storage / uploads
  // restricted). The remaining files were NOT attempted — the UI should explain why and let the
  // user fix it and retry, rather than showing a wall of identical failures.
  halted?: { code: string; message: string };
};

type UploadHandlers = {
  onProgress: (progress: UploadProgress) => void;
  concurrency?: number;
};

function contentTypeFor(file: File): string {
  if (file.type && file.type.startsWith("image/") && file.type !== "image/heic" && file.type !== "image/heif") {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_TYPE[ext] ?? "";
}

async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size.width > 0 && size.height > 0 ? size : null;
  } catch {
    return null;
  }
}

async function sha256Hex(file: File): Promise<string | undefined> {
  if (file.size > MAX_HASH_BYTES) {
    return undefined;
  }
  try {
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return undefined;
  }
}

// A failure that retrying can't fix: a 4xx that isn't 429 (e.g. 400 bad request, 401 auth dead,
// 402 out of storage, 403 restricted, 404/409). Everything else — network errors (not an ApiError),
// 5xx, and 429 — is transient and worth another attempt.
export function isTerminalError(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status < 500 && err.status !== 429;
  }
  return false;
}

// Retries transient failures with exponential backoff + jitter; bails immediately on a terminal one
// so we don't burn attempts (or time) on something that will never succeed.
async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (isTerminalError(err) || i === attempts - 1) {
        throw err;
      }
      // 300ms, 600ms, 1200ms … plus up to 250ms of jitter to avoid synchronized retry waves.
      await new Promise((r) => setTimeout(r, 300 * 2 ** i + Math.random() * 250));
    }
  }
  throw lastError;
}

// Run tasks with a bounded number in flight at once.
async function pool<T>(items: T[], size: number, worker: (item: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Uploads original photos to a group: classifies files, chunks into batches of <=100, then runs each
 * file through init → S3 PUT → complete with bounded concurrency and retries. Originals are stored
 * as-is (no compression); the backend thumbnail worker makes grid thumbnails afterward. Progress is
 * reported via onProgress (throttled). Never throws — failures land in `progress.errors`.
 */
export async function runUpload(
  tripId: string,
  files: File[],
  { onProgress, concurrency = 5 }: UploadHandlers,
): Promise<UploadProgress> {
  const accepted: { file: File; contentType: string }[] = [];
  const progress: UploadProgress = {
    total: 0,
    done: 0,
    duplicate: 0,
    error: 0,
    skipped: 0,
    inFlight: 0,
    errors: [],
  };

  for (const file of files) {
    const contentType = contentTypeFor(file);
    if (contentType) {
      accepted.push({ file, contentType });
    } else {
      progress.skipped += 1;
      if (progress.errors.length < 20) {
        progress.errors.push({ name: file.name, reason: "Unsupported file type" });
      }
    }
  }
  progress.total = accepted.length;

  // Throttle emits so thousands of files don't flood React (~every 150ms + always on demand).
  let lastEmit = 0;
  const emit = (force = false) => {
    const now = Date.now();
    if (force || now - lastEmit > 150) {
      lastEmit = now;
      onProgress({ ...progress, errors: [...progress.errors] });
    }
  };
  emit(true);

  function recordError(name: string, reason: string) {
    progress.error += 1;
    if (progress.errors.length < 20) {
      progress.errors.push({ name, reason });
    }
  }

  async function uploadOne(file: File, contentType: string, batchId: string) {
    progress.inFlight += 1;
    emit();
    try {
      const size = await readImageSize(file);
      if (!size) {
        recordError(file.name, "Couldn't read image");
        return;
      }
      const contentHash = await sha256Hex(file);
      const init = await withRetry(() =>
        studioApi.initPhotoUpload(tripId, batchId, {
          fileName: file.name,
          contentType,
          contentHash,
          contentSize: file.size,
        }),
      );
      if ("duplicate" in init) {
        progress.duplicate += 1;
        return;
      }
      await withRetry(() => putToS3(init.uploadUrl, file, contentType));
      await withRetry(() =>
        studioApi.completePhotoUpload(tripId, batchId, {
          objectKey: init.objectKey,
          contentType,
          sizeBytes: file.size,
          width: size.width,
          height: size.height,
          contentHash,
          contentSize: file.size,
        }),
      );
      progress.done += 1;
    } catch (err) {
      recordError(file.name, err instanceof Error ? err.message : "Upload failed");
    } finally {
      progress.inFlight -= 1;
      emit();
    }
  }

  for (let i = 0; i < accepted.length; i += BATCH_MAX) {
    const chunk = accepted.slice(i, i + BATCH_MAX);
    let batchId: string;
    try {
      // Retry batch creation on transient failures (network/5xx) — it had none before, so a single
      // blip used to fail a whole 100-photo chunk.
      const res = await withRetry(() => studioApi.createUploadBatch(tripId, chunk.length));
      batchId = res.batch.id;
    } catch (err) {
      // Group-wide terminal conditions: trying the remaining batches is pointless and just produces
      // a wall of identical errors. Stop and tell the user exactly what to fix.
      if (
        err instanceof ApiError &&
        (err.code === "EVENT_STORAGE_FULL" || err.code === "UPLOADS_RESTRICTED")
      ) {
        progress.halted = {
          code: err.code,
          message:
            err.code === "EVENT_STORAGE_FULL"
              ? "This event is out of storage, so the remaining photos weren't uploaded. Add more storage, then upload them again."
              : "Only the host can add photos to this event, so the remaining photos weren't uploaded.",
        };
        emit(true);
        break;
      }
      // One batch failed for some other reason — record it and move on to the next chunk.
      for (const c of chunk) {
        recordError(c.file.name, "Couldn't start upload");
      }
      emit(true);
      continue;
    }
    await pool(chunk, concurrency, (c) => uploadOne(c.file, c.contentType, batchId));
  }

  emit(true);
  return progress;
}
