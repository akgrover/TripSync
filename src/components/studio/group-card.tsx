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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onOpen}
        className="group block w-full text-left"
        aria-label={`Open ${trip.title}`}
      >
        <div className="relative aspect-[16/9] w-full bg-slate-100">
          {trip.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
            <img
              src={trip.coverUrl}
              alt=""
              className="h-full w-full object-cover transition group-hover:opacity-95"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <ImageOff className="h-8 w-8" />
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-xs font-medium text-white">
            {isEvent ? "Event" : "Shared"}
          </span>
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
