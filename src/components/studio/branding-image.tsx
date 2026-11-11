"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { ApiError, putToS3, studioApi } from "@/lib/studio/api";
import type { StudioUser } from "@/lib/studio/types";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES: Record<"logo" | "cover", number> = {
  logo: 2 * 1024 * 1024,
  cover: 6 * 1024 * 1024,
};

// Logo / cover uploader for the photographer profile. init → S3 PUT → complete, with a client-side
// type + size check (the API re-checks size on complete). Reports the refreshed user via onUpdated.
export function BrandingImage({
  kind,
  label,
  hint,
  currentUrl,
  onUpdated,
}: {
  kind: "logo" | "cover";
  label: string;
  hint: string;
  currentUrl?: string | null;
  onUpdated: (user: StudioUser) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | "upload" | "remove">(null);
  const [error, setError] = useState<string | null>(null);

  const maxMb = MAX_BYTES[kind] / (1024 * 1024);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || busy) {
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      setError("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES[kind]) {
      setError(`That image is too large (max ${maxMb} MB).`);
      return;
    }
    setBusy("upload");
    setError(null);
    try {
      const init = await studioApi.initBranding(kind, file.name, file.type);
      await putToS3(init.uploadUrl, file, file.type);
      const res = await studioApi.completeBranding(kind, init.objectKey);
      onUpdated(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't upload that image. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) {
      return;
    }
    setBusy("remove");
    setError(null);
    try {
      const res = await studioApi.deleteBranding(kind);
      onUpdated(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that image. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-start gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-slate-50 ${
            kind === "logo" ? "h-20 w-20 rounded-xl" : "h-20 w-36 rounded-lg"
          }`}
        >
          {currentUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
            <img src={currentUrl} alt={`${label} preview`} className="h-full w-full object-contain" />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-300" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy !== null}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {busy === "upload" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {currentUrl ? "Replace" : "Upload"}
            </button>
            {currentUrl ? (
              <button
                type="button"
                onClick={() => void remove()}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {busy === "remove" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
          {error ? <p className="mt-1.5 text-sm text-red-600">{error}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => void onFile(e)}
      />
    </div>
  );
}
