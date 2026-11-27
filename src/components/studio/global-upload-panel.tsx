"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, UploadCloud, X } from "lucide-react";
import { useUploadJobs, useUploadManager } from "./upload-manager-provider";
import { UploadProgressView, uploadStatus } from "./upload-progress";

export function GlobalUploadPanel() {
  const manager = useUploadManager();
  const jobs = useUploadJobs();
  const [expanded, setExpanded] = useState(true);
  if (!jobs.length) return null;
  const current = jobs.find((job) => ["uploading", "pausing", "cancelling"].includes(job.status)) ?? jobs.find((job) => job.status === "paused" || job.retryCount > 0) ?? jobs[jobs.length - 1];
  const activeCount = jobs.filter((job) => !["finished", "paused"].includes(job.status)).length;
  const outstanding = jobs.some((job) => job.status !== "finished" || job.retryCount > 0);

  return (
    <section aria-label="Upload manager" className="fixed inset-x-3 bottom-24 z-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:inset-x-auto md:bottom-5 md:right-5 md:w-96">
      <button type="button" aria-expanded={expanded} aria-controls="studio-upload-jobs" onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
        <span className="rounded-xl bg-teal-50 p-2 text-teal-700"><UploadCloud className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-slate-900">Uploads {activeCount ? `(${activeCount} active)` : ""}</span>
          <span className="block truncate text-xs text-slate-500">{uploadStatus(current)} · {(current.progress.done + current.progress.duplicate).toLocaleString()} / {current.totalFiles.toLocaleString()} · {current.tripName}</span>
        </span>
        {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
      </button>
      {expanded ? (
        <div id="studio-upload-jobs" className="max-h-[50dvh] overflow-y-auto border-t border-slate-100">
          {outstanding ? <p className="px-4 pt-3 text-xs text-slate-500">You can browse Studio. Keep this tab open; refreshing ends this upload session.</p> : null}
          {jobs.map((job) => (
            <article key={job.id} className="border-b border-slate-100 p-4 last:border-0">
              <div className="mb-3 flex items-start justify-between gap-2">
                <Link href={`/studio/group?id=${encodeURIComponent(job.tripId)}${job.folderId ? `&folder=${encodeURIComponent(job.folderId)}` : ""}`}
                  className="min-w-0 text-sm font-semibold text-teal-700 hover:underline">
                  <span className="block truncate">{job.tripName}</span>
                  {job.folderName ? <span className="block truncate text-xs font-normal text-slate-500">{job.folderName}</span> : null}
                </Link>
                {job.status === "finished" && !job.retryCount ? <button type="button" aria-label={`Dismiss upload to ${job.tripName}`} onClick={() => manager.dismiss(job.id)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button> : null}
              </div>
              <UploadProgressView job={job} />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
