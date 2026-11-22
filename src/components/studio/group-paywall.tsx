"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Lock, LockOpen } from "lucide-react";

import { ApiError, studioApi } from "@/lib/studio/api";
import { formatBytes } from "@/lib/studio/format";
import { formatRupees } from "@/lib/studio/money";
import { getCachedMe } from "@/lib/studio/profile";
import type { GroupPaymentLink, StudioTrip } from "@/lib/studio/types";

// Owner-facing pay-to-unlock panel for a rev_share event group. Shows the lock state, the current
// unlock price, and the shareable payment link the photographer copies to their client. The client
// pays on /pay?token=… (no login); the group unlocks automatically via the payment webhook.
export function GroupPaywall({ trip }: { trip: StudioTrip }) {
  const unlocked = trip.revShare?.locked === false;
  const [link, setLink] = useState<GroupPaymentLink | null>(null);
  const [loading, setLoading] = useState(!unlocked);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Clients see the studio name on the pay page; nudge the photographer to set one if it's blank.
  const [missingStudioName, setMissingStudioName] = useState(false);

  useEffect(() => {
    if (unlocked) {
      return;
    }
    let active = true;
    void getCachedMe()
      .then((me) => {
        if (active) setMissingStudioName(!(me.companyName && me.companyName.trim()));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [unlocked]);

  useEffect(() => {
    // Nothing to price once it's unlocked — render handles that case first, so no state change here.
    if (unlocked) {
      return;
    }
    let active = true;
    void studioApi
      .getPaymentLink(trip.id)
      .then((res) => {
        if (active) setLink(res);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof ApiError ? err.message : "Couldn't load the payment link.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trip.id, unlocked]);

  const payUrl =
    link?.payToken && typeof window !== "undefined"
      ? `${window.location.origin}/pay?token=${encodeURIComponent(link.payToken)}`
      : "";

  async function copyLink() {
    if (!payUrl) return;
    try {
      await navigator.clipboard.writeText(payUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy the link. Select and copy it manually.");
    }
  }

  if (unlocked) {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <LockOpen className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Unlocked.</span> Everyone can see and download the original
          photos.
        </span>
      </div>
    );
  }

  return (
    // Neutral card: a group awaiting payment isn't an error, so the surface stays white. Amber is used
    // only as the status accent (the chip + a thin left border); the primary action is teal like the
    // rest of the app.
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-amber-400 bg-white p-4">
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
        <Lock className="h-3 w-3" />
        Locked until paid
      </span>
      <p className="mt-2 text-sm text-slate-600">
        Guests see watermarked previews. Share the payment link — the photos unlock automatically for
        everyone once payment is received.
      </p>

      {loading ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing the link…
        </p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : link?.needsAdminPrice ? (
        <p className="mt-3 text-sm text-slate-600">
          This event is larger than our standard tiers. Contact TripSync to set the unlock price.
        </p>
      ) : link ? (
        <>
          <p className="mt-3 text-sm text-slate-700">
            Unlock price:{" "}
            <span className="font-semibold text-slate-900">
              {link.price ? formatRupees(link.price.amountPaise) : "—"}
            </span>
            {link.price ? (
              <span className="text-slate-400"> · based on {formatBytes(link.storageUsedBytes)} uploaded</span>
            ) : null}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              readOnly
              value={payUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="button"
              onClick={() => void copyLink()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            This is the <span className="font-medium text-slate-600">payment</span> link — different
            from the invite code / QR guests use to view the album.
          </p>
          {missingStudioName ? (
            <p className="mt-2 text-xs text-slate-500">
              Tip: set your{" "}
              <Link href="/studio/profile" className="font-semibold text-teal-700 underline">
                studio name
              </Link>{" "}
              so clients see who they&apos;re paying.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
