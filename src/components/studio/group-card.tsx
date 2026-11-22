"use client";

import { ArrowRight, ImageOff } from "lucide-react";

import { joinLink } from "@/lib/studio/config";
import type { StudioTrip } from "@/lib/studio/types";
import { CopyButton } from "./copy-button";

export function GroupCard({ trip, onOpen }: { trip: StudioTrip; onOpen: () => void }) {
  const memberCount = trip.members?.length ?? 0;
  const photoCount = trip.photoCount ?? 0;
  const isEvent = trip.storageMode === "single_payer";
  const meta = `${memberCount} ${memberCount === 1 ? "member" : "members"} · ${
    photoCount === 1 ? "1 photo" : `${photoCount} photos`
  }`;

  return (
    <div className="shadow-card lift overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full text-left"
        aria-label={`Open ${trip.title}`}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
          {trip.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
            <img
              src={trip.coverUrl}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          {/* Soft top scrim so the badges stay legible over bright photos. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/20 to-transparent" />
          {/* Badges grouped top-left as one set. Both use the same dark translucent pill; the
              pay-to-unlock status carries a small colored dot instead of a competing fill, so a
              photographer sees at a glance which events are still locked. */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span className="rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {isEvent ? "Event" : "Shared"}
            </span>
            {trip.accessModel === "rev_share" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    trip.revShare?.locked ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                {trip.revShare?.locked ? "Locked" : "Unlocked"}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">{trip.title}</h3>
            <p className="truncate text-sm text-slate-500">{meta}</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-teal-600" />
        </div>
      </button>
      {trip.inviteCode ? (
        <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-3">
          <code className="truncate rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500">
            {trip.inviteCode}
          </code>
          <CopyButton value={joinLink(trip.inviteCode)} />
        </div>
      ) : null}
    </div>
  );
}
