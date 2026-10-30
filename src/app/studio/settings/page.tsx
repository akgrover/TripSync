"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { GOOGLE_CLIENT_ID } from "@/lib/studio/config";
import type { StudioUser } from "@/lib/studio/types";
import { GoogleSignInButton } from "@/components/studio/google-signin-button";
import { WatermarkPreview } from "@/components/studio/watermark-preview";

const DEFAULT_OPACITY = 0.34;

export default function StudioSettingsPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [user, setUser] = useState<StudioUser | null>(null);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [watermark, setWatermark] = useState("");
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [savingWatermark, setSavingWatermark] = useState(false);
  const [watermarkSaved, setWatermarkSaved] = useState(false);

  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  async function linkGoogle(idToken: string) {
    if (linking) {
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      const res = await studioApi.linkGoogle(idToken);
      setUser(res.user);
    } catch (err) {
      setLinkError(
        err instanceof ApiError ? err.message : "Couldn't connect Google. Please try again.",
      );
    } finally {
      setLinking(false);
    }
  }

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await studioApi.getMe();
        if (!active) return;
        setUser(res.user);
        setName(res.user.name ?? "");
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

  async function saveName() {
    const value = name.trim();
    if (value.length < 2 || savingName) {
      return;
    }
    setSavingName(true);
    setNameSaved(false);
    try {
      const res = await studioApi.updateName(value);
      setUser(res.user);
      setNameSaved(true);
    } catch {
      // Leave the field as-is; the server value reloads on next visit.
    } finally {
      setSavingName(false);
    }
  }

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
  // Hide watermark settings when the plan doesn't include it (only on an explicit false, so an older
  // /me payload without entitlements still shows them).
  const showWatermark = user?.entitlements?.features?.watermark !== false;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-500">Manage your profile and how your photos are presented.</p>

      {/* Profile */}
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => {
                  setNameSaved(false);
                  setName(e.target.value);
                }}
                maxLength={80}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={name.trim().length < 2 || savingName || name.trim() === user?.name}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              >
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : nameSaved ? <Check className="h-4 w-4" /> : null}
                Save
              </button>
            </div>
          </div>
          {user?.phone ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">{user.phone}</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* Sign-in methods */}
      {GOOGLE_CLIENT_ID ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Sign-in methods</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Connect another way to sign in so you&apos;re never locked out.
            </p>
          </div>
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">Google</p>
                <p className="text-xs text-slate-500">
                  {user?.linkedMethods?.google
                    ? (user.email ?? "Connected")
                    : "Not connected"}
                </p>
              </div>
              {user?.linkedMethods?.google ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  <Check className="h-3.5 w-3.5" />
                  Connected
                </span>
              ) : linking ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting…
                </span>
              ) : (
                <GoogleSignInButton
                  text="signin_with"
                  width={220}
                  onCredential={(idToken) => void linkGoogle(idToken)}
                />
              )}
            </div>
            {linkError ? <p className="mt-3 text-sm text-red-600">{linkError}</p> : null}
          </div>
        </section>
      ) : null}

      {/* Watermark */}
      {showWatermark ? (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Watermark</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            When you turn on watermarking for an event, guests see this text tiled across each photo
            until you give them access. Turn it on per event in the group&apos;s settings.
          </p>
        </div>
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
      ) : null}
    </div>
  );
}
