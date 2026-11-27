import { ApiError, putToS3, studioApi } from "./api";

import { contentTypeFor } from "./upload-capacity";

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
  // Used when the owning Studio session ends, not on page navigation.
  signal?: AbortSignal;
};

type ImageSize = { width: number; height: number };

function errText(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || "error";
  }
  return String(err);
}

// Dimensions via an <img> element. Far more tolerant than createImageBitmap: it only needs to parse
// the image header (naturalWidth/Height are set on load) and the browser's image pipeline can handle
// large or unusually-encoded files that the bitmap decoder rejects. Resolves null on a zero-size
// decode, rejects (with a reason) if the element errors.
function readSizeViaImage(file: File): Promise<ImageSize | null> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(size.width > 0 && size.height > 0 ? size : null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("img decode failed"));
    };
    img.src = url;
  });
}

// Dimensions straight from the JPEG Start-Of-Frame (SOFn) marker — no pixel decode at all, so it
// works for valid JPEGs the browser won't render (memory pressure, odd encodings). Reads only the
// head of the file; SOF sits before the image data. Returns null for anything that isn't a JPEG we
// can walk.
async function readJpegSize(file: File): Promise<ImageSize | null> {
  const buf = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    return null; // no SOI → not a JPEG
  }
  let offset = 2;
  while (offset + 1 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1];
    offset += 2;
    if (marker === 0xff) {
      // Fill byte; re-align on the next 0xff.
      offset -= 1;
      continue;
    }
    // Standalone markers (no length payload): SOI, EOI, RSTn, TEM.
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      continue;
    }
    if (offset + 1 >= buf.length) {
      break;
    }
    const len = (buf[offset] << 8) | buf[offset + 1];
    if (len < 2) {
      return null;
    }
    // SOF markers (C0–CF) carry dimensions, except C4 (DHT), C8 (JPG), CC (DAC).
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (offset + 6 >= buf.length) {
        break;
      }
      const height = (buf[offset + 3] << 8) | buf[offset + 4];
      const width = (buf[offset + 5] << 8) | buf[offset + 6];
      return width > 0 && height > 0 ? { width, height } : null;
    }
    offset += len; // skip this segment's payload
  }
  return null;
}

// Reads an image's pixel dimensions (the API requires width/height). Primary path is
// createImageBitmap — fast, but surprisingly fragile: full-resolution camera JPEGs can make it throw
// (memory pressure, huge dimensions, CMYK/12-bit encodings) even though the file is perfectly valid.
// So we fall back to an <img> element, then to parsing the JPEG header directly. Returns the size, or
// an { error } describing why every method failed (also logged to the console for support triage).
async function readImageSize(file: File): Promise<ImageSize | { error: string }> {
  const attempts: string[] = [];

  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    if (size.width > 0 && size.height > 0) {
      return size;
    }
    attempts.push("createImageBitmap: zero dimensions");
  } catch (err) {
    attempts.push(`createImageBitmap: ${errText(err)}`);
  }

  try {
    const size = await readSizeViaImage(file);
    if (size) {
      return size;
    }
    attempts.push("img: zero dimensions");
  } catch (err) {
    attempts.push(`img: ${errText(err)}`);
  }

  try {
    const size = await readJpegSize(file);
    if (size) {
      return size;
    }
  } catch (err) {
    attempts.push(`header: ${errText(err)}`);
  }

  const error = attempts.join("; ");
  console.warn(
    `[upload] couldn't read dimensions for "${file.name}" (type=${file.type || "none"}, ${file.size} bytes): ${error}`,
  );
  return { error };
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
 * Progress is reported via onProgress (throttled). Upload failures are classified into retryable
 * vs terminal. Session cancellation throws so the manager can immediately release its queue.
 */
export async function runUpload(
  tripId: string,
  files: File[],
  { onProgress, concurrency = 5, folderId, signal }: UploadHandlers,
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
    signal?.throwIfAborted();
    if (typeof navigator === "undefined" || navigator.onLine) {
      return Promise.resolve();
    }
    progress.paused = true;
    emit(true);
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        window.removeEventListener("online", handler);
        signal?.removeEventListener("abort", onAbort);
      };
      const handler = () => {
        cleanup();
        progress.paused = false;
        emit(true);
        resolve();
      };
      const onAbort = () => { cleanup(); reject(signal?.reason); };
      window.addEventListener("online", handler);
      signal?.addEventListener("abort", onAbort, { once: true });
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
    signal?.throwIfAborted();
    const { file, contentType } = item;
    progress.inFlight += 1;
    emit();
    try {
      const sizeResult = await readImageSize(file);
      if ("error" in sizeResult) {
        // Every dimension-reading method failed — treated as terminal (unsupported/damaged); a retry
        // won't help. The real cause is logged to the console (see readImageSize) for triage.
        recordFailure(item, "Couldn't read image", true);
        return;
      }
      const size = sizeResult;
      const contentHash = await sha256Hex(file);
      const init = await withRetry(
        () =>
          studioApi.initPhotoUpload(tripId, batchId, {
            fileName: file.name,
            contentType,
            contentHash,
            contentSize: file.size,
          }, signal),
        4,
        onlineGate,
      );
      if ("duplicate" in init) {
        progress.duplicate += 1;
        return;
      }
      await withRetry(() => putToS3(init.uploadUrl, file, contentType, signal), 4, onlineGate);
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
          }, signal),
        4,
        onlineGate,
      );
      progress.done += 1;
    } catch (err) {
      signal?.throwIfAborted();
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
      signal?.throwIfAborted();
      const chunk = pending.slice(i, i + BATCH_MAX);
      let batchId: string;
      try {
        const res = await withRetry(
          () => studioApi.createUploadBatch(tripId, chunk.length, folderId, signal),
          4,
          onlineGate,
        );
        batchId = res.batch.id;
      } catch (err) {
        signal?.throwIfAborted();
        // Group-wide terminal conditions: trying the remaining batches is pointless. Stop, explain,
        // and keep the not-yet-attempted files as retryable so a tap can resume once it's fixed.
        if (
          err instanceof ApiError &&
          (err.code === "EVENT_STORAGE_FULL" ||
            err.code === "PHOTO_LIMIT_REACHED" ||
            err.code === "UPLOADS_RESTRICTED")
        ) {
          progress.halted = {
            code: err.code,
            message:
              err.code === "EVENT_STORAGE_FULL"
                ? "Storage limit reached, so the remaining photos weren't uploaded."
                : err.code === "PHOTO_LIMIT_REACHED"
                  ? "Photo limit reached for your plan, so the remaining photos weren't uploaded."
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
