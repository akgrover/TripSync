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
  status: "queued" | "uploading" | "finished";
  progress: UploadProgress;
  retryCount: number;
  checkingCapacity?: boolean;
  capacityIssue?: string;
};

type Snapshot = {
  jobs: readonly UploadJob[];
  // Kept after a job is dismissed so mounted galleries don't miss completion.
  revisions: Readonly<Record<string, number>>;
};

export function emptyProgress(): UploadProgress {
  return {
    total: 0, done: 0, duplicate: 0, retryableFailed: 0, terminalFailed: 0,
    skipped: 0, inFlight: 0, retrying: false, paused: false, errors: [],
  };
}

// File references and the runner belong to this store, never to a route component.
// The injected runner also lets tests exercise navigation/subscription lifetimes without HTTP.
export function createUploadManager(
  runner: typeof runUpload,
  preflight?: (tripId: string, files: File[], signal: AbortSignal) => Promise<string | undefined>,
  now: () => number = Date.now,
) {
  let snapshot: Snapshot = { jobs: [], revisions: {} };
  const initialSnapshot = snapshot;
  const listeners = new Set<() => void>();
  const filesByJob = new Map<string, File[]>();
  let active: { id: string; controller: AbortController } | null = null;
  let sequence = 0;

  const publish = (next: Snapshot) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  const updateJob = (id: string, patch: Partial<UploadJob>) => {
    publish({ ...snapshot, jobs: snapshot.jobs.map((job) => job.id === id ? { ...job, ...patch } : job) });
  };

  async function drain() {
    if (active) return;
    const job = snapshot.jobs.find((candidate) => candidate.status === "queued");
    if (!job) return;
    const files = filesByJob.get(job.id) ?? [];
    const run = { id: job.id, controller: new AbortController() };
    active = run;
    let lastRefresh = now();
    let lastSaved = 0;
    // A manual retry adds new results to previously settled successes/terminal failures.
    const base = job.progress;
    const merge = (progress: UploadProgress): UploadProgress => ({
      ...progress,
      total: job.totalFiles - base.skipped - progress.skipped,
      done: base.done + progress.done,
      duplicate: base.duplicate + progress.duplicate,
      terminalFailed: base.terminalFailed + progress.terminalFailed,
      skipped: base.skipped + progress.skipped,
    });
    updateJob(job.id, { status: "uploading", retryCount: 0, checkingCapacity: !!preflight, capacityIssue: undefined });
    try {
      if (preflight) {
        let issue: string | undefined;
        try {
          issue = await preflight(job.tripId, files, run.controller.signal);
        } catch (error) {
          issue = `Couldn’t check upload capacity. ${error instanceof Error ? error.message : "Check your connection and try again."}`;
        }
        if (active !== run) return;
        if (issue) {
          updateJob(job.id, { status: "finished", checkingCapacity: false, capacityIssue: issue, retryCount: files.length });
          return;
        }
        updateJob(job.id, { checkingCapacity: false });
      }
      const result = await runner(job.tripId, files, {
        folderId: job.folderId,
        signal: run.controller.signal,
        onProgress: (progress) => {
          if (active !== run) return;
          updateJob(job.id, { progress: merge(progress) });
          const saved = progress.done + progress.duplicate;
          if (saved > lastSaved && now() - lastRefresh >= 5000) {
            lastRefresh = now();
            lastSaved = saved;
            publish({ ...snapshot, revisions: {
              ...snapshot.revisions, [job.tripId]: (snapshot.revisions[job.tripId] ?? 0) + 1,
            } });
          }
        },
      });
      if (active !== run) return;
      if (result.retry.length) filesByJob.set(job.id, result.retry);
      else filesByJob.delete(job.id); // Release successful files, retain only retryable files.
      updateJob(job.id, {
        status: "finished", progress: merge(result.progress), retryCount: result.retry.length,
      });
    } catch (error) {
      if (active !== run) return;
      // A runner bug must not strand every queued job. Reconcile uncertain files using the
      // existing server dedup flow on retry; don't count partial callbacks twice.
      updateJob(job.id, {
        status: "finished", retryCount: files.length,
        progress: {
          ...base, paused: false, retrying: false, inFlight: 0,
          retryableFailed: files.length,
          errors: [{ name: "Upload interrupted", reason: error instanceof Error ? error.message : "Please retry this upload." }],
        },
      });
    } finally {
      if (active === run) {
        active = null;
        publish({ ...snapshot, revisions: {
          ...snapshot.revisions, [job.tripId]: (snapshot.revisions[job.tripId] ?? 0) + 1,
        } });
        void drain();
      }
    }
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
        ...target, id, totalFiles: files.length, status: "queued",
        progress: { ...emptyProgress(), total: files.length }, retryCount: 0,
      }] });
      void drain();
      return id;
    },
    retry(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      if (!job || job.status !== "finished" || !job.retryCount) return;
      updateJob(id, {
        status: "queued", retryCount: 0, capacityIssue: undefined,
        progress: { ...job.progress, retryableFailed: 0, halted: undefined, errors: [] },
      });
      void drain();
    },
    dismiss(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      // Never discard active work or the only references to files that still need retrying.
      if (!job || job.status !== "finished" || job.retryCount) return;
      filesByJob.delete(id);
      publish({ ...snapshot, jobs: snapshot.jobs.filter((candidate) => candidate.id !== id) });
    },
    removeBlocked(id: string) {
      const job = snapshot.jobs.find((candidate) => candidate.id === id);
      // Explicit user action releases only the unstarted selection/remaining retry files.
      if (!job || job.status !== "finished" || !job.capacityIssue) return;
      filesByJob.delete(id);
      publish({ ...snapshot, jobs: snapshot.jobs.filter((candidate) => candidate.id !== id) });
    },
    reset() {
      const previous = active;
      active = null;
      previous?.controller.abort();
      filesByJob.clear();
      publish({ jobs: [], revisions: {} });
    },
  };
}

export type UploadManager = ReturnType<typeof createUploadManager>;
