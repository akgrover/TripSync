"use client";

import { useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Loader2, RefreshCw, ScanFace, X } from "lucide-react";

import { studioApi } from "@/lib/studio/api";
import type { StudioPhoto, StudioUser } from "@/lib/studio/types";
import { SelfieCapture } from "@/components/studio/selfie-capture";

type Tab = "all" | "you";

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

// Guest-facing photo browser for the web album. "All photos" = scope=all; "Photos of you" = scope=mine
// (face-matched), which needs a face profile first. View (lightbox) + download only — no delete.
// Watermark gating is enforced server-side: a non-exempt guest only ever gets the watermarked URL.
export function AlbumPhotos({
  tripId,
  user,
  onUserUpdated,
  matchedOnly,
}: {
  tripId: string;
  user: StudioUser | null;
  onUserUpdated: (user: StudioUser) => void;
  // When the event is matched-only, guests can only ever see photos they're in — so we drop the
  // "All photos" tab (the backend would return only their photos anyway) and show just "Photos of you".
  matchedOnly: boolean;
}) {
  const [tab, setTab] = useState<Tab>(matchedOnly ? "you" : "all");
  const [photos, setPhotos] = useState<StudioPhoto[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingMore, setLoadingMore] = useState(false);
  const [lightbox, setLightbox] = useState<StudioPhoto | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  // Bumped by the "Refresh" button so a guest can re-check "Photos of you" while face matching catches
  // up after they add a selfie (matching is async on the server).
  const [refreshTick, setRefreshTick] = useState(0);

  const hasSelfie = Boolean(user?.hasReferenceSelfie);
  const needsSelfieForTab = tab === "you" && !hasSelfie;

  // Dedupe the page-1 fetch across React Strict Mode's double-invoke (dev), keyed so a tab/selfie/
  // refresh change refetches.
  const fetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Nothing to fetch without a face profile on the "you" tab — render shows the selfie prompt.
    if (needsSelfieForTab) {
      return;
    }
    const key = `${tab}:${hasSelfie}:${refreshTick}`;
    if (fetchedKeyRef.current === key) {
      return;
    }
    fetchedKeyRef.current = key;
    let active = true;
    void (async () => {
      setStatus("loading");
      try {
        const page = await studioApi.getTripPhotos(tripId, {
          scope: tab === "you" ? "mine" : "all",
          limit: 48,
        });
        if (!active) return;
        setPhotos(page.photos);
        setCursor(page.nextCursor);
        setStatus("ready");
      } catch {
        if (active) setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, [tab, tripId, hasSelfie, needsSelfieForTab, refreshTick]);

  async function loadMore() {
    if (!cursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const page = await studioApi.getTripPhotos(tripId, {
        scope: tab === "you" ? "mine" : "all",
        cursor,
        limit: 48,
      });
      setPhotos((prev) => [...prev, ...page.photos]);
      setCursor(page.nextCursor);
    } catch {
      // Keep what we have; the Load more button stays for a retry.
    } finally {
      setLoadingMore(false);
    }
  }

  async function download(photo: StudioPhoto) {
    setDownloadingId(photo.id);
    try {
      const res = await fetch(photo.uri);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tripsync-${photo.id}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Cross-origin fetch blocked (no bucket CORS) — fall back to opening it so they can save manually.
      window.open(photo.uri, "_blank", "noopener");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div>
      {matchedOnly ? (
        <h2 className="mb-4 text-base font-semibold text-slate-900">Your photos</h2>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <TabButton label="All photos" active={tab === "all"} onClick={() => setTab("all")} />
          <TabButton label="Photos of you" active={tab === "you"} onClick={() => setTab("you")} />
        </div>
      )}

      {needsSelfieForTab ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-slate-900">
            <ScanFace className="h-4 w-4 text-teal-600" />
            Add a selfie to find your photos
          </p>
          <p className="mb-4 text-sm text-slate-500">
            TripSync matches your face against this event to pull out the photos you&apos;re in.
          </p>
          <SelfieCapture user={user} onUpdated={onUserUpdated} />
        </div>
      ) : status === "loading" ? (
        <p className="flex items-center gap-2 py-10 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading photos…
        </p>
      ) : status === "error" ? (
        <p className="py-10 text-sm text-red-600">Couldn&apos;t load photos. Please refresh.</p>
      ) : photos.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">
            {tab === "you"
              ? "Finding your photos… face matching can take a moment after you add a selfie."
              : "No photos have been added to this event yet."}
          </p>
          {tab === "you" ? (
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightbox(photo)}
                className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100"
              >
                {photo.thumbUri || photo.uri ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
                  <img
                    src={photo.thumbUri || photo.uri}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-300">
                    <ImageIcon className="h-6 w-6" />
                  </span>
                )}
              </button>
            ))}
          </div>

          {cursor ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Load more
              </button>
            </div>
          ) : null}
        </>
      )}

      {/* Lightbox */}
      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4"
          role="presentation"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-h-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 URL */}
            <img src={lightbox.uri} alt="" className="max-h-[80vh] w-auto rounded-xl object-contain" />
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void download(lightbox)}
                disabled={downloadingId === lightbox.id}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:opacity-60"
              >
                {downloadingId === lightbox.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </button>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                aria-label="Close"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
