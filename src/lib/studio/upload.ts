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

const AUTO_SWEEP_DELAY_MS = 1500; // short pause before the one automatic retry pass

export type UploadProgress = {
  total: number; // accepted (non-skipped) files
  done: number;
  duplicate: number;
  // Files that failed but a retry could still fix (network / 5xx / 429 that exhausted per-file
  // retries). After the automatic sweep this is the outstanding set the "Retry" button re-sends.
  retryableFailed: number;
  // Files a retry will never fix (unsupported here, 4xx, or the browser couldn't decode them).
  terminalFailed: number;
  skipped: number; // unsupported extension — filtered before upload; shown with terminalFailed
  inFlight: number;
  retrying: boolean; // true during the automatic end-of-run retry pass
  paused: boolean; // true while uploads are paused waiting for the network to come back
  errors: { name: string; reason: string }[]; // capped sample for display
  // Set when a terminal, group-wide condition stopped the run early (out of storage / uploads
  // restricted). The remaining files were NOT attempted — the UI explains why and offers Retry.
  halted?: { code: string; message: string };
};

// What runUpload returns: the final progress plus the files still worth retrying (so the caller can
// offer a one-tap retry without the customer figuring out which ones failed).
export type UploadResult = {
  progress: UploadProgress;
  retry: File[];
};

