"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Images, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import type { StudioPhoto } from "@/lib/studio/types";
import { mergePhotos, refreshGallery } from "@/lib/studio/live-gallery";
import { useUploadJobs } from "./upload-manager-provider";
import { Dialog } from "./dialog";

// `reload` advances periodically as uploads land, and once more when the job finishes.
// `canDelete` (owner) enables per-photo delete-for-everyone. `folder` (a folder id) filters to that
// folder; undefined shows the whole group.
export function PhotoGrid(props: React.ComponentProps<typeof PhotoGridContent>) {
  return <PhotoGridContent key={`${props.tripId}:${props.folder ?? "all"}`} {...props} />;
}

function PhotoGridContent({
  tripId,
  folder,
  reload = 0,
  canDelete = false,
  uploadAvailable = false,
}: {
  tripId: string;
  folder?: string;
  reload?: number;
  canDelete?: boolean;
  // When true, an upload dropzone is shown just above this grid — so an empty whole-group view renders
  // nothing here (the dropzone IS the empty state) instead of a second, redundant dashed box.
  uploadAvailable?: boolean;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Manual, user-initiated refresh (e.g. to pick up thumbnails generated after an upload).
  const [refreshTick, setRefreshTick] = useState(0);
  // Photo pending delete-for-everyone confirmation.
  const [pendingDelete, setPendingDelete] = useState<StudioPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [arrivals, setArrivals] = useState<StudioPhoto[]>([]);
  const [refreshError, setRefreshError] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const jobs = useUploadJobs();
  const uploading = jobs.some((job) => job.tripId === tripId && job.status !== "finished");
  const sessionRef = useRef<{
    controller: AbortController;
    photos: StudioPhoto[];
    arrivals: StudioPhoto[];
    nextCursor: string | null;
    busy: boolean;
    refreshAgain: boolean;
    pendingOffset: number;
    deleted: Set<string>;
    settleUntil: number;
  } | null>(null);
  const refreshRef = useRef<() => void>(() => {});


  async function confirmDelete() {
    const photo = pendingDelete;
    if (!photo || deleting) {
      return;
    }
    const session = sessionRef.current;
    setDeleting(true);
    try {
      await studioApi.deletePhotoForAll(tripId, photo.id);
      if (sessionRef.current !== session || !session) return;
      session.deleted.add(photo.id);
      session.photos = session.photos.filter((p) => p.id !== photo.id);
      session.arrivals = session.arrivals.filter((p) => p.id !== photo.id);
      setPhotos(session.photos);
      setArrivals(session.arrivals);
      setTotal((t) => Math.max(0, t - 1));
      setPendingDelete(null);
    } catch {
      // Keep the photo; the dialog stays so the user can retry or cancel.
    } finally {
      if (sessionRef.current === session) setDeleting(false);
    }
  }

  useEffect(() => {
    const session = {
      controller: new AbortController(), photos: [] as StudioPhoto[], arrivals: [] as StudioPhoto[],
      nextCursor: null as string | null, busy: false, refreshAgain: false,
      pendingOffset: 0, deleted: new Set<string>(), settleUntil: Date.now() + 120_000,
    };
    sessionRef.current = session;
    let initialized = false;
    const current = () => sessionRef.current === session && !session.controller.signal.aborted;
    const fetchPage = (options: { cursor?: string; ids?: string[]; limit?: number }) =>
      studioApi.getTripPhotos(tripId, { scope: "all", folder, ...options, signal: session.controller.signal });
    const refresh = async () => {
      if (!current()) return;
      if (session.busy) { session.refreshAgain = true; return; }
      session.busy = true;
      try {
        const result = await refreshGallery([...session.arrivals, ...session.photos], fetchPage, session.pendingOffset);
        if (!current()) return;
        const shownIds = new Set(session.photos.map((photo) => photo.id));
        const valid = (photo: StudioPhoto) => !session.deleted.has(photo.id);
        session.photos = result.existing.filter((photo) => shownIds.has(photo.id) && valid(photo));
        session.arrivals = mergePhotos(result.arrivals, result.existing.filter((photo) => !shownIds.has(photo.id))).filter(valid);
        // At the top, insert immediately. While browsing older rows, keep their positions stable.
        if (!session.photos.length || (gridRef.current?.getBoundingClientRect().top ?? 0) >= 0) {
          session.photos = mergePhotos(session.arrivals, session.photos);
          session.arrivals = [];
        }
        if (!initialized) session.nextCursor = result.nextCursor;
        session.pendingOffset = result.pendingOffset;
        initialized = true;
        setPhotos(session.photos);
        setArrivals(session.arrivals);
        setNextCursor(session.nextCursor);
        setTotal(result.total);
        setStatus("ready");
        setRefreshError(false);
      } catch (err) {
        if (!current()) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          window.location.replace("/studio/login");
          return;
        }
        if (!initialized) setStatus("error");
        else setRefreshError(true);
      } finally {
        if (current()) {
          session.busy = false;
          if (session.refreshAgain) { session.refreshAgain = false; void refresh(); }
        }
      }
    };
    refreshRef.current = () => { void refresh(); };
    void refresh();
    // Let asynchronous thumbnails settle after returning to a group or finishing an upload.
    const timer = window.setInterval(() => {
      if (document.hidden || Date.now() > session.settleUntil) return;
      if ([...session.photos, ...session.arrivals].some((photo) => photo.thumbStatus === "pending")) void refresh();
    }, 5000);
    return () => { session.controller.abort(); window.clearInterval(timer); };
  }, [tripId, folder]);

  useEffect(() => {
    if (sessionRef.current) sessionRef.current.settleUntil = Date.now() + 120_000;
    refreshRef.current();
  }, [reload, refreshTick]);

  useEffect(() => {
    if (!uploading) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (sessionRef.current) sessionRef.current.settleUntil = Date.now() + 120_000;
      refreshRef.current();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [uploading]);

  async function loadMore() {
    const session = sessionRef.current;
    if (!session?.nextCursor || session.busy) return;
    session.busy = true;
    setLoadingMore(true);
    try {
      const res = await studioApi.getTripPhotos(tripId, { scope: "all", cursor: session.nextCursor, folder, signal: session.controller.signal });
      if (sessionRef.current !== session || session.controller.signal.aborted) return;
      session.photos = mergePhotos(session.photos, res.photos).filter((photo) => !session.deleted.has(photo.id));
      session.nextCursor = res.nextCursor;
      setPhotos(session.photos);
      setNextCursor(res.nextCursor);
      setTotal(res.total);
    } catch {
      // Keep the loaded pages and allow another attempt.
    } finally {
      if (sessionRef.current === session && !session.controller.signal.aborted) {
        session.busy = false;
        setLoadingMore(false);
        if (session.refreshAgain) { session.refreshAgain = false; refreshRef.current(); }
      }
    }
  }

  function revealArrivals() {
    const session = sessionRef.current;
    if (!session) return;
    session.photos = mergePhotos(session.arrivals, session.photos);
    session.arrivals = [];
    setPhotos(session.photos);
    setArrivals([]);
    gridRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  if (status === "loading") {
    return (
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-md" />
        ))}
      </div>
    );
  }
  if (status === "error") {
    return <button type="button" onClick={() => setRefreshTick((n) => n + 1)} className="text-red-600">Couldn&apos;t load photos. Retry</button>;
  }
  if (photos.length === 0) {
    // A specific folder that's empty: a light inline note.
    if (folder) {
      return (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
          No photos in this folder yet.
        </p>
      );
    }
    // Whole group empty while an upload dropzone is shown above — don't duplicate it.
    if (uploadAvailable) {
      return null;
    }
    // Whole group empty for a viewer who can't upload (guest/member): a proper empty state.
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <span className="relative mb-4 flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-teal-50" />
          <span className="bg-brand relative flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm">
            <Images className="h-6 w-6" />
          </span>
        </span>
        <p className="font-medium text-slate-900">No photos yet</p>
        <p className="mt-1 text-sm text-slate-500">Photos the host adds will appear here.</p>
      </div>
    );
  }

  return (
    <div ref={gridRef}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {total.toLocaleString()} {total === 1 ? "photo" : "photos"}{uploading ? " · Updating live" : ""}
        </p>
        <button
          type="button"
          onClick={() => setRefreshTick((n) => n + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>
      {refreshError ? <p role="status" className="mb-3 text-xs text-amber-700">Couldn&apos;t refresh photos. Your loaded photos are still here; use Refresh to try again.</p> : null}
      {arrivals.length ? <button type="button" onClick={revealArrivals} className="mb-3 w-full rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800">Show {arrivals.length.toLocaleString()} new photos</button> : null}
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-md bg-slate-100"
          >
            {photo.thumbUri ? (
              // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
              <img
                src={photo.thumbUri}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              // Thumbnail not generated yet (worker runs shortly after upload) — avoid pulling the
              // full-size original into the grid; show a light placeholder instead.
              <div title={photo.thumbStatus === "pending" ? "Preparing preview…" : "Preview unavailable"} className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
            {canDelete ? (
              <button
                type="button"
                aria-label="Delete photo for everyone"
                onClick={() => setPendingDelete(photo)}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white opacity-0 backdrop-blur-sm transition hover:bg-red-600 focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Load more
          </button>
        </div>
      ) : null}

      <Dialog
        open={pendingDelete !== null}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Delete this photo?"
      >
        <div className="flex gap-4">
          {pendingDelete?.thumbUri ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
            <img
              src={pendingDelete.thumbUri}
              alt=""
              className="h-20 w-20 shrink-0 rounded-lg object-cover"
            />
          ) : null}
          <p className="text-sm text-slate-600">
            This removes the photo for <span className="font-medium">everyone</span> in the group and
            can&apos;t be undone.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            disabled={deleting}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirmDelete()}
            disabled={deleting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Delete
          </button>
        </div>
      </Dialog>
    </div>
  );
}
