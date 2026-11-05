"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { startPlanCheckout } from "@/lib/studio/billing";
import { formatBytes, formatCount } from "@/lib/studio/format";
import type { PlanOffer, StudioUser } from "@/lib/studio/types";

const FEATURE_LABELS: Record<string, string> = {
  watermark: "Watermark & proofing",
  fullRes: "Full-resolution delivery",
  folders: "Folders",
};

function rupees(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function titleCase(id: string): string {
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : "Free";
}

// Data-driven plan panel: shows the current plan + usage, and renders upgrade options straight from
// the plan catalog (GET /billing/plans), so adding/renaming tiers needs no change here.
export function PlanSection({ user }: { user: StudioUser }) {
  const [plans, setPlans] = useState<PlanOffer[] | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void studioApi
      .getPlans()
      .then((res) => setPlans(res.plans))
      .catch(() => setPlans([]));
  }, []);

  const currentId = user.plan ?? "free";
  const currentLabel = user.planLabel ?? titleCase(currentId);
  const used = user.storageUsedBytes ?? 0;
  const quota = user.storageQuotaBytes; // number | null | undefined; null = unlimited
  const unlimitedStorage = quota == null;
  const pct = !unlimitedStorage && quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  const includedFeatures = Object.entries(user.entitlements?.features ?? {})
    .filter(([, on]) => on)
    .map(([key]) => FEATURE_LABELS[key] ?? key);

  // Upgrade options = tiers above the current one. The API returns paid plans low→high, so anything
  // after the current plan's position is an upgrade (for a free user, that's all of them).
  const currentIdx = plans ? plans.findIndex((p) => p.id === currentId) : -1;
  const upgrades = plans ? plans.filter((_, i) => i > currentIdx) : [];

  async function choose(planId: string) {
    if (busyPlan) {
      return;
    }
    setBusyPlan(planId);
    setError(null);
    setSuccess(null);
    try {
      const outcome = await startPlanCheckout(planId);
      if (outcome === "success") {
        // Confirm, then reload so /me reflects the new plan, caps, and features.
        const label = plans?.find((p) => p.id === planId)?.label ?? "your new plan";
        setSuccess(`Payment successful — you're now on ${label}. Updating…`);
        setTimeout(() => window.location.reload(), 1400);
        return;
      }
      // outcome === "dismissed": the user closed the window; no change, no error.
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Couldn't start checkout. Please try again.",
      );
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Plan</h2>
      </div>
      <div className="space-y-5 p-5">
        {/* Current plan */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
              <Check className="h-4 w-4" />
              {currentLabel}
            </span>
            {user.planRenewsAt && !user.planExpired ? (
              <span className="text-xs text-slate-500">
                Renews{" "}
                {new Date(user.planRenewsAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            ) : null}
          </div>

          {user.planExpired ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Your previous plan expired
              {user.planRenewsAt
                ? ` on ${new Date(user.planRenewsAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`
                : ""}
              . You&apos;re on the Free plan now — choose a plan below to continue.
            </p>
          ) : null}

          {/* Storage usage */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Storage</span>
              <span>
                {unlimitedStorage
                  ? `${formatBytes(used)} used · Unlimited`
                  : `${formatBytes(used)} of ${formatBytes(quota)}`}
              </span>
            </div>
            {!unlimitedStorage ? (
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-teal-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            ) : null}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Photos: {user.photoCap == null ? "Unlimited" : `up to ${formatCount(user.photoCap)}`}
          </p>

          {includedFeatures.length > 0 ? (
            <p className="mt-2 text-xs text-slate-500">Includes: {includedFeatures.join(" · ")}</p>
          ) : null}
        </div>

        {/* Upgrade options (from the catalog) */}
        {upgrades.length > 0 ? (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-900">
              {currentId === "free" ? "Upgrade" : "Change plan"}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upgrades.map((plan) => (
                <div key={plan.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">{plan.label}</p>
                  <p className="mt-0.5 text-lg font-bold text-slate-900">
                    {rupees(plan.amountPaise)}
                    <span className="text-xs font-normal text-slate-400">
                      {" "}
                      / {plan.durationDays >= 360 ? "year" : `${plan.durationDays} days`}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {plan.storageBytes == null
                      ? "Unlimited storage"
                      : `${formatBytes(plan.storageBytes)} storage`}
                    {" · "}
                    {plan.maxPhotos == null
                      ? "Unlimited photos"
                      : `${formatCount(plan.maxPhotos)} photos`}
                  </p>
                  <button
                    type="button"
                    onClick={() => void choose(plan.id)}
                    disabled={busyPlan !== null}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  >
                    {busyPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Choose {plan.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : plans && currentId !== "free" ? (
          <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">
            You&apos;re on the top plan.
          </p>
        ) : null}

        {success ? <p className="text-sm font-medium text-teal-700">{success}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}
