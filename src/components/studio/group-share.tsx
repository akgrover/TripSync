"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Printer, QrCode, Download, Share2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import { joinLink, qrJoinLink } from "@/lib/studio/config";
import { getCachedMe } from "@/lib/studio/profile";
import type { StudioTrip } from "@/lib/studio/types";
import { Dialog } from "./dialog";
import { QrPoster } from "./qr-poster";

// Short message a photographer can paste anywhere (WhatsApp, email). Plain link (not the ?src=qr
// variant) so a tap in chat still bounces straight to the store when the app isn't installed.
function shareMessage(trip: StudioTrip): string {
  return [
    `Get all your photos from "${trip.title}" on TripSync 📸`,
    `Open on your phone: ${joinLink(trip.inviteCode ?? "")}`,
    `Invite code: ${trip.inviteCode ?? ""}`,
  ].join("\n");
}

export function GroupShare({ trip }: { trip: StudioTrip }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  // The signed-in photographer's logo, used to brand the poster. Null until loaded / if unset.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void getCachedMe()
      .then((user) => {
        if (active) setLogoUrl(user.logoUrl ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (!trip.inviteCode) {
    return null;
  }
  const code = trip.inviteCode;
  const posterUrl = qrJoinLink(code);

  async function share() {
    try {
      await navigator.clipboard.writeText(shareMessage(trip));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked (rare on https) — no-op.
    }
  }

  function downloadPng() {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) {
      return;
    }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `tripsync-${code}.png`;
    a.click();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Share2 className="h-4 w-4" />}
          {copied ? "Copied!" : "Share"}
        </button>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <QrCode className="h-4 w-4" />
          QR code
        </button>
      </div>

      <Dialog open={qrOpen} onClose={() => setQrOpen(false)} title="QR poster">
        <p className="mb-3 text-sm text-slate-500">
          Print this and place it at your event. Guests scan it to get the app and join{" "}
          <span className="font-medium text-slate-700">{trip.title}</span>.
        </p>

        {/* Printable A5 poster (preview scaled to half). */}
        <div className="flex justify-center">
          <QrPoster trip={trip} logoUrl={logoUrl} />
        </div>

        {/* Hidden high-res canvas, used only to export a PNG of the QR itself. */}
        <div ref={canvasWrapRef} className="hidden" aria-hidden>
          <QRCodeCanvas value={posterUrl} size={1024} level="M" marginSize={2} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={downloadPng}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            QR PNG
          </button>
        </div>
      </Dialog>
    </>
  );
}
