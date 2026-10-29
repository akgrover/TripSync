"use client";

import { useState } from "react";
import { Search, Users } from "lucide-react";

import { studioApi } from "@/lib/studio/api";
import type { StudioTrip } from "@/lib/studio/types";
import { SlideOver } from "./slide-over";

function Avatar({ name, url }: { name: string; url: string }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- signed S3 URL; next/image can't optimize it
    return <img src={url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
      {(name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}

// Owner-only, shown when a group has watermarking on. The group page stays compact — a summary card
// opens a right slide-over with a searchable, scrollable member list, so it scales to large events.
export function MemberAccess({
  trip,
  onChange,
}: {
  trip: StudioTrip;
  onChange: (trip: StudioTrip) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const guests = trip.members.filter((member) => member.role !== "owner");
  const withAccess = guests.filter((member) => member.cleanAccess).length;

  async function toggle(memberId: string, next: boolean) {
    setBusyId(memberId);
    try {
      const res = await studioApi.setMemberAccess(trip.id, memberId, next);
      onChange(res.trip);
    } catch {
      // Leave the switch as-is; it reflects the server value on next load.
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = q ? guests.filter((member) => member.name.toLowerCase().includes(q)) : guests;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Guest access</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {guests.length === 0
              ? "No guests have joined yet."
              : `${withAccess} of ${guests.length} ${guests.length === 1 ? "guest has" : "guests have"} full access.`}
          </p>
        </div>
        {guests.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Users className="h-4 w-4" />
            Manage access
          </button>
        ) : null}
      </div>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="Guest access"
        description="Give a guest the full-quality originals once they've paid. Everyone else keeps seeing the watermarked preview."
      >
        {guests.length > 6 ? (
          <div className="sticky top-0 border-b border-slate-100 bg-white px-5 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guests"
                className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none"
              />
            </div>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-500">No guests match &ldquo;{query}&rdquo;.</p>
        ) : (
          <ul className="divide-y divide-slate-100 px-5">
            {filtered.map((member) => {
              const clean = member.cleanAccess ?? false;
              const busy = busyId === member.id;
              return (
                <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={member.name} url={member.avatar} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{member.name}</p>
                      <p className="text-xs text-slate-500">{clean ? "Full access" : "Watermarked"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={clean}
                    aria-label={`Full access for ${member.name}`}
                    disabled={busy}
                    onClick={() => void toggle(member.id, !clean)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
                      clean ? "bg-teal-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                        clean ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SlideOver>
    </div>
  );
}
