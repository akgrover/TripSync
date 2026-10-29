"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FolderUp, Loader2, UploadCloud } from "lucide-react";

import { runUpload, type UploadProgress } from "@/lib/studio/upload";

export function UploadPanel({ tripId, onUploaded }: { tripId: string; onUploaded?: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  async function handleFiles(list: FileList | null) {
    const files = list ? Array.from(list) : [];
    if (files.length === 0 || uploading) {
      return;
    }
    setUploading(true);
    setDone(false);
    setProgress(null);
    const result = await runUpload(tripId, files, { onProgress: setProgress });
    setProgress(result);
    setUploading(false);
    setDone(true);
    onUploaded?.();
  }

  const processed = progress ? progress.done + progress.duplicate + progress.error : 0;
  const pct = progress && progress.total > 0 ? Math.round((processed / progress.total) * 100) : 0;

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
          void handleFiles(e.dataTransfer.files);
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
            void handleFiles(e.target.files);
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
            void handleFiles(e.target.files);
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
                  <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                  Uploading…
                </span>
              ) : progress.halted ? (
                "Upload stopped"
              ) : (
                "Upload complete"
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
            {progress.error > 0 ? <span className="text-red-600">{progress.error} failed</span> : null}
            {progress.skipped > 0 ? <span>{progress.skipped} skipped</span> : null}
          </div>

          {progress.halted ? (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{progress.halted.message}</span>
            </div>
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
