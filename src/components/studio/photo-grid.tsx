"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, RefreshCw } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import type { StudioPhoto } from "@/lib/studio/types";

// `reload` is a counter the parent bumps (once) after an upload completes, to refetch the first page.
export function PhotoGrid({ tripId, reload = 0 }: { tripId: string; reload?: number }) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  // Manual, user-initiated refresh (e.g. to pick up thumbnails generated after an upload).
  const [refreshTick, setRefreshTick] = useState(0);

  // Fetch page 1 exactly once per (tripId, reload, refreshTick). The ref dedupes repeat effect runs
  // — notably React Strict Mode's double-invoke in dev — so the network call never fires twice.
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${tripId}:${reload}:${refreshTick}`;
    if (fetchedKeyRef.current === key) {
      return;
    }
    fetchedKeyRef.current = key;
    // Don't reset to "loading" on refetches (upload/refresh) — keep the current grid visible and
    // swap in new data when it arrives. Only the initial render shows the loading state.
    void (async () => {
      try {
        const res = await studioApi.getTripPhotos(tripId, { scope: "all" });
        if (fetchedKeyRef.current !== key) return; // a newer request superseded this one
        setPhotos(res.photos);
        setTotal(res.total);
        setNextCursor(res.nextCursor);
        setStatus("ready");
      } catch (err) {
        if (fetchedKeyRef.current !== key) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          window.location.replace("/studio/login");
          return;
        }
        setStatus("error");
      }
    })();
  }, [tripId, reload, refreshTick]);

  async function loadMore() {
    if (!nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const res = await studioApi.getTripPhotos(tripId, { scope: "all", cursor: nextCursor });
      setPhotos((prev) => [...prev, ...res.photos]);
      setNextCursor(res.nextCursor);
      setTotal(res.total);
    } catch {
      // Keep what's shown; the button stays so the user can retry.
    } finally {
      setLoadingMore(false);
    }
  }

  if (status === "loading") {
    return <p className="text-slate-400">Loading photos…</p>;
  }
  if (status === "error") {
    return <p className="text-red-600">Couldn&apos;t load photos. Please retry.</p>;
  }
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No photos yet — upload some above.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {total} {total === 1 ? "photo" : "photos"}
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
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {photos.map((photo) => (
          <div key={photo.id} className="relative aspect-square overflow-hidden rounded-md bg-slate-100">
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
              <div className="flex h-full w-full items-center justify-center text-slate-300">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
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
    </div>
  );
}
