"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Sparkles, Stamp } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { SaveButton } from "@/components/studio/save-button";
import { clearTokens } from "@/lib/studio/auth";
// Plan section temporarily hidden from the settings tab (kept for when billing goes live).
// import { PlanSection } from "@/components/studio/plan-section";
import type { StudioUser } from "@/lib/studio/types";
import { hasWatermarkEntitlement } from "@/lib/studio/watermark";
import { WatermarkPreview } from "@/components/studio/watermark-preview";

const DEFAULT_OPACITY = 0.34;

export default function StudioSettingsPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [user, setUser] = useState<StudioUser | null>(null);

  const [watermark, setWatermark] = useState("");
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [savingWatermark, setSavingWatermark] = useState(false);
  const [watermarkSaved, setWatermarkSaved] = useState(false);
  const [watermarkError, setWatermarkError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getMe();
        if (!active) return;
        setUser(res.user);
        setWatermark(res.user.watermarkText ?? "");
        setOpacity(res.user.watermarkOpacity ?? DEFAULT_OPACITY);
        setStatus("ready");
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          window.location.replace("/studio/login");
          return;
        }
        setStatus("error");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function saveWatermark() {
    if (savingWatermark) {
      return;
    }
    setSavingWatermark(true);
    setWatermarkSaved(false);
    setWatermarkError(null);
    try {
      const res = await studioApi.setWatermarkStyle(watermark.trim(), opacity);
      setUser(res.user);
      setWatermarkSaved(true);
    } catch (err) {
      // A dead session routes to login like everywhere else; otherwise surface why the save failed
      // (it used to fail silently — the button would just stop with no feedback).
      if (err instanceof ApiError && err.status === 401) {
        clearTokens();
        window.location.replace("/studio/login");
        return;
      }
      setWatermarkError(
        err instanceof ApiError ? err.message : "Couldn't save your watermark. Please try again.",
      );
    } finally {
      setSavingWatermark(false);
    }
  }

  if (status === "loading") {
    return <p className="text-slate-400">Loading…</p>;
  }
  if (status === "error") {
    return (
      <button type="button" onClick={() => window.location.reload()} className="text-red-600">
        Couldn&apos;t load settings. Retry.
      </button>
    );
  }

  const watermarkPlaceholder = user?.name?.trim() || "Your studio name";
  const watermarkDirty =
    watermark.trim() !== (user?.watermarkText ?? "") ||
    opacity !== (user?.watermarkOpacity ?? DEFAULT_OPACITY);
  // The watermark section is for photographers. We show it to anyone who owns an event group
  // (`isHost`) AND to anyone who declared the "photographer" role at sign-up but hasn't created a
  // group yet — saving the style (text/opacity) is allowed server-side and primes the preset, so
  // they can set it up up front and it's ready for their first event. Guests don't see it. We show
  // it to EVERY photographer even without the paid entitlement (an upsell note replaces hiding the
  // section). `isHost !== false` safe-defaults an older /me payload (no isHost) to shown.
  const isHostUser = user?.role === "photographer" || user?.isHost !== false;
  const watermarkEntitled = hasWatermarkEntitlement(user);
  // Pay-to-unlock photographers: the watermark is applied automatically (on until the event is paid)
  // and doesn't depend on the plan's watermark feature — so the copy + the Pro upsell differ.
  const isRevShare = user?.eventBillingMode === "rev_share";

  return (
    <div>
      <header className="max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200/70 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          <Sparkles className="h-3.5 w-3.5" />
          Delivery preferences
        </div>
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-slate-950 sm:text-4xl">Settings</h1>
        <p className="mt-2 text-base leading-7 text-slate-500">
          Set your default photo protection once and preview exactly what clients will see.
        </p>
      </header>

      {/* Watermark */}
      {isHostUser ? (
        <section className="shadow-card mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Stamp className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-950">Watermark protection</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                {isRevShare
                  ? "Applied automatically to pay-to-unlock events until payment is complete."
                  : "Use this preset whenever you enable watermarking inside an event."}
              </p>
            </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              {isRevShare ? "Automatic" : "Preset ready"}
            </span>
          </div>
          {!watermarkEntitled && !isRevShare ? (
            <p className="border-b border-slate-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-700">
              Watermarking events is included on <span className="font-semibold">Pro</span> and{" "}
              <span className="font-semibold">Premium</span>. You can set your watermark style now — it
              applies once you upgrade.
            </p>
          ) : null}
          <div className="grid grid-cols-1 items-start gap-8 p-5 sm:p-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(420px,1.18fr)] lg:p-8">
            {/* Controls */}
            <div className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Watermark text</label>
                <input
                  value={watermark}
                  onChange={(e) => {
                    setWatermarkSaved(false);
                    setWatermark(e.target.value);
                  }}
                  placeholder={watermarkPlaceholder}
                  maxLength={40}
                  className="studio-input"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Leave empty to use your name ({watermarkPlaceholder}).
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Opacity</label>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-slate-600">
                    {Math.round(opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={0.6}
                  step={0.05}
                  value={opacity}
                  style={
                    {
                      "--range-fill": `${((opacity - 0.1) / 0.5) * 100}%`,
                    } as React.CSSProperties
                  }
                  onChange={(e) => {
                    setWatermarkSaved(false);
                    setOpacity(Number(e.target.value));
                  }}
                  className="studio-range w-full"
                />
                <p className="mt-1.5 text-xs text-slate-400">
                  Higher is harder to crop out; lower shows the photo more clearly.
                </p>
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <SaveButton
                    dirty={watermarkDirty}
                    saving={savingWatermark}
                    saved={watermarkSaved}
                    onClick={() => void saveWatermark()}
                    label="Save watermark"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {isRevShare
                    ? "New photos use this right away."
                    : "New photos use this right away. To re-apply to an event’s existing photos, use “Re-apply watermark” in that group’s settings."}
                </p>
                {watermarkError ? <p className="mt-2 text-sm text-red-600">{watermarkError}</p> : null}
              </div>
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Client preview</p>
                  <p className="mt-0.5 text-xs text-slate-400">Updates while you edit.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                  {Math.round(opacity * 100)}% opacity
                </span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.45)]">
                <WatermarkPreview
                  text={watermark.trim() || watermarkPlaceholder}
                  opacity={opacity}
                  imageUrl={user?.coverUrl}
                />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Preview only. New photos use the saved style; existing photos can be re-applied from the event.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
          Nothing to configure here yet. Your profile and branding live in the{" "}
          <span className="font-medium text-slate-700">Profile</span> tab.
        </p>
      )}
    </div>
  );
}