type UploadHandlers = {
  onProgress: (progress: UploadProgress) => void;
  concurrency?: number;
  // Logical folder to file this upload under (omitted = ungrouped).
  folderId?: string;
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
// so we don't burn attempts (or time) on something that will never succeed. `waitReady` (the online
// gate) runs before every attempt, so while offline we park here instead of burning retries.
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 4,
  waitReady?: () => Promise<void>,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    if (waitReady) {
      await waitReady();
    }
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

type Classified = { file: File; contentType: string };

/**
 * Uploads original photos to a group: classifies files, chunks into batches of <=100, then runs each
 * file through init → S3 PUT → complete with bounded concurrency and retries. Originals are stored
 * as-is (no compression); the backend thumbnail worker makes grid thumbnails afterward.
 *
 * Resilience (so the customer never has to figure out what failed):
 *  - Pauses (doesn't fail) while the device is offline, resuming when the network returns.
 *  - After the main pass, automatically retries the still-failing transient failures ONCE.
 *  - Returns the files still worth retrying, so the caller can offer a one-tap "Retry".
 *
 * Progress is reported via onProgress (throttled). Never throws — failures are classified into
 * retryable vs terminal and surfaced on the progress object.
 */
export async function runUpload(
  tripId: string,
  files: File[],
  { onProgress, concurrency = 5, folderId }: UploadHandlers,
): Promise<UploadResult> {
  const accepted: Classified[] = [];
  const progress: UploadProgress = {
    total: 0,
    done: 0,
    duplicate: 0,
    retryableFailed: 0,
    terminalFailed: 0,
    skipped: 0,
    inFlight: 0,
    retrying: false,
    paused: false,
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

  // Online gate: if offline, park here (marking the run paused) until the network returns. Called
  // before every network attempt, so we never burn retries — or mass-fail photos — during a drop.
  const onlineGate = (): Promise<void> => {
    if (typeof navigator === "undefined" || navigator.onLine) {
      return Promise.resolve();
    }
    progress.paused = true;
    emit(true);
    return new Promise((resolve) => {
      const handler = () => {
        window.removeEventListener("online", handler);
        progress.paused = false;
        emit(true);
        resolve();
      };
      window.addEventListener("online", handler);
    });
  };

  // Files that failed this pass but a retry could fix. Reassigned each pass; closed over by the
  // failure recorder below.
  let retryBucket: Classified[] = [];
  // Files a retry will never fix — accumulated across passes, never retried.
  const terminal: Classified[] = [];

  function recordFailure(item: Classified, reason: string, isTerminal: boolean) {
    if (progress.errors.length < 20) {
      progress.errors.push({ name: item.file.name, reason });
    }
    if (isTerminal) {
      terminal.push(item);
      progress.terminalFailed = terminal.length;
    } else {
      retryBucket.push(item);
      progress.retryableFailed = retryBucket.length;
    }
  }

  async function uploadOne(item: Classified, batchId: string) {
    const { file, contentType } = item;
    progress.inFlight += 1;
    emit();
    try {
      const size = await readImageSize(file);
      if (!size) {
        // A decode failure is treated as terminal (unsupported/damaged) — a retry won't help.
        recordFailure(item, "Couldn't read image", true);
        return;
      }
      const contentHash = await sha256Hex(file);
      const init = await withRetry(
        () =>
          studioApi.initPhotoUpload(tripId, batchId, {
            fileName: file.name,
            contentType,
            contentHash,
            contentSize: file.size,
          }),
        4,
        onlineGate,
      );
      if ("duplicate" in init) {
        progress.duplicate += 1;
        return;
      }
      await withRetry(() => putToS3(init.uploadUrl, file, contentType), 4, onlineGate);
      await withRetry(
        () =>
          studioApi.completePhotoUpload(tripId, batchId, {
            objectKey: init.objectKey,
            contentType,
            sizeBytes: file.size,
            width: size.width,
            height: size.height,
            contentHash,
            contentSize: file.size,
          }),
        4,
        onlineGate,
      );
      progress.done += 1;
    } catch (err) {
      recordFailure(item, err instanceof Error ? err.message : "Upload failed", isTerminalError(err));
    } finally {
      progress.inFlight -= 1;
      emit();
    }
  }

  // Attempt the given files once, chunking into batches of <=100. Returns nothing; successes and
  // failures land on the shared counters / buckets.
  async function runPass(pending: Classified[]): Promise<void> {
    for (let i = 0; i < pending.length; i += BATCH_MAX) {
      const chunk = pending.slice(i, i + BATCH_MAX);
      let batchId: string;
      try {
        const res = await withRetry(
          () => studioApi.createUploadBatch(tripId, chunk.length, folderId),
          4,
          onlineGate,
        );
        batchId = res.batch.id;
      } catch (err) {
        // Group-wide terminal conditions: trying the remaining batches is pointless. Stop, explain,
        // and keep the not-yet-attempted files as retryable so a tap can resume once it's fixed.
        if (
          err instanceof ApiError &&
          (err.code === "EVENT_STORAGE_FULL" || err.code === "UPLOADS_RESTRICTED")
        ) {
          progress.halted = {
            code: err.code,
            message:
              err.code === "EVENT_STORAGE_FULL"
                ? "This event is out of storage, so the remaining photos weren't uploaded. Add more storage, then tap Retry."
                : "Only the host can add photos to this event, so the remaining photos weren't uploaded.",
          };
          for (const c of pending.slice(i)) {
            retryBucket.push(c);
          }
          progress.retryableFailed = retryBucket.length;
          emit(true);
          return;
        }
        // A batch failed to start for another reason — retryable; move on to the next chunk.
        for (const c of chunk) {
          recordFailure(c, "Couldn't start upload", false);
        }
        emit(true);
        continue;
      }
      await pool(chunk, concurrency, (c) => uploadOne(c, batchId));
    }
  }

  // Main pass, then at most one automatic retry sweep for the transient stragglers.
  let pending = accepted;
  for (let pass = 0; ; pass += 1) {
    retryBucket = [];
    progress.retryableFailed = 0;
    progress.retrying = pass > 0;
    emit(true);

    await runPass(pending);

    progress.retrying = false;
    pending = retryBucket;
    // Stop if nothing left, if a group-wide condition halted us, after the single auto-sweep, or if
    // we're offline (let the manual Retry handle it once the connection is back).
    if (
      pending.length === 0 ||
      progress.halted ||
      pass >= 1 ||
      (typeof navigator !== "undefined" && !navigator.onLine)
    ) {
      break;
    }
    await new Promise((r) => setTimeout(r, AUTO_SWEEP_DELAY_MS));
  }

  progress.retryableFailed = pending.length;
  emit(true);
  return { progress, retry: pending.map((p) => p.file) };
}
