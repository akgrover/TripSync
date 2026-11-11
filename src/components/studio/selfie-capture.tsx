"use client";

import { useRef, useState } from "react";
import { Camera, Check, Loader2, RefreshCw } from "lucide-react";

import { ApiError, putToS3, studioApi } from "@/lib/studio/api";
import type { StudioUser } from "@/lib/studio/types";

const MAX_SELFIE_BYTES = 10 * 1024 * 1024; // 10 MB — generous; phone photos are well under.

// Reusable face-profile setup. Drop it anywhere a user may need a reference selfie (Profile now, and
// a future sign-up step). Self-contained: it runs the init → S3 PUT → complete flow and reports the
// refreshed user via `onUpdated`. The API indexes the face and returns 422 if the photo isn't exactly
// one clear face, which we surface as a friendly retake prompt.
export function SelfieCapture({
  user,
  onUpdated,
}: {
  user: StudioUser | null;
  onUpdated: (user: StudioUser) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasSelfie = Boolean(user?.hasReferenceSelfie);
  const avatar = user?.avatarUrl ?? "";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after an error
    if (!file || busy) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SELFIE_BYTES) {
      setError("That image is too large (max 10 MB).");
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const init = await studioApi.initReferenceSelfie(file.name, file.type);
      await putToS3(init.uploadUrl, file, file.type);
      const res = await studioApi.completeReferenceSelfie(init.objectKey);
      onUpdated(res.user);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError(
          "We couldn't find a clear face. Use a front-facing photo of just you — good lighting, no sunglasses or group shots — and try again.",
        );
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't save your selfie. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
          <img src={avatar} alt="Your face profile" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6 text-slate-400" />
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-900">
          {hasSelfie ? "Face profile active" : "No face profile yet"}
        </p>
        <p className="mt-0.5 text-sm text-slate-500">
          {hasSelfie
            ? "Used to find the photos you're in across your groups."
            : "Add a selfie so TripSync can find the photos you're in."}
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking photo…
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : hasSelfie ? (
            <>
              <RefreshCw className="h-4 w-4" />
              Replace selfie
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Add selfie
            </>
          )}
        </button>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => void onFile(e)}
        />
      </div>
    </div>
  );
}
