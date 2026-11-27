import type { runUpload, UploadProgress } from "./upload";

export type UploadTarget = {
  tripId: string;
  tripName: string;
  folderId?: string;
  folderName?: string;
};

export type UploadJob = UploadTarget & {
  id: string;
  totalFiles: number;
  status: "queued" | "uploading" | "pausing" | "paused" | "cancelling" | "finished";
  progress: UploadProgress;
  retryCount: number;
  checkingCapacity?: boolean;
  capacityIssue?: string;
  cancelled?: boolean;
  stalled?: boolean;
  lastProgressAt: number;
  unconfirmedNames?: string[];
};

type Snapshot = {
  jobs: readonly UploadJob[];
  revisions: Readonly<Record<string, number>>;
};

type ActiveUpload = {
  id: string; controller: AbortController; pauseController: AbortController;
  intent?: "pause" | "cancel"; checking: boolean;
};

export function emptyProgress(): UploadProgress {
  return {
    total: 0, done: 0, duplicate: 0, retryableFailed: 0, terminalFailed: 0,
    skipped: 0, cancelled: 0, unconfirmed: 0, inFlight: 0, retrying: false, paused: false, errors: [],
  };
}

export function uploadSummary(job: UploadJob) {
  const p = job.progress;
  const counts = {
    uploaded: p.done, duplicates: p.duplicate, failed: p.retryableFailed + p.terminalFailed,
    skipped: p.skipped, cancelled: p.cancelled, unconfirmed: p.unconfirmed,
  };
  return { ...counts, remaining: Math.max(0, job.totalFiles - Object.values(counts).reduce((sum, n) => sum + n, 0)) };
}

