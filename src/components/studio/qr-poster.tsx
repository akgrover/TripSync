"use client";

import { Aperture } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { qrJoinLink } from "@/lib/studio/config";
import type { StudioTrip } from "@/lib/studio/types";

// The printable A5 QR poster. Rendered at true A5 (148×210mm) with `id="qr-poster"` so the print
// stylesheet in globals.css can isolate + size it; the on-screen preview scales it down.
// A teal brand shape fills the top with a tilted lower edge (not a straight horizontal split); the
// headline sits on it in white, and the QR lives on the white lower half for clean scanning.
export function QrPoster({
  trip,
  logoUrl,
  scale = 0.5,
}: {
  trip: StudioTrip;
  // Photographer's logo (signed URL). Shown in the footer when set; nothing is shown when absent.
  logoUrl?: string | null;
  scale?: number;
}) {
  const code = trip.inviteCode ?? "";
  const posterUrl = qrJoinLink(code);

  return (
    <div
      className="overflow-hidden rounded-xl border border-slate-200 shadow-sm"
      style={{ width: `${148 * scale}mm`, height: `${210 * scale}mm` }}
    >
      <div
        id="qr-poster"
        style={{
          width: "148mm",
          height: "210mm",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          // Keep the teal shape when the browser prints (it strips backgrounds otherwise).
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        }}
        className="relative flex flex-col items-center overflow-hidden bg-white text-center"
      >
        {/* Diagonal brand shape: fills the top, lower edge tilted. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0"
          style={{
            height: "42%",
            background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #2dd4bf 100%)",
            clipPath: "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
          }}
        />

        {/* Top zone (over the teal): brand + event + headline, in white. */}
        <div className="relative flex w-full flex-col items-center px-[13mm] pt-[13mm]" style={{ height: "44%" }}>
          <div className="flex items-center gap-[3mm]">
            <span
              className="flex items-center justify-center rounded-[4mm]"
              style={{ width: "11mm", height: "11mm", background: "rgba(255,255,255,0.22)" }}
            >
              <Aperture style={{ width: "7mm", height: "7mm", color: "#ffffff" }} strokeWidth={2.25} />
            </span>
            <span className="font-extrabold tracking-tight text-white" style={{ fontSize: "20pt" }}>
              TripSync
            </span>
          </div>

          <p
            className="mt-[7mm] font-semibold uppercase"
            style={{ fontSize: "10pt", letterSpacing: "0.22em", color: "rgba(236,253,250,0.95)" }}
          >
            {trip.title}
          </p>
          <h3 className="mt-[2mm] font-extrabold leading-[1.05] text-white" style={{ fontSize: "28pt" }}>
            Get all your photos
          </h3>
          <p className="mt-[4mm] leading-snug" style={{ fontSize: "12.5pt", color: "rgba(236,253,250,0.92)" }}>
            Scan to instantly find every photo you&apos;re in — by face.
          </p>
        </div>

        {/* Lower zone (white): QR + code, then logo + footer pinned to the bottom. */}
        <div className="relative flex w-full flex-1 flex-col items-center justify-between px-[13mm] pb-[12mm]">
          <div className="flex w-full flex-col items-center">
            <div className="rounded-[3mm] bg-white p-[2.5mm]" style={{ width: "62mm", height: "62mm" }}>
              <QRCodeSVG value={posterUrl} level="M" marginSize={0} style={{ width: "100%", height: "100%" }} />
            </div>

            <div
              className="mt-[6mm] inline-flex items-center gap-[3mm] rounded-full border border-teal-100 bg-teal-50 px-[6mm] py-[2.5mm]"
              style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
            >
              <span className="uppercase text-teal-600" style={{ fontSize: "9pt", letterSpacing: "0.14em" }}>
                Code
              </span>
              <span className="font-bold text-slate-900" style={{ fontSize: "17pt", letterSpacing: "0.16em" }}>
                {code}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col items-center">
            {/* Photographer logo — only when they've uploaded one; no placeholder otherwise. */}
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
              <img
                src={logoUrl}
                alt=""
                className="object-contain"
                style={{ maxWidth: "46mm", maxHeight: "18mm" }}
              />
            ) : null}
            <div
              className={logoUrl ? "mt-[5mm]" : ""}
              style={{
                width: "40mm",
                height: "0.6mm",
                background: "linear-gradient(90deg, transparent, #99f6e4, transparent)",
              }}
            />
            <p className="mt-[3mm] text-slate-400" style={{ fontSize: "9pt" }}>
              Powered by TripSync
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
