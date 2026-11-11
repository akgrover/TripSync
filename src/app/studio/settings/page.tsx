"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
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
    try {
      const res = await studioApi.setWatermarkStyle(watermark.trim(), opacity);
      setUser(res.user);
      setWatermarkSaved(true);
    } catch {
      // no-op
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
  // The watermark section is host-only (you own an event group). We show it to EVERY host, even
  // without the paid entitlement: saving the style (text/opacity) is allowed server-side and primes
  // the preset, so an owner can set it up before upgrading. When the plan doesn't include
  // watermarking we show an upsell note instead of hiding the whole section. `!== false` safe-defaults
  // an older /me payload to shown.
  const isHostUser = user?.isHost !== false;
  const watermarkEntitled = hasWatermarkEntitlement(user);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-500">
        How your photos are presented. Your name, face profile, and branding live in{" "}
        <span className="font-medium text-slate-700">Profile</span>.
      </p>

      {/* Watermark */}
      {isHostUser ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Watermark</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              When you turn on watermarking for an event, guests see this text tiled across each photo
              until you give them access. Turn it on per event in the group&apos;s settings.
            </p>
          </div>
          {!watermarkEntitled ? (
            <p className="border-b border-slate-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-700">
              Watermarking events is included on <span className="font-semibold">Pro</span> and{" "}
              <span className="font-semibold">Premium</span>. You can set your watermark style now — it
              applies once you upgrade.
            </p>
          ) : null}
          <div className="space-y-4 p-5">
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Leave empty to use your name ({watermarkPlaceholder}).
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Opacity</label>
                <span className="text-xs text-slate-500">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.6}
                step={0.05}
                value={opacity}
                onChange={(e) => {
                  setWatermarkSaved(false);
                  setOpacity(Number(e.target.value));
                }}
                className="w-full accent-teal-600"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Higher is harder to crop out; lower shows the photo more clearly.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Preview</p>
              <WatermarkPreview text={watermark.trim() || watermarkPlaceholder} opacity={opacity} />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void saveWatermark()}
                disabled={savingWatermark || !watermarkDirty}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {savingWatermark ? <Loader2 className="h-4 w-4 animate-spin" /> : watermarkSaved ? <Check className="h-4 w-4" /> : null}
                Save watermark
              </button>
              <p className="text-xs text-slate-400">
                New photos use this right away. To re-apply to an event&apos;s existing photos, use
                &ldquo;Re-apply watermark&rdquo; in that group&apos;s settings.
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
