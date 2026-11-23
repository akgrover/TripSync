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
  Info,
  Loader2,
  Lock,
  LockOpen,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { clearTokens } from "@/lib/studio/auth";
import { formatBytes, formatCount, formatDate } from "@/lib/studio/format";
import type {
  AdminOverview,
  AdminOwnerGroup,
  AdminOwnerRow,
  AdminWindow,
} from "@/lib/studio/types";
import { Dialog } from "@/components/studio/dialog";
import { FeatureFlagsPanel } from "@/components/studio/feature-flags-panel";
import { WithdrawalsPanel } from "@/components/studio/withdrawals-panel";

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
  // Owner whose group breakdown (names + member counts) is open in the popup, plus the lazily
  // fetched groups cached by owner id so reopening the same row doesn't refetch.
  const [groupsOwner, setGroupsOwner] = useState<AdminOwnerRow | null>(null);
  const [groupsCache, setGroupsCache] = useState<Record<string, AdminOwnerGroup[]>>({});
  const [groupsStatus, setGroupsStatus] = useState<"idle" | "loading" | "error">("idle");
  // Admin group deletion (inside the Groups popup). `armedGroupId` is the group showing its
  // type-to-confirm box; `confirmText` must match the group title before Delete enables.
  const [armedGroupId, setArmedGroupId] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groupError, setGroupError] = useState<string | null>(null);
  // Pay-to-unlock admin actions (inside the Groups popup / detail popup).
  const [unlockingGroupId, setUnlockingGroupId] = useState<string | null>(null);
  const [savingPriceId, setSavingPriceId] = useState<string | null>(null);
  const [billingBusyId, setBillingBusyId] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  // Ignore out-of-order responses when the window is switched quickly.
  const reqRef = useRef(0);
  // Same guard for the per-owner groups fetch (opening another row supersedes the previous one).
  const groupsReqRef = useRef(0);

  // Open the groups popup for an owner, fetching the breakdown on first open (cached thereafter).
  function openGroups(o: AdminOwnerRow) {
    setGroupsOwner(o);
    // Reset any armed delete from a previously-opened owner.
    setArmedGroupId(null);
    setConfirmText("");
    setGroupError(null);
    if (groupsCache[o.id]) {
      setGroupsStatus("idle");
      return;
    }
    const id = groupsReqRef.current + 1;
    groupsReqRef.current = id;
    setGroupsStatus("loading");
    void (async () => {
      try {
        const res = await studioApi.getAdminOwnerGroups(o.id);
        if (groupsReqRef.current !== id) return; // superseded by opening another row
        setGroupsCache((prev) => ({ ...prev, [o.id]: res.groups }));
        setGroupsStatus("idle");
      } catch {
        if (groupsReqRef.current !== id) return;
        setGroupsStatus("error");
      }
    })();
  }

  // Close the groups popup, clearing any armed delete.
  function closeGroups() {
    setGroupsOwner(null);
    setArmedGroupId(null);
    setConfirmText("");
    setGroupError(null);
  }

  // Permanently delete a group (admin). Gated on the typed confirmation matching the group title.
  // On success, drop it from the open popup list and decrement the table/summary counts in place.
  async function deleteGroup(ownerId: string, group: AdminOwnerGroup) {
    if (deletingGroupId || confirmText.trim() !== group.title.trim()) {
      return;
    }
    setDeletingGroupId(group.id);
    setGroupError(null);
    try {
      await studioApi.adminDeleteGroup(group.id);
      setGroupsCache((prev) => ({
        ...prev,
        [ownerId]: (prev[ownerId] ?? []).filter((item) => item.id !== group.id),
      }));
      setData((prev) =>
        prev
          ? {
              ...prev,
              summary: {
                ...prev.summary,
                eventGroupCount: Math.max(0, prev.summary.eventGroupCount - 1),
              },
              owners: prev.owners.map((owner) =>
                owner.id === ownerId
                  ? { ...owner, groupCount: Math.max(0, owner.groupCount - 1) }
                  : owner,
              ),
            }
          : prev,
      );
      setArmedGroupId(null);
      setConfirmText("");
    } catch (err) {
      setGroupError(
        err instanceof ApiError ? err.message : "Couldn't delete that group. Please try again.",
      );
    } finally {
      setDeletingGroupId(null);
    }
  }

  // Switch a photographer between the annual (proofing) and pay-to-unlock (rev-share) models. Updates
  // the table row + the open detail popup in place.
  async function toggleBillingMode(owner: AdminOwnerRow) {
    if (billingBusyId) {
      return;
    }
    const next = (owner.eventBillingMode ?? "annual") === "rev_share" ? "annual" : "rev_share";
    setBillingBusyId(owner.id);
    setBillingError(null);
    try {
      const res = await studioApi.adminSetBillingMode({ userId: owner.id, mode: next });
      setData((prev) =>
        prev
          ? {
              ...prev,
              owners: prev.owners.map((o) =>
                o.id === owner.id ? { ...o, eventBillingMode: res.eventBillingMode } : o,
              ),
            }
          : prev,
      );
      setDetailRow((prev) =>
        prev && prev.id === owner.id ? { ...prev, eventBillingMode: res.eventBillingMode } : prev,
      );
    } catch (err) {
      setBillingError(
        err instanceof ApiError ? err.message : "Couldn't change the billing model. Please try again.",
      );
    } finally {
      setBillingBusyId(null);
    }
  }

  // Force-unlock a rev-share group with no payment (first-event-free / comp). Flips `locked` in the
  // cached list so the popup reflects it immediately.
  async function forceUnlockGroup(ownerId: string, group: AdminOwnerGroup) {
    if (unlockingGroupId) {
      return;
    }
    setUnlockingGroupId(group.id);
    setGroupError(null);
    try {
      await studioApi.adminForceUnlockGroup(group.id);
      setGroupsCache((prev) => ({
        ...prev,
        [ownerId]: (prev[ownerId] ?? []).map((it) =>
          it.id === group.id ? { ...it, locked: false } : it,
        ),
      }));
    } catch (err) {
      setGroupError(
        err instanceof ApiError ? err.message : "Couldn't unlock that group. Please try again.",
      );
    } finally {
      setUnlockingGroupId(null);
    }
  }

  // Set or clear a rev-share group's price override (paise; null clears back to the storage tiers).
  async function setGroupPrice(group: AdminOwnerGroup, priceOverridePaise: number | null) {
    if (savingPriceId) {
      return;
    }
    setSavingPriceId(group.id);
    setGroupError(null);
    try {
      await studioApi.adminSetGroupPrice(group.id, priceOverridePaise);
    } catch (err) {
      setGroupError(
        err instanceof ApiError ? err.message : "Couldn't set the price. Please try again.",
      );
    } finally {
      setSavingPriceId(null);
    }
  }

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
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
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

      {/* Rev-share withdrawal requests (self-contained; hidden when there are none) */}
      <WithdrawalsPanel />

      {/* Owners table */}
      <div className="shadow-card mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      {o.groupCount}
                      {o.groupCount > 0 ? (
                        <button
                          type="button"
                          onClick={() => openGroups(o)}
                          aria-label={`View ${o.name}'s groups`}
                          title="View group names & members"
                          className="text-slate-300 transition hover:text-teal-600"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatCount(o.uploadedPhotos)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-slate-700">
                          {formatBytes(o.storageUsedBytes)}{" "}
                          <span className="text-slate-400">
                            / {o.quotaBytes == null ? "∞" : formatBytes(o.quotaBytes)}
                          </span>
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
                        o.plan !== "free"
                          ? "bg-teal-50 text-teal-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {planLabel(o.plan)}
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

      {/* Sign-in methods across ALL users (not just the owners in the table above). */}
      {data.authMethods ? (
        <div className="mt-8">
          <h2 className="text-base font-semibold text-slate-900">Sign-in methods — all users</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            How many accounts have each method connected. Someone who linked more than one is counted
            in each, so these can add up to more than the total.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              icon={<Users className="h-5 w-5" />}
              value={formatCount(data.authMethods.totalUsers)}
              label="Total users"
            />
            <SummaryCard value={formatCount(data.authMethods.phone)} label="Phone" />
            <SummaryCard value={formatCount(data.authMethods.google)} label="Google" />
            <SummaryCard value={formatCount(data.authMethods.apple)} label="Apple" />
          </div>
        </div>
      ) : null}

      <Dialog
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow ? `${detailRow.name} — features` : "Features"}
      >
        {detailRow ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Effective entitlements for this customer (plan {planLabel(detailRow.plan)}). Amber =
              manually overridden from the plan default.
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

            {/* Effective limits (storage + photo cap), with an amber tag when manually overridden. */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">Limits</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                <li className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-700">
                    Storage
                    {detailRow.storageQuotaOverrideBytes != null ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        override
                      </span>
                    ) : null}
                  </span>
                  <span className="font-medium text-slate-900">
                    {detailRow.quotaBytes == null ? "∞" : formatBytes(detailRow.quotaBytes)}
                  </span>
                </li>
                <li className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-slate-700">
                    Photos
                    {detailRow.maxPhotosOverride != null ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        override
                      </span>
                    ) : null}
                  </span>
                  <span className="font-medium text-slate-900">
                    {detailRow.photoCap == null ? "∞" : detailRow.photoCap.toLocaleString()}
                  </span>
                </li>
              </ul>
            </div>
            {/* Event billing model (annual proofing vs pay-to-unlock). Switching affects NEW groups. */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">Event billing model</p>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {(detailRow.eventBillingMode ?? "annual") === "rev_share"
                      ? "Pay-to-unlock"
                      : "Annual (proofing)"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Applies to groups created from now on. Existing groups keep their own setting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleBillingMode(detailRow)}
                  disabled={billingBusyId === detailRow.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  {billingBusyId === detailRow.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {(detailRow.eventBillingMode ?? "annual") === "rev_share"
                    ? "Switch to Annual"
                    : "Switch to Pay-to-unlock"}
                </button>
              </div>
              {billingError ? <p className="mt-1.5 text-xs text-red-600">{billingError}</p> : null}
            </div>

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

      {/* Per-owner group breakdown — names + member counts, lazily fetched on open. */}
      <Dialog
        open={groupsOwner !== null}
        onClose={closeGroups}
        title={groupsOwner ? `${groupsOwner.name} — groups` : "Groups"}
      >
        {groupsOwner ? (
          <GroupsPopupBody
            key={groupsOwner.id}
            groups={groupsCache[groupsOwner.id]}
            status={groupsStatus}
            armedGroupId={armedGroupId}
            confirmText={confirmText}
            deletingGroupId={deletingGroupId}
            groupError={groupError}
            unlockingGroupId={unlockingGroupId}
            savingPriceId={savingPriceId}
            onRetry={() => openGroups(groupsOwner)}
            onArm={(id) => {
              setArmedGroupId(id);
              setConfirmText("");
              setGroupError(null);
            }}
            onCancel={() => {
              setArmedGroupId(null);
              setConfirmText("");
              setGroupError(null);
            }}
            onConfirmTextChange={setConfirmText}
            onDelete={(g) => void deleteGroup(groupsOwner.id, g)}
            onForceUnlock={(g) => void forceUnlockGroup(groupsOwner.id, g)}
            onSetPrice={(g, paise) => void setGroupPrice(g, paise)}
          />
        ) : null}
      </Dialog>

      <FeatureFlagsPanel />
    </div>
  );
}

// Body of the per-owner "Groups" popup: loading / error / empty / the list with a type-to-confirm
// delete per group. Kept as its own component so the owner-scoped handlers (which touch the parent's
// request-guard ref) are passed in as plain event handlers, never referenced during render.
function GroupsPopupBody({
  groups,
  status,
  armedGroupId,
  confirmText,
  deletingGroupId,
  groupError,
  unlockingGroupId,
  savingPriceId,
  onRetry,
  onArm,
  onCancel,
  onConfirmTextChange,
  onDelete,
  onForceUnlock,
  onSetPrice,
}: {
  groups: AdminOwnerGroup[] | undefined;
  status: "idle" | "loading" | "error";
  armedGroupId: string | null;
  confirmText: string;
  deletingGroupId: string | null;
  groupError: string | null;
  unlockingGroupId: string | null;
  savingPriceId: string | null;
  onRetry: () => void;
  onArm: (groupId: string) => void;
  onCancel: () => void;
  onConfirmTextChange: (value: string) => void;
  onDelete: (group: AdminOwnerGroup) => void;
  onForceUnlock: (group: AdminOwnerGroup) => void;
  onSetPrice: (group: AdminOwnerGroup, priceOverridePaise: number | null) => void;
}) {
  // Local UI state for the pay-to-unlock actions (kept local since they don't touch the parent's
  // request-guard refs; the component is keyed by owner so it resets when another owner opens).
  const [armedUnlockId, setArmedUnlockId] = useState<string | null>(null);
  const [priceEditId, setPriceEditId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  if (!groups) {
    if (status === "error") {
      return (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-sm text-red-600"
        >
          <RefreshCw className="h-4 w-4" />
          Couldn&apos;t load groups. Retry.
        </button>
      );
    }
    return (
      <p className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading groups…
      </p>
    );
  }
  if (groups.length === 0) {
    return <p className="text-sm text-slate-400">No event groups.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        {formatCount(groups.length)} event {groups.length === 1 ? "group" : "groups"}. Members
        include the host; guests are the non-host members.
      </p>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {groups.map((g) => {
          const armed = armedGroupId === g.id;
          const busy = deletingGroupId === g.id;
          return (
            <li key={g.id} className="px-3 py-2.5 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{g.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Created {formatDate(g.createdAt)}
                    {g.watermark ? " · watermark on" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-start gap-3">
                  <div className="whitespace-nowrap text-right">
                    <p>
                      <span className="font-medium text-slate-900">
                        {formatCount(g.memberCount)}
                      </span>{" "}
                      <span className="text-slate-400">
                        {g.memberCount === 1 ? "member" : "members"}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {formatCount(g.guestCount)} {g.guestCount === 1 ? "guest" : "guests"}
                    </p>
                  </div>
                  {!armed ? (
                    <button
                      type="button"
                      onClick={() => onArm(g.id)}
                      aria-label={`Delete ${g.title}`}
                      title="Delete group"
                      className="mt-0.5 shrink-0 rounded-lg border border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Pay-to-unlock controls (rev-share groups only): lock state, force-unlock, price. */}
              {g.accessModel === "rev_share" ? (
                <div className="mt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        g.locked
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {g.locked ? (
                        <>
                          <Lock className="h-3 w-3" /> Locked
                        </>
                      ) : (
                        <>
                          <LockOpen className="h-3 w-3" /> Unlocked
                        </>
                      )}
                    </span>
                    {g.locked ? (
                      <button
                        type="button"
                        onClick={() => setArmedUnlockId(armedUnlockId === g.id ? null : g.id)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Mark paid / unlock
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setPriceEditId(priceEditId === g.id ? null : g.id);
                        setPriceInput("");
                      }}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Price override
                    </button>
                  </div>

                  {armedUnlockId === g.id && g.locked ? (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs text-amber-800">
                        Unlock this event for <strong>everyone</strong> without a TripSync payment —
                        use this when the photographer was <strong>paid offline</strong>, or to comp
                        the event. Guests can download the full-resolution photos immediately.
                      </p>
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setArmedUnlockId(null)}
                          disabled={unlockingGroupId === g.id}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => onForceUnlock(g)}
                          disabled={unlockingGroupId === g.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
                        >
                          {unlockingGroupId === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Unlock event
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {priceEditId === g.id ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs text-slate-600">
                        Fixed unlock price for this event (₹). Overrides the storage tiers. Leave empty
                        and press Clear to go back to automatic pricing.
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm text-slate-500">₹</span>
                        <input
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9]/g, ""))}
                          inputMode="numeric"
                          placeholder="e.g. 4999"
                          className="w-28 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const rupees = Number(priceInput);
                            if (!Number.isFinite(rupees) || rupees <= 0) return;
                            onSetPrice(g, Math.round(rupees * 100));
                          }}
                          disabled={savingPriceId === g.id || Number(priceInput) <= 0}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                        >
                          {savingPriceId === g.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => onSetPrice(g, null)}
                          disabled={savingPriceId === g.id}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {armed ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-xs text-red-700">
                    Permanently deletes this group and <strong>every photo</strong> in it, for
                    everyone (incl. {formatCount(g.guestCount)}{" "}
                    {g.guestCount === 1 ? "guest" : "guests"}). This can&apos;t be undone.
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Type <span className="font-semibold">{g.title}</span> to confirm:
                  </p>
                  <input
                    value={confirmText}
                    onChange={(e) => onConfirmTextChange(e.target.value)}
                    autoFocus
                    placeholder={g.title}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  />
                  {groupError ? <p className="mt-1.5 text-xs text-red-600">{groupError}</p> : null}
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={busy}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(g)}
                      disabled={busy || confirmText.trim() !== g.title.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete group
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// How many features are currently enabled for a customer. Null-safe for older/partial responses.
function enabledCount(features?: Record<string, boolean>): number {
  return Object.values(features ?? {}).filter(Boolean).length;
}

// Capitalized plan label for a plan id ('free' -> 'Free', 'pro' -> 'Pro').
function planLabel(plan: string): string {
  return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Free";
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
    <div className="shadow-card flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
      {icon ? (
        <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm">
          {icon}
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-tight tracking-tight text-slate-900">{value}</p>
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
