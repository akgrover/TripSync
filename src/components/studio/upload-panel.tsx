"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FolderUp, Loader2, RefreshCw, UploadCloud, WifiOff } from "lucide-react";

import { runUpload, type UploadProgress } from "@/lib/studio/upload";

export function UploadPanel({
  tripId,
  folderId,
  onUploaded,
}: {
  tripId: string;
  folderId?: string;
  onUploaded?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  // Files worth retrying, remembered from the last run so the customer doesn't have to work out
  // which ones failed — one tap re-sends exactly these (dedup skips anything that did get through).
  const [retryFiles, setRetryFiles] = useState<File[]>([]);

  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  async function startRun(files: File[]) {
    if (files.length === 0 || uploading) {
      return;
    }
    setUploading(true);
    setDone(false);
    setProgress(null);
    setRetryFiles([]);
    const result = await runUpload(tripId, files, { onProgress: setProgress, folderId });
    setProgress(result.progress);
    setRetryFiles(result.retry);
    setUploading(false);
    setDone(true);
    onUploaded?.();
  }

  function handleFiles(list: FileList | null) {
    void startRun(list ? Array.from(list) : []);
  }

  const cantUpload = progress ? progress.terminalFailed + progress.skipped : 0;
  const processed = progress
    ? progress.done + progress.duplicate + progress.retryableFailed + progress.terminalFailed
    : 0;
  // Hold the bar full during the auto-retry sweep (retryableFailed resets to 0 then climbs again,
  // which would otherwise make the bar jump backward for a moment).
  const pct = progress?.retrying
    ? 100
    : progress && progress.total > 0
      ? Math.round((processed / progress.total) * 100)
      : 0;

  const statusLabel = (() => {
    if (!progress) return "";
    if (uploading && progress.paused) return "Waiting for connection…";
    if (uploading && progress.retrying) return "Retrying…";
    if (uploading) return "Uploading…";
    if (progress.halted) return "Upload stopped";
    if (progress.retryableFailed > 0) return "Finished — some photos need another try";
    return "Upload complete";
  })();

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragging ? "border-teal-500 bg-teal-50" : "border-slate-300 bg-white"
        }`}
      >
        <UploadCloud className="mx-auto h-8 w-8 text-teal-600" />
        <p className="mt-3 font-medium text-slate-900">Drag photos here to upload</p>
        <p className="mt-1 text-sm text-slate-500">
          Originals are kept full-resolution. JPEG, PNG, WebP and GIF are supported.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" />
            Choose photos
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => folderInput.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <FolderUp className="h-4 w-4" />
            Choose folder
          </button>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={(el) => {
            if (el) {
              // webkitdirectory isn't in React's input typings — set it directly for folder picking.
              el.setAttribute("webkitdirectory", "");
              el.setAttribute("directory", "");
              folderInput.current = el;
            }
          }}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {progress ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-900">
              {uploading ? (
                <span className="inline-flex items-center gap-1.5">
                  {progress.paused ? (
                    <WifiOff className="h-4 w-4 text-amber-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  )}
                  {statusLabel}
                </span>
              ) : (
                statusLabel
              )}
            </span>
            <span className="text-slate-500">
              {processed} / {progress.total}
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>{progress.done} uploaded</span>
            {progress.duplicate > 0 ? <span>{progress.duplicate} already in group</span> : null}
            {progress.retryableFailed > 0 ? (
              <span className="text-red-600">{progress.retryableFailed} didn&apos;t upload</span>
            ) : null}
            {cantUpload > 0 ? <span>{cantUpload} can&apos;t be uploaded</span> : null}
          </div>

          {/* Pause notice while a run is live but the network is down. */}
          {uploading && progress.paused ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                You&apos;re offline — uploading is paused and will continue automatically when the
                connection returns.
              </span>
            </div>
          ) : null}

          {progress.halted ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{progress.halted.message}</span>
            </div>
          ) : null}

          {/* The one-tap recovery: re-sends exactly the files that still need it. */}
          {done && retryFiles.length > 0 ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                {retryFiles.length} {retryFiles.length === 1 ? "photo" : "photos"} didn&apos;t upload.
                {progress.halted ? " Fix the issue above, then try again." : " We already retried once automatically."}
              </p>
              <button
                type="button"
                onClick={() => void startRun(retryFiles)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                <RefreshCw className="h-4 w-4" />
                Retry {retryFiles.length} {retryFiles.length === 1 ? "photo" : "photos"}
              </button>
            </div>
          ) : null}

          {done && cantUpload > 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              {cantUpload} {cantUpload === 1 ? "photo" : "photos"} can&apos;t be uploaded — the format
              is unsupported or the file is damaged. These won&apos;t be retried.
            </p>
          ) : null}

          {progress.errors.length > 0 ? (
            <ul className="mt-3 max-h-32 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              {progress.errors.map((e, i) => (
                <li key={`${e.name}-${i}`} className="truncate">
                  <span className="text-slate-700">{e.name}</span> — {e.reason}
                </li>
              ))}
            </ul>
          ) : null}

          {done ? (
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setProgress(null);
                setRetryFiles([]);
              }}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Upload more
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
