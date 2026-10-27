import { CalendarDays, ImageIcon, Users } from "lucide-react";

import type { StudioTrip } from "@/lib/studio/types";

// Compact, human-readable counts: 999 stays 999, 1200 -> 1.2k, 1_000_000 -> 1M.
function formatCount(n: number): string {
  if (n < 1000) {
    return String(n);
  }
  if (n < 1_000_000) {
    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// At-a-glance totals across the groups you OWN (your events). Derived entirely from the trips the
// page already loaded — no extra API call, so it shows the moment the groups do and never adds a
// failure path of its own. Hidden until you have at least one owned group.
export function StudioStats({ trips }: { trips: StudioTrip[] }) {
  const owned = trips.filter((trip) => trip.isOwner);
  if (owned.length === 0) {
    return null;
  }

  // Unique guests across all your events (the same person in two events counts once; you're the
  // owner, so your own membership is excluded by filtering to the "member" role).
  const guestIds = new Set<string>();
  let photosShared = 0;
  for (const trip of owned) {
    photosShared += trip.photoCount ?? 0;
    for (const member of trip.members) {
      if (member.role === "member") {
        guestIds.add(member.id);
      }
    }
  }

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <StatCard
        icon={<CalendarDays className="h-5 w-5" />}
        value={formatCount(owned.length)}
        label={owned.length === 1 ? "Event" : "Events"}
      />
      <StatCard
        icon={<Users className="h-5 w-5" />}
        value={formatCount(guestIds.size)}
        label="Guests reached"
      />
      <StatCard
        icon={<ImageIcon className="h-5 w-5" />}
        value={formatCount(photosShared)}
        label="Photos shared"
      />
    </div>
  );
}
