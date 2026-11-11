"use client";

import { useEffect, useState } from "react";
import { Flag, Gauge, Loader2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import type { AdminFlag } from "@/lib/studio/types";

const GB = 1024 * 1024 * 1024;

// Classify a free-text identifier: "@" = email, 24-char hex = Mongo user id, else a phone number.
function identify(who: string): { userId?: string; phone?: string; email?: string } {
  return who.includes("@")
    ? { email: who }
    : /^[a-f0-9]{24}$/i.test(who)
      ? { userId: who }
      : { phone: who };
}

function showBytesAsGb(bytes: number | null): string {
  if (bytes === null) return "∞";
  return `${Math.round((bytes / GB) * 10) / 10} GB`;
}

// Human labels for the known feature keys. Unknown keys fall back to the raw key.
const FEATURE_LABELS: Record<string, string> = {
  watermark: "Watermark / proofing",
  fullRes: "Full-resolution downloads",
  folders: "Folders",
};

function label(key: string) {
  return FEATURE_LABELS[key] ?? key;
}

export function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<AdminFlag[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Per-customer override form. A single identifier field accepts phone, email, or user ID.
  const [ovWho, setOvWho] = useState("");
  const [ovFeature, setOvFeature] = useState("watermark");
  const [ovBusy, setOvBusy] = useState(false);
  const [ovResult, setOvResult] = useState<string | null>(null);
  const [ovError, setOvError] = useState<string | null>(null);

  // Per-customer limit form (storage GB + photo count). Blank fields are left unchanged on Apply.
  const [limWho, setLimWho] = useState("");
  const [limGb, setLimGb] = useState("");
  const [limPhotos, setLimPhotos] = useState("");
  const [limBusy, setLimBusy] = useState(false);
  const [limResult, setLimResult] = useState<string | null>(null);
  const [limError, setLimError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await studioApi.getAdminFlags();
        setFlags(res.flags);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  async function toggle(key: string, enabled: boolean) {
    setBusyKey(key);
    try {
      const res = await studioApi.setAdminFlag(key, enabled);
      setFlags(res.flags);
    } catch {
      // Leave as-is; next load reflects the server.
    } finally {
      setBusyKey(null);
    }
  }

  async function applyOverride(value: boolean | null) {
    const who = ovWho.trim();
    if (!who || ovBusy) {
      return;
    }
    // Classify the identifier: an "@" means email, a 24-char hex string is a Mongo user id, anything
    // else is treated as a phone number. The server resolves whichever field we send.
    const identifier = who.includes("@")
      ? { email: who }
      : /^[a-f0-9]{24}$/i.test(who)
        ? { userId: who }
        : { phone: who };
    setOvBusy(true);
    setOvResult(null);
    setOvError(null);
    try {
      const res = await studioApi.setUserOverride({ ...identifier, feature: ovFeature, value });
      const state =
        value === null ? "reset to plan default" : value ? "force-enabled" : "force-disabled";
      setOvResult(`${label(ovFeature)} ${state} for ${res.name}.`);
    } catch (err) {
      setOvError(err instanceof ApiError ? err.message : "Couldn't apply the override.");
    } finally {
      setOvBusy(false);
    }
  }

  async function applyLimits() {
    const who = limWho.trim();
    if (!who || limBusy) {
      return;
    }
    const gb = limGb.trim();
    const photos = limPhotos.trim();
    if (!gb && !photos) {
      setLimError("Enter a storage (GB) and/or a photo count to set.");
      return;
    }
    const body: { storageQuotaBytes?: number; maxPhotosOverride?: number } = {};
    if (gb) {
      const n = Number(gb);
      if (!Number.isFinite(n) || n <= 0) {
        setLimError("Storage must be a positive number of GB.");
        return;
      }
      body.storageQuotaBytes = Math.round(n * GB);
    }
    if (photos) {
      const n = Number(photos);
      if (!Number.isInteger(n) || n <= 0) {
        setLimError("Photos must be a positive whole number.");
        return;
      }
      body.maxPhotosOverride = n;
    }
    setLimBusy(true);
    setLimResult(null);
    setLimError(null);
    try {
      const res = await studioApi.setUserLimits({ ...identify(who), ...body });
      setLimResult(
        `${res.name}: storage ${showBytesAsGb(res.quotaBytes)}, photos ${
          res.photoCap === null ? "∞" : res.photoCap.toLocaleString()
        }.`,
      );
    } catch (err) {
      setLimError(err instanceof ApiError ? err.message : "Couldn't set the limits.");
    } finally {
      setLimBusy(false);
    }
  }

  async function clearLimits() {
    const who = limWho.trim();
    if (!who || limBusy) {
      return;
    }
    setLimBusy(true);
    setLimResult(null);
    setLimError(null);
    try {
      const res = await studioApi.setUserLimits({
        ...identify(who),
        storageQuotaBytes: null,
        maxPhotosOverride: null,
      });
      setLimResult(
        `Cleared overrides for ${res.name} — now on the plan default: storage ${showBytesAsGb(
          res.quotaBytes,
        )}, photos ${res.photoCap === null ? "∞" : res.photoCap.toLocaleString()}.`,
      );
    } catch (err) {
      setLimError(err instanceof ApiError ? err.message : "Couldn't clear the limits.");
    } finally {
      setLimBusy(false);
    }
  }

  if (status === "loading") {
    return null;
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Flag className="h-4 w-4 text-teal-600" />
        Feature flags
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Global kill switches. Turning a feature off disables it for everyone (plan grants ignored);
        turning it on returns control to each customer&apos;s plan + overrides.
      </p>

      {status === "error" ? (
        <p className="mt-4 text-sm text-red-600">Couldn&apos;t load flags.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {(flags ?? []).map((flag) => (
            <li key={flag.key} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{label(flag.key)}</p>
                <p className="text-xs text-slate-500">
                  {flag.enabled ? "On — governed by plan" : "Off — disabled for everyone"}
                  {flag.betaCount > 0 ? ` · ${flag.betaCount} beta` : ""}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={flag.enabled}
                aria-label={label(flag.key)}
                disabled={busyKey === flag.key}
                onClick={() => void toggle(flag.key, !flag.enabled)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
                  flag.enabled ? "bg-teal-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                    flag.enabled ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Per-customer override */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-sm font-medium text-slate-900">Override for a customer</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Force a feature on or off for one account, regardless of their plan. Identify them by phone,
          email, or user ID.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={ovWho}
            onChange={(e) => setOvWho(e.target.value)}
            placeholder="Phone, email, or user ID"
            className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <select
            value={ovFeature}
            onChange={(e) => setOvFeature(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500"
          >
            {(flags ?? []).map((flag) => (
              <option key={flag.key} value={flag.key}>
                {label(flag.key)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={ovBusy || !ovWho.trim()}
            onClick={() => void applyOverride(true)}
            className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            Enable
          </button>
          <button
            type="button"
            disabled={ovBusy || !ovWho.trim()}
            onClick={() => void applyOverride(false)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Disable
          </button>
          <button
            type="button"
            disabled={ovBusy || !ovWho.trim()}
            onClick={() => void applyOverride(null)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Clear
          </button>
          {ovBusy ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
        {ovResult ? <p className="mt-2 text-sm text-teal-700">{ovResult}</p> : null}
        {ovError ? <p className="mt-2 text-sm text-red-600">{ovError}</p> : null}
      </div>

      {/* Per-customer limit override (storage + photo cap) */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Gauge className="h-4 w-4 text-teal-600" />
          Raise a customer&apos;s limits
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Give one account more storage and/or photos without changing their plan (works for Free
          users too). Leave a box blank to keep it as-is. &ldquo;Clear&rdquo; removes both overrides,
          back to the plan default.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={limWho}
            onChange={(e) => setLimWho(e.target.value)}
            placeholder="Phone, email, or user ID"
            className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <input
            value={limGb}
            onChange={(e) => setLimGb(e.target.value)}
            inputMode="decimal"
            placeholder="Storage GB"
            className="w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <input
            value={limPhotos}
            onChange={(e) => setLimPhotos(e.target.value)}
            inputMode="numeric"
            placeholder="Max photos"
            className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="button"
            disabled={limBusy || !limWho.trim()}
            onClick={() => void applyLimits()}
            className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-700 disabled:opacity-60"
          >
            Apply
          </button>
          <button
            type="button"
            disabled={limBusy || !limWho.trim()}
            onClick={() => void clearLimits()}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Clear
          </button>
          {limBusy ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
        </div>
        {limResult ? <p className="mt-2 text-sm text-teal-700">{limResult}</p> : null}
        {limError ? <p className="mt-2 text-sm text-red-600">{limError}</p> : null}
      </div>
    </div>
  );
}