// File references, pause state and the runner belong to this store, never to a route component.
export function createUploadManager(
  runner: typeof runUpload,
  preflight?: (tripId: string, files: File[], signal: AbortSignal) => Promise<string | undefined>,
  now: () => number = Date.now,
) {
  let snapshot: Snapshot = { jobs: [], revisions: {} };
  const initialSnapshot = snapshot;
  const listeners = new Set<() => void>();
  const filesByJob = new Map<string, File[]>();
  const uncertainByJob = new Map<string, File[]>();
  let active: ActiveUpload | null = null;
  let sequence = 0;

  const publish = (next: Snapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const updateJob = (id: string, patch: Partial<UploadJob>) => {
    publish({ ...snapshot, jobs: snapshot.jobs.map((job) => job.id === id ? { ...job, ...patch } : job) });
  };
  const refreshGallery = (tripId: string) => publish({ ...snapshot, revisions: {
    ...snapshot.revisions, [tripId]: (snapshot.revisions[tripId] ?? 0) + 1,
  } });
  const cancelProgress = (job: UploadJob): UploadProgress => {
    const p = job.progress;
    const unconfirmed = Math.min(job.totalFiles - p.done - p.duplicate - p.terminalFailed - p.skipped, p.unconfirmed + p.inFlight);
    return {
      ...p, paused: false, retrying: false, inFlight: 0, halted: undefined,
      unconfirmed, retryableFailed: 0,
      cancelled: Math.max(0, job.totalFiles - p.done - p.duplicate - p.terminalFailed - p.skipped - unconfirmed),
    };
  };

  async function drain() {
    if (active) return;
    const job = snapshot.jobs.find((candidate) => candidate.status === "queued");
    if (!job) return;
    const files = filesByJob.get(job.id) ?? [];
    const run: ActiveUpload = {
      id: job.id, controller: new AbortController(), pauseController: new AbortController(), checking: !!preflight,
    };
    active = run;
    let lastRefresh = now();
    let lastSaved = 0;
    const base = job.progress;
    const merge = (progress: UploadProgress): UploadProgress => ({
      ...progress,
      total: job.totalFiles - base.skipped - progress.skipped,
      done: base.done + progress.done,
      duplicate: base.duplicate + progress.duplicate,
      terminalFailed: base.terminalFailed + progress.terminalFailed,
      skipped: base.skipped + progress.skipped,
    });
    updateJob(job.id, { status: "uploading", checkingCapacity: !!preflight, capacityIssue: undefined, stalled: false, lastProgressAt: now() });
    try {
      if (preflight) {
        let issue: string | undefined;
        const signal = run.controller.signal;
        const timeout = setTimeout(() => run.controller.abort(new Error("Capacity check timed out. Please retry.")), 30_000);
        let abort: () => void = () => {};
        try {
          const interrupted = new Promise<never>((_, reject) => {
            abort = () => reject(signal.reason);
            if (signal.aborted) abort();
            else signal.addEventListener("abort", abort, { once: true });
          });
          issue = await Promise.race([preflight(job.tripId, files, signal), interrupted]);
        } catch (error) {
          issue = `Couldn’t check upload capacity. ${error instanceof Error ? error.message : "Check your connection and try again."}`;
        } finally {
          clearTimeout(timeout);
          signal.removeEventListener("abort", abort);
        }
        if (active !== run) return;
        if (run.intent === "cancel") {
          updateJob(job.id, { status: "finished", cancelled: true, checkingCapacity: false, retryCount: 0, progress: cancelProgress(job) });
          filesByJob.delete(job.id);
          uncertainByJob.delete(job.id);
          return;
        }
        if (run.intent === "pause") {
          updateJob(job.id, { status: "paused", checkingCapacity: false, retryCount: files.length });
          return;
        }
        if (issue) {
          updateJob(job.id, { status: "finished", checkingCapacity: false, capacityIssue: issue, retryCount: files.length });
          return;
        }
        run.checking = false;
        updateJob(job.id, { checkingCapacity: false });
      }
      const result = await runner(job.tripId, files, {
        folderId: job.folderId,
        signal: run.controller.signal,
        shouldPause: () => run.intent === "pause",
        pauseSignal: run.pauseController.signal,
        isCancelled: () => run.intent === "cancel",
        unconfirmedFiles: uncertainByJob.get(job.id),
        onProgress: (progress) => {
          if (active !== run) return;
          const merged = merge(progress);
          const previous = snapshot.jobs.find((candidate) => candidate.id === job.id)!;
          const activity = (p: UploadProgress) => p.done + p.duplicate + p.terminalFailed + p.retryableFailed;
          const advanced = activity(previous.progress) !== activity(merged) || previous.progress.paused !== merged.paused;
          updateJob(job.id, { progress: merged, ...(advanced ? { lastProgressAt: now(), stalled: false } : {}) });
          const saved = progress.done + progress.duplicate;
          if (saved > lastSaved && now() - lastRefresh >= 5000) {
            lastRefresh = now(); lastSaved = saved;
            refreshGallery(job.tripId);
          }
        },
      });
      if (active !== run) return;
      const cancelled = run.intent === "cancel" || result.cancelled === true;
      const paused = !cancelled && result.retry.length > 0 && (run.intent === "pause" || result.paused === true);
      if (result.retry.length && !cancelled) filesByJob.set(job.id, result.retry);
      else filesByJob.delete(job.id);
      if (!cancelled && result.unconfirmedFiles?.length) uncertainByJob.set(job.id, result.unconfirmedFiles);
      else uncertainByJob.delete(job.id);
      updateJob(job.id, {
        status: paused ? "paused" : "finished", progress: merge(result.progress),
        retryCount: cancelled ? 0 : result.retry.length, cancelled, stalled: false,
        unconfirmedNames: result.unconfirmedFiles?.map((file) => file.name),
      });
    } catch (error) {
      if (active !== run) return;
      const latest = snapshot.jobs.find((candidate) => candidate.id === job.id)!;
      if (run.intent === "cancel") {
        filesByJob.delete(job.id); uncertainByJob.delete(job.id);
        updateJob(job.id, { status: "finished", cancelled: true, retryCount: 0, stalled: false, progress: cancelProgress(latest) });
      } else {
        // Without a runner result we cannot reconcile individual files. Do not report them as
        // definitely failed: some may already have reached the server before the interruption.
        uncertainByJob.set(job.id, files);
        updateJob(job.id, {
          status: "finished", retryCount: files.length, stalled: false,
          unconfirmedNames: files.map((file) => file.name),
          progress: {
            ...base, paused: false, retrying: false, inFlight: 0,
            retryableFailed: 0, unconfirmed: files.length,
            errors: [{ name: "Upload interrupted", reason: error instanceof Error ? error.message : "Please retry this upload." }],
          },
        });
      }
    } finally {
      if (active === run) {
        active = null;
        refreshGallery(job.tripId);
        void drain();
      }
    }
  }

  function queueAgain(job: UploadJob) {
    updateJob(job.id, {
      status: "queued", capacityIssue: undefined, stalled: false,
      progress: { ...job.progress, retryableFailed: 0, halted: undefined, errors: [] },
    });
    void drain();
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => initialSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    enqueue(target: UploadTarget, files: File[]) {
      if (!files.length) return;
      const id = `upload-${++sequence}`;
      filesByJob.set(id, [...files]);
      publish({ ...snapshot, jobs: [...snapshot.jobs, {
        ...target, id, totalFiles: files.length, status: "queued", lastProgressAt: now(),
        progress: { ...emptyProgress(), total: files.length }, retryCount: 0,
      }] });
      void drain();
      return id;
    },
    pause(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (!job) return;
      if (job.status === "queued") { updateJob(id, { status: "paused" }); return; }
      if (job.status !== "uploading" || active?.id !== id) return;
      active.intent = "pause";
      updateJob(id, { status: "pausing", stalled: false });
      active.pauseController.abort();
      if (active.checking) active.controller.abort();
    },
    resume(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (job?.status === "paused") queueAgain(job);
    },
    cancel(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (!job || job.cancelled || (job.status === "finished" && !job.retryCount)) return;
      if (active?.id === id) {
        active.intent = "cancel";
        updateJob(id, { status: "cancelling", stalled: false });
        active.controller.abort(new DOMException("Upload cancelled", "AbortError"));
      } else {
        filesByJob.delete(id); uncertainByJob.delete(id);
        updateJob(id, { status: "finished", cancelled: true, retryCount: 0, capacityIssue: undefined, checkingCapacity: false, stalled: false, progress: cancelProgress(job) });
      }
    },
    retry(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (job?.status === "finished" && job.retryCount && !job.cancelled) queueAgain(job);
    },
    checkStalls() {
      const job = snapshot.jobs.find((candidate) => candidate.id === active?.id);
      if (!job || job.checkingCapacity || job.progress.paused || job.status === "cancelling") return;
      const stalled = now() - job.lastProgressAt >= 60_000;
      if (stalled !== !!job.stalled) updateJob(job.id, { stalled });
    },
    dismiss(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (!job || job.status !== "finished" || job.retryCount) return;
      filesByJob.delete(id); uncertainByJob.delete(id);
      publish({ ...snapshot, jobs: snapshot.jobs.filter((candidate) => candidate.id !== id) });
    },
    removeBlocked(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (!job || job.status !== "finished" || !job.capacityIssue) return;
      filesByJob.delete(id); uncertainByJob.delete(id);
      publish({ ...snapshot, jobs: snapshot.jobs.filter((candidate) => candidate.id !== id) });
    },
    reset() {
      const previous = active;
      active = null;
      previous?.controller.abort();
      filesByJob.clear(); uncertainByJob.clear();
      publish({ jobs: [], revisions: {} });
    },
  };
}

export type UploadManager = ReturnType<typeof createUploadManager>;
