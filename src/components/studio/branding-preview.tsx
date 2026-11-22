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
      <p className="text-sm font-medium text-slate-700">Preview</p>
      <p className="mt-0.5 text-xs text-slate-400">How guests see you on the album &amp; payment page.</p>

      <div className="shadow-card mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Cover banner with the logo + studio name overlaid, exactly like the guest album header. */}
        <div className="relative h-28 w-full bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, static export
            <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
          <div className="absolute inset-x-3 bottom-2.5 flex items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, static export
              <img
                src={logoUrl}
                alt=""
                className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-white/80"
              />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-teal-700 ring-2 ring-white/80">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                Your photographer
              </p>
              <p className="truncate text-sm font-semibold text-white drop-shadow-sm">
                {name || "Your studio name"}
              </p>
            </div>
          </div>
        </div>

        {/* Contact row (Call / WhatsApp), shown to guests only when a studio phone is set. */}
        <div className="p-3">
          {phone ? (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
                <Phone className="h-3.5 w-3.5" />
                Call
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </span>
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
