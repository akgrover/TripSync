"use client";

import { AlertTriangle, Loader2, RefreshCw, WifiOff } from "lucide-react";
import type { UploadJob } from "@/lib/studio/upload-manager";
import { useUploadManager } from "./upload-manager-provider";

export function uploadStatus(job: UploadJob) {
  if (job.checkingCapacity) return "Checking upload capacity…";
  if (job.capacityIssue) return "Upload needs attention";
  if (job.status === "queued") return "Queued";
  if (job.status === "uploading") {
    if (job.progress.paused) return "Waiting for connection…";
    return job.progress.retrying ? "Retrying…" : "Uploading…";
  }
  if (job.progress.halted) return "Upload stopped";
  if (job.retryCount) return "Some photos need another try";
  if (job.progress.terminalFailed || job.progress.skipped) return "Finished with issues";
  return "Upload complete";
}

export function UploadProgressView({ job, details = true }: { job: UploadJob; details?: boolean }) {
  const manager = useUploadManager();
  const p = job.progress;
  const saved = p.done + p.duplicate;
  const pct = job.totalFiles ? Math.min(100, Math.round(saved / job.totalFiles * 100)) : 0;
  const rejected = p.terminalFailed + p.skipped;
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
          {job.status === "uploading" ? (p.paused ? <WifiOff className="h-4 w-4 text-amber-600" /> : <Loader2 className="h-4 w-4 animate-spin text-teal-600" />) : null}
          {uploadStatus(job)}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-slate-500">{saved.toLocaleString()} / {job.totalFiles.toLocaleString()}</span>
      </div>
      <div role="progressbar" aria-label={`Photos saved to ${job.tripName}`} aria-valuemin={0} aria-valuemax={job.totalFiles} aria-valuenow={saved}
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>{p.done.toLocaleString()} uploaded</span>
        {p.duplicate > 0 ? <span>{p.duplicate.toLocaleString()} already in group</span> : null}
        {p.retryableFailed > 0 ? <span className="text-amber-700">{p.retryableFailed.toLocaleString()} not uploaded</span> : null}
        {rejected > 0 ? <span>{rejected.toLocaleString()} can&apos;t be uploaded</span> : null}
      </div>
      {details && p.halted ? (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0" />{p.halted.message} Resolve this before retrying.
        </p>
      ) : null}
      {details && job.capacityIssue ? (
        <div role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <p>{job.capacityIssue}</p>
          <p className="mt-2">This attempt has not started. Your selection is kept while this tab stays open.</p>
          <button type="button" onClick={() => manager.removeBlocked(job.id)} className="mt-2 font-semibold underline">Remove remaining selection</button>
        </div>
      ) : null}
      {details && job.status === "uploading" && p.paused ? (
        <p className="mt-3 text-xs text-amber-800">Uploading will continue when your connection returns.</p>
      ) : null}
      {details && p.errors.length > 0 ? (
        <details className="mt-3 text-xs text-slate-600">
          <summary className="cursor-pointer">Recent upload errors ({p.errors.length})</summary>
          <ul className="mt-2 max-h-28 space-y-1 overflow-auto rounded-lg bg-slate-50 p-2">
            {p.errors.map((error, index) => <li key={`${error.name}-${index}`} className="break-words">{error.name} — {error.reason}</li>)}
          </ul>
        </details>
      ) : null}
      {details && job.status === "finished" && job.retryCount > 0 ? (
        <button type="button" onClick={() => manager.retry(job.id)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 font-semibold text-white hover:bg-teal-700">
          <RefreshCw className="h-4 w-4" />{job.capacityIssue ? "Recheck capacity and upload" : `Retry ${job.retryCount.toLocaleString()} remaining`}
        </button>
      ) : null}
    </div>
  );
}
