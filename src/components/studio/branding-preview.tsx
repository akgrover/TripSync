"use client";

import { MessageCircle, Phone } from "lucide-react";

// A live, read-only preview of how a photographer's branding appears to guests — mirrors the album /
// pay-page header (cover banner + logo + studio name) and the "Your photographer" contact row.
// Updates as the studio name / phone change; cover + logo reflect the last saved uploads.
export function BrandingPreview({
  companyName,
  studioPhone,
  logoUrl,
  coverUrl,
}: {
  companyName: string;
  studioPhone: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
}) {
  const name = companyName.trim();
  const phone = studioPhone.trim();
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Guest preview</p>
          <p className="mt-0.5 text-xs text-slate-400">Your album header and contact card.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
          Live
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_22px_50px_-28px_rgba(15,23,42,0.5)]">
        {/* Cover banner with the logo + studio name overlaid, exactly like the guest album header. */}
        <div className="relative h-52 w-full bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, static export
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
          <div className="absolute inset-x-5 bottom-4 flex items-end gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, static export
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-white/85 shadow-lg"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-base font-bold text-teal-700 ring-2 ring-white/85 shadow-lg">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">
                Your photographer
              </p>
              <p className="mt-0.5 truncate text-lg font-bold text-white drop-shadow-sm">
                {name || "Your studio name"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact row (Call / WhatsApp), shown to guests only when a studio phone is set. */}
        <div className="p-4">
          {phone ? (
            <div>
              <p className="mb-3 text-xs font-medium text-slate-500">Need help finding your photos?</p>
              <div className="grid grid-cols-2 gap-2">
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-50 px-3 py-2.5 text-xs font-semibold text-teal-700">
                <Phone className="h-3.5 w-3.5" />
                Call
              </span>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Add a studio phone to show Call / WhatsApp buttons to guests.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
