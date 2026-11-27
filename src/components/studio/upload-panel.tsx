"use client";

import { useRef, useState } from "react";
import { FolderUp, Images, UploadCloud } from "lucide-react";

import { useUploadJobs, useUploadManager } from "./upload-manager-provider";
import { UploadProgressView } from "./upload-progress";

export function UploadPanel({
  tripId,
  tripName,
  folderId,
  folderName,
  compact = false,
}: {
  tripId: string;
  tripName: string;
  folderId?: string;
  folderName?: string;
  // Slim one-row layout for groups that already have photos, so the uploader doesn't push the grid
  // far down the page. The big illustrated version is used for an empty group.
  compact?: boolean;
}) {
  const manager = useUploadManager();
  const jobs = useUploadJobs();
  const folderJobs = jobs.filter((job) => job.tripId === tripId && job.folderId === folderId);
  const uploading = folderJobs.some((job) => job.status !== "finished");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  function handleFiles(list: FileList | null) {
    if (!list?.length || uploading) return;
    manager.enqueue({ tripId, tripName, folderId, folderName }, Array.from(list));
  }

  // Shared upload actions, reused by both the full and compact layouts.
  const actions = (
    <>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
        className="bg-brand inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
      >
        <UploadCloud className="h-4 w-4" />
        Choose photos
      </button>
      <button
        type="button"
        disabled={uploading}
        onClick={() => folderInput.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
      >
        <FolderUp className="h-4 w-4" />
        Choose folder
      </button>
    </>
  );

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
        className={`shadow-card rounded-2xl border-2 border-dashed transition ${
          compact ? "p-4" : "p-10 text-center"
        } ${dragging ? "scale-[1.01] border-teal-500 bg-teal-50" : "border-slate-200 bg-white"}`}
      >
        {compact ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
                {dragging ? <UploadCloud className="h-5 w-5" /> : <Images className="h-5 w-5" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {dragging ? "Drop to upload" : "Add more photos"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  Drag here, or choose below. JPEG, PNG, WebP, GIF — originals kept full-resolution.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">{actions}</div>
          </div>
        ) : (
          <>
            <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-teal-50" />
              <span className="bg-brand relative flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md">
                {dragging ? <UploadCloud className="h-7 w-7" /> : <Images className="h-7 w-7" />}
              </span>
            </div>
            <p className="text-base font-semibold text-slate-900">
              {dragging ? "Drop to upload" : "Drag photos here to upload"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Originals are kept full-resolution. JPEG, PNG, WebP and GIF are supported.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>
          </>
        )}

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

      {folderJobs.map((job) => (
        <div key={job.id} className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <UploadProgressView job={job} />
        </div>
      ))}
    </div>
  );
}
