"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Pause, Play, RefreshCw, WifiOff, XCircle } from "lucide-react";
import { uploadSummary, type UploadJob } from "@/lib/studio/upload-manager";
import { useUploadManager } from "./upload-manager-provider";
import { Dialog } from "./dialog";

export function uploadStatus(job: UploadJob) {
  if (job.status === "cancelling") return "Cancelling…";
  if (job.status === "pausing") return job.stalled ? "Pausing — waiting for active files" : "Pausing…";
  if (job.status === "paused") return "Paused";
  if (job.cancelled) return "Upload cancelled";
  if (job.checkingCapacity) return "Checking upload capacity…";
  if (job.capacityIssue) return "Upload needs attention";
  if (job.status === "queued") return "Queued";
  if (job.status === "uploading") {
    if (job.progress.paused) return "Waiting for connection…";
    if (job.stalled) return "Taking longer than expected";
    return job.progress.retrying ? "Retrying…" : "Uploading…";
  }
  if (job.progress.halted) return "Upload stopped";
  if (job.progress.unconfirmed) return "Some uploads need verification";
  if (job.retryCount || uploadSummary(job).remaining) return "Some photos need another try";
  if (job.progress.terminalFailed || job.progress.skipped) return "Finished with issues";
  return "Upload complete";
}

export function UploadProgressView({ job, details = true }: { job: UploadJob; details?: boolean }) {
  const manager = useUploadManager();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const summary = uploadSummary(job);
  const p = job.progress;
  const saved = p.done + p.duplicate;
  const pct = job.totalFiles ? Math.min(100, Math.round(saved / job.totalFiles * 100)) : 0;
  const rejected = p.terminalFailed + p.skipped;
  const canCancel = !job.cancelled && job.status !== "cancelling" && (job.status !== "finished" || job.retryCount > 0);
  return (
    <div className="text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
          {["uploading", "pausing", "cancelling"].includes(job.status) ? (p.paused ? <WifiOff className="h-4 w-4 text-amber-600" /> : <Loader2 className="h-4 w-4 animate-spin text-teal-600" />) : null}
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
          <button type="button" onClick={() => setConfirmCancel(true)} className="mt-2 font-semibold underline">Cancel remaining selection</button>
        </div>
      ) : null}
      {details && job.status === "uploading" && p.paused ? (
        <p className="mt-3 text-xs text-amber-800">Uploading will continue when your connection returns.</p>
      ) : null}
      {details && job.status === "pausing" ? <p className="mt-3 text-xs text-slate-600">{p.inFlight ? `Finishing up to ${p.inFlight} active files.` : "Waiting for the current request to finish."} No new files will start.</p> : null}
      {details && job.status === "paused" ? <p className="mt-3 text-xs text-slate-600">Your remaining files are kept in this tab. Resume whenever you’re ready.</p> : null}
      {details && job.stalled ? <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">No files have finished for at least a minute. A large file or slow connection may be delaying progress. Requests time out automatically; you can pause or cancel.</p> : null}
      {details && job.status === "finished" ? (
        <div aria-label="Upload summary" className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
          <p className="font-semibold">Upload summary · {job.totalFiles.toLocaleString()} selected</p>
          <dl className="mt-2 grid gap-y-1">
            {Object.entries({ Uploaded: summary.uploaded, "Already in group": summary.duplicates, "Failed / not uploaded": summary.failed, Skipped: summary.skipped, Cancelled: summary.cancelled, "Need verification": summary.unconfirmed, "Not attempted": summary.remaining }).map(([label, count]) => <div key={label} className="flex justify-between gap-2"><dt>{label}</dt><dd className="tabular-nums">{count.toLocaleString()}</dd></div>)}
          </dl>
          {job.cancelled ? <p className="mt-2">Photos already saved stay in the group. Cancelled files won’t retry automatically.</p> : null}
        </div>
      ) : null}
      {details && p.unconfirmed > 0 ? <div role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
        <p>{p.unconfirmed.toLocaleString()} files may have reached the server before confirmation was interrupted. Check the gallery before {job.cancelled ? "selecting them again" : "retrying"}.</p>
        {job.unconfirmedNames?.length ? <details className="mt-2"><summary className="cursor-pointer">Files to verify</summary><ul className="mt-1 max-h-28 overflow-auto">{job.unconfirmedNames.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ul></details> : null}
      </div> : null}
      {details && p.errors.length > 0 ? (
        <details className="mt-3 text-xs text-slate-600">
          <summary className="cursor-pointer">Attempt history ({p.errors.length} errors)</summary>
          <p className="mt-1">Earlier errors can remain after recovery; the summary shows the current outcome.</p>
          <ul className="mt-2 max-h-28 space-y-1 overflow-auto rounded-lg bg-slate-50 p-2">
            {p.errors.map((error, index) => <li key={`${error.name}-${index}`} className="break-words">{error.name} — {error.reason}</li>)}
          </ul>
        </details>
      ) : null}
      {details ? <div className="mt-3 flex flex-wrap gap-2">
        {["queued", "uploading"].includes(job.status) ? <button type="button" onClick={() => manager.pause(job.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50"><Pause className="h-4 w-4" />Pause</button> : null}
        {job.status === "paused" ? <button type="button" onClick={() => manager.resume(job.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 font-semibold text-white hover:bg-teal-700"><Play className="h-4 w-4" />Resume</button> : null}
        {canCancel ? <button type="button" onClick={() => setConfirmCancel(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 font-medium text-slate-600 hover:bg-red-50 hover:text-red-700"><XCircle className="h-4 w-4" />Cancel remaining</button> : null}
      </div> : null}
      {details && job.status === "finished" && job.retryCount > 0 && !job.cancelled ? (
        <button type="button" onClick={() => manager.retry(job.id)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 font-semibold text-white hover:bg-teal-700">
          <RefreshCw className="h-4 w-4" />{job.capacityIssue ? "Recheck capacity and upload" : `Retry ${job.retryCount.toLocaleString()} remaining`}
        </button>
      ) : null}
      <Dialog open={confirmCancel && canCancel} onClose={() => setConfirmCancel(false)} title="Cancel remaining uploads?">
        <p className="text-sm text-slate-600">Photos already saved to {job.tripName} stay in the group. Files being saved may still appear. You’ll need to select cancelled files again to upload them later.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium">Keep upload</button>
          <button type="button" onClick={() => { manager.cancel(job.id); setConfirmCancel(false); }} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">Cancel upload</button>
        </div>
      </Dialog>
    </div>
  );
}
