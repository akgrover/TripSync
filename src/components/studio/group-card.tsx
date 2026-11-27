"use client";

import { CheckCircle2, ImageIcon, ImageOff, LockKeyhole, TimerOff, Users } from "lucide-react";

import { joinLink } from "@/lib/studio/config";
import type { StudioTrip } from "@/lib/studio/types";
import { CopyButton } from "./copy-button";

export function GroupCard({ trip, onOpen }: { trip: StudioTrip; onOpen: () => void }) {
  const memberCount = trip.members?.length ?? 0;
  const photoCount = trip.photoCount ?? 0;
  const isEvent = trip.storageMode === "single_payer";

  return (
    <article className="shadow-card lift group/card overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-white">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500"
        aria-label={`Open ${trip.title}`}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          {trip.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
            <img
              src={trip.coverUrl}
              alt=""
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-300">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          {/* Soft top scrim so the badges stay legible over bright photos. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-slate-950/20" />
          {/* Badges grouped top-left as one set. Both use the same dark translucent pill; the
              pay-to-unlock status carries a small colored dot instead of a competing fill, so a
              photographer sees at a glance which events are still locked. */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <span className="rounded-full border border-white/15 bg-slate-950/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
              {isEvent ? "Event" : "Shared"}
            </span>
            {trip.accessModel === "rev_share" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                {trip.revShare?.expired ? (
                  <>
                    <TimerOff className="h-3 w-3 text-amber-300" />
                    Expired
                  </>
                ) : trip.revShare?.locked ? (
                  <>
                    <LockKeyhole className="h-3 w-3 text-amber-300" />
                    Locked
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                    Unlocked
                  </>
                )}
              </span>
            ) : null}
          </div>
          <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3 text-white">
            <h3 className="line-clamp-2 text-base font-bold leading-tight tracking-tight drop-shadow-sm sm:text-lg">
              {trip.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-4 px-4 py-3 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </span>
        </div>
      </button>
      {trip.inviteCode ? (
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Invite code</p>
            <code className="text-xs font-semibold tracking-[0.12em] text-slate-700">{trip.inviteCode}</code>
          </div>
          <CopyButton value={joinLink(trip.inviteCode)} />
        </div>
      ) : null}
    </article>
  );
}
