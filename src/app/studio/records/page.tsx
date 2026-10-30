"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { formatBytes, formatCount, formatDate } from "@/lib/studio/format";
import type { AdminOverview, AdminOwnerRow, AdminWindow } from "@/lib/studio/types";
import { Dialog } from "@/components/studio/dialog";
import { FeatureFlagsPanel } from "@/components/studio/feature-flags-panel";

type SortKey =
  | "name"
  | "groupCount"
  | "uploadedPhotos"
  | "storageUsedBytes"
  | "guestsReached"
  | "watermarkEvents"
  | "lifetimeBytesUploaded"
  | "createdAt"
  | "lastActiveAt";

// Client-side sort. `null` keeps the server's ranking. Dates compare by timestamp, name by locale,
// everything else numerically. A stable copy — never mutates the source array.
function sortedOwners(
  owners: AdminOwnerRow[],
  sort: { key: SortKey; dir: "asc" | "desc" } | null,
): AdminOwnerRow[] {
  if (!sort) {
    return owners;
  }
  const dir = sort.dir === "asc" ? 1 : -1;
  const { key } = sort;
  return [...owners].sort((a, b) => {
    if (key === "name") {
      return a.name.localeCompare(b.name) * dir;
    }
    if (key === "createdAt" || key === "lastActiveAt") {
      return (new Date(a[key]).getTime() - new Date(b[key]).getTime()) * dir;
    }
    return (a[key] - b[key]) * dir;
  });
}

const WINDOWS: { value: AdminWindow; label: string }[] = [
  { value: "1d", label: "24h" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

function windowLabel(w: AdminWindow): string {
  return WINDOWS.find((x) => x.value === w)?.label ?? "All time";
}

export default function RecordsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<AdminOverview | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [win, setWin] = useState<AdminWindow>("all");
  // null = use the server's order (activity- or storage-ranked); set once the user clicks a header.
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
  // Row whose feature breakdown is open in the popup.
  const [detailRow, setDetailRow] = useState<AdminOwnerRow | null>(null);
  // Ignore out-of-order responses when the window is switched quickly.
  const reqRef = useRef(0);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev && prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );
  }

  // Only setStates after the await, so it's safe to kick off straight from the mount effect.
  const load = useCallback(
    async (w: AdminWindow) => {
      const id = reqRef.current + 1;
      reqRef.current = id;
      try {
        const res = await studioApi.getAdminOverview(w);
        if (reqRef.current !== id) return; // superseded by a newer request
        setData(res);
        setStatus("ready");
      } catch (err) {
        if (reqRef.current !== id) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          window.location.replace("/studio/login");
          return;
        }
        // 404 (not an admin — the API hides the portal) or 403: this account can't see the records.
        // Bounce to the normal portal rather than revealing that an admin area exists.
        if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
          router.replace("/studio");
          return;
        }
        setStatus("error");
      }
    },
    [router],
  );

  async function refresh() {
    setRefreshing(true);
    try {
      await load(win);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    // Refetches on mount and whenever the window changes. Wrapped in an async IIFE so the fetch's
    // setState lands after an await (not synchronously in the effect body).
    void (async () => {
      await load(win);
    })();
  }, [load, win]);

  if (status === "loading") {
    return (
      <p className="flex items-center gap-2 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading admin overview…
      </p>
    );
  }

  if (status === "error" || !data) {
    return (
      <button
        type="button"
        onClick={() => void load(win)}
        className="inline-flex items-center gap-1.5 text-red-600"
      >
        <RefreshCw className="h-4 w-4" />
        Couldn&apos;t load the records. Retry.
      </button>
    );
  }

  const s = data.summary;
  const overQuotaCount = data.owners.filter((o) => o.flags.overQuota).length;
  const rows = sortedOwners(data.owners, sort);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ShieldCheck className="h-6 w-6 text-teal-600" />
            Records
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Event-group photographers across TripSync. Updated {formatDate(data.generatedAt)}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Time window — scopes the upload / new-sign-up metrics only. */}
      <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {WINDOWS.map((w) => (
          <button
            key={w.value}
            type="button"
            onClick={() => setWin(w.value)}
            aria-pressed={win === w.value}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              win === w.value ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Platform summary */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard icon={<Users className="h-5 w-5" />} value={formatCount(s.ownerCount)} label="Photographers" />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5" />}
          value={formatCount(s.eventGroupCount)}
          label="Event groups"
        />
        <SummaryCard
          icon={<ImageIcon className="h-5 w-5" />}
          value={formatCount(s.totalUploadedPhotos)}
          label={win === "all" ? "Active photos" : `Uploaded · ${windowLabel(win)}`}
        />
        <SummaryCard value={formatBytes(s.totalStorageUsedBytes)} label="Storage used" />
        <SummaryCard value={formatCount(s.totalGuestsReached)} label="Guests reached" />
        {win === "all" ? (
          // At "all time", new-in-window would just equal total photographers — show a health metric
          // instead of repeating that number.
          <SummaryCard value={formatCount(overQuotaCount)} label="Over quota" />
        ) : (
          <SummaryCard value={formatCount(s.newOwnersInWindow)} label={`New · ${windowLabel(win)}`} />
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Uploaded photos and new photographers reflect {windowLabel(win).toLowerCase()}; storage,
        quota, groups, guests and lifetime are current totals.
      </p>

      {/* Owners table */}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <SortTh label="Photographer" sortKey="name" sort={sort} onSort={toggleSort} />
              <SortTh label="Groups" sortKey="groupCount" sort={sort} onSort={toggleSort} align="right" />
              <SortTh
                label={win === "all" ? "Photos" : "Uploaded"}
                sortKey="uploadedPhotos"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortTh label="Storage" sortKey="storageUsedBytes" sort={sort} onSort={toggleSort} />
              <Th>Plan</Th>
              <SortTh label="Guests" sortKey="guestsReached" sort={sort} onSort={toggleSort} align="right" />
              <SortTh
                label="Watermark"
                sortKey="watermarkEvents"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortTh
                label="Lifetime"
                sortKey="lifetimeBytesUploaded"
                sort={sort}
                onSort={toggleSort}
                align="right"
              />
              <SortTh label="Joined" sortKey="createdAt" sort={sort} onSort={toggleSort} />
              <SortTh label="Last active" sortKey="lastActiveAt" sort={sort} onSort={toggleSort} />
              <Th>Features</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-slate-400">
                  No event-group photographers yet.
                </td>
              </tr>
            ) : (
              rows.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{o.name}</p>
                    <p className="text-xs text-slate-500">{o.phone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{o.groupCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatCount(o.uploadedPhotos)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-slate-700">
                          {formatBytes(o.storageUsedBytes)}{" "}
                          <span className="text-slate-400">/ {formatBytes(o.quotaBytes)}</span>
                        </p>
                        <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              o.flags.overQuota
                                ? "bg-red-500"
                                : o.flags.nearQuota
                                  ? "bg-amber-500"
                                  : "bg-teal-500"
                            }`}
                            style={{ width: `${Math.min(100, o.quotaPct)}%` }}
                          />
                        </div>
                      </div>
                      {o.flags.overQuota ? (
                        <span title="Over quota">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        o.plan === "plus"
                          ? "bg-teal-50 text-teal-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {o.plan === "plus" ? "Plus" : "Free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatCount(o.guestsReached)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {o.watermarkEvents > 0 ? `${o.watermarkEvents}/${o.groupCount}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs tabular-nums text-slate-500">
                    {formatCount(o.lifetimePhotosUploaded)} · {formatBytes(o.lifetimeBytesUploaded)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {formatDate(o.lastActiveAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setDetailRow(o)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
                    >
                      {enabledCount(o.features)}/{Object.keys(o.features ?? {}).length}
                      {Object.keys(o.overrides ?? {}).length > 0 ? (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          override
                        </span>
                      ) : null}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Lifetime = total ever uploaded (never reduced on delete). A lifetime far above active usage
        signals upload-then-delete churn. Storage used is what the photographer is currently billed on.
      </p>

      <Dialog
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow ? `${detailRow.name} — features` : "Features"}
      >
        {detailRow ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Effective entitlements for this customer (plan {detailRow.plan === "plus" ? "Plus" : "Free"}
              ). Amber = manually overridden from the plan default.
            </p>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {Object.entries(detailRow.features ?? {}).map(([key, on]) => {
                const overridden = key in (detailRow.overrides ?? {});
                return (
                  <li key={key} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-slate-700">
                      {key}
                      {overridden ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          override
                        </span>
                      ) : null}
                    </span>
                    <span className={on ? "font-medium text-teal-700" : "text-slate-400"}>
                      {on ? "on" : "off"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {/* Raw object for quick copy / unambiguous reading. */}
            <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
              {JSON.stringify(
                { features: detailRow.features ?? {}, overrides: detailRow.overrides ?? {} },
                null,
                2,
              )}
            </pre>
          </div>
        ) : null}
      </Dialog>

      <FeatureFlagsPanel />
    </div>
  );
}

// How many features are currently enabled for a customer. Null-safe for older/partial responses.
function enabledCount(features?: Record<string, boolean>): number {
  return Object.values(features ?? {}).filter(Boolean).length;
}

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5">
      {icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-xl font-semibold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>;
}

function SortTh({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: { key: SortKey; dir: "asc" | "desc" } | null;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort?.key === sortKey;
  return (
    <th className={`px-4 py-3 font-medium ${align === "right" ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-slate-700 ${
          align === "right" ? "flex-row-reverse" : ""
        } ${active ? "text-slate-700" : ""}`}
      >
        {label}
        {active ? (
          sort?.dir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-300" />
        )}
      </button>
    </th>
  );
}
