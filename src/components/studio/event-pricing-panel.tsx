"use client";

import { useEffect, useState } from "react";
import { IndianRupee, Loader2, Plus, Trash2 } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import type { EventPricingConfigView, EventPricingTier } from "@/lib/studio/types";

const GB = 1024 * 1024 * 1024;

// Editable row — all fields are strings so the inputs are controlled and allow mid-edit states
// (empty, partial). Converted to the numeric tier shape on save.
type Row = {
  label: string;
  maxGb: string;
  quotaGb: string;
  unlockRs: string;
  renewalRs: string;
  termDays: string;
};

function bytesToGb(bytes: number): string {
  return String(Math.round((bytes / GB) * 100) / 100);
}
function paiseToRupees(paise: number): string {
  return String(Math.round(paise) / 100);
}

function tierToRow(t: EventPricingTier): Row {
  return {
    label: t.label,
    maxGb: bytesToGb(t.maxBytes),
    quotaGb: bytesToGb(t.quotaBytes),
    unlockRs: paiseToRupees(t.unlockPricePaise),
    renewalRs: paiseToRupees(t.renewalPricePaise),
    termDays: String(t.termDays),
  };
}

const EMPTY_ROW: Row = { label: "", maxGb: "", quotaGb: "", unlockRs: "", renewalRs: "", termDays: "" };

// Parse one row into a tier, or return an error string naming the first bad field. GB → bytes and
// ₹ → paise. Ordering across rows is validated server-side (it returns a 400 we surface).
function rowToTier(r: Row, i: number): EventPricingTier | string {
  const label = r.label.trim();
  if (!label) return `Tier ${i + 1}: label is required`;
  const maxGb = Number(r.maxGb);
  const quotaGb = Number(r.quotaGb);
  const unlockRs = Number(r.unlockRs);
  const renewalRs = Number(r.renewalRs);
  const termDays = Number(r.termDays);
  const checks: Array<[string, number, boolean]> = [
    ["Max GB", maxGb, false],
    ["Quota GB", quotaGb, false],
    ["Fee ₹", unlockRs, false],
    ["Renewal ₹", renewalRs, false],
    ["Term days", termDays, true],
  ];
  for (const [name, value, mustBeInt] of checks) {
    if (!Number.isFinite(value) || value <= 0) return `Tier ${i + 1}: ${name} must be a positive number`;
    if (mustBeInt && !Number.isInteger(value)) return `Tier ${i + 1}: Term days must be a whole number`;
  }
  return {
    label,
    maxBytes: Math.round(maxGb * GB),
    quotaBytes: Math.round(quotaGb * GB),
    unlockPricePaise: Math.round(unlockRs * 100),
    renewalPricePaise: Math.round(renewalRs * 100),
    termDays: Math.round(termDays),
  };
}

// Admin editor for the rev-share event pricing + term table (docs §12.4). Loads the live config
// (DB or code default) and lets an admin replace the whole tier set. Rendered inside the admin-gated
// records page.
export function EventPricingPanel() {
  const [config, setConfig] = useState<EventPricingConfigView | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await studioApi.getAdminPricing();
        setConfig(res);
        setRows(res.tiers.map(tierToRow));
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, []);

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    setSaveOk(null);
  }
  function addRow() {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
    setSaveOk(null);
  }
  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
    setSaveOk(null);
  }

  async function save() {
    if (saving) return;
    setSaveError(null);
    setSaveOk(null);
    if (rows.length === 0) {
      setSaveError("Add at least one tier.");
      return;
    }
    const tiers: EventPricingTier[] = [];
    for (const [i, r] of rows.entries()) {
      const parsed = rowToTier(r, i);
      if (typeof parsed === "string") {
        setSaveError(parsed);
        return;
      }
      tiers.push(parsed);
    }
    setSaving(true);
    try {
      const res = await studioApi.replaceAdminPricing(tiers);
      setConfig(res);
      setRows(res.tiers.map(tierToRow));
      setSaveOk("Saved. New events use these prices and terms; already-paid events keep their term.");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return null;
  }

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <IndianRupee className="h-4 w-4 text-teal-600" />
        Event pricing &amp; terms
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Per-event platform-fee tiers, by event storage. Each tier sets the fee to unlock an event, the
        renewal fee, and how long the event stays live. Tiers must be ordered by Max GB, smallest first.
      </p>

      {status === "error" ? (
        <p className="mt-4 text-sm text-red-600">Couldn&apos;t load pricing.</p>
      ) : (
        <>
          <p className="mt-2 text-xs text-slate-400">
            {config?.source === "db"
              ? `Custom config${config.updatedAt ? ` · saved ${new Date(config.updatedAt).toLocaleString("en-IN")}` : ""}`
              : "Using built-in defaults — saving creates a custom config."}
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-2 py-2 font-medium">Label</th>
                  <th className="px-2 py-2 font-medium">Max GB</th>
                  <th className="px-2 py-2 font-medium">Quota GB</th>
                  <th className="px-2 py-2 font-medium">Fee ₹</th>
                  <th className="px-2 py-2 font-medium">Renewal ₹</th>
                  <th className="px-2 py-2 font-medium">Term days</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  // Index key is fine: rows are only reordered by add/remove, and each re-render maps
                  // the full editable set (no stale focus issues at this tiny scale).
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-1 py-1.5">
                      <Cell value={r.label} onChange={(v) => updateRow(i, { label: v })} placeholder="200 GB" width="w-28" />
                    </td>
                    <td className="px-1 py-1.5">
                      <Cell value={r.maxGb} onChange={(v) => updateRow(i, { maxGb: v })} numeric width="w-24" />
                    </td>
                    <td className="px-1 py-1.5">
                      <Cell value={r.quotaGb} onChange={(v) => updateRow(i, { quotaGb: v })} numeric width="w-24" />
                    </td>
                    <td className="px-1 py-1.5">
                      <Cell value={r.unlockRs} onChange={(v) => updateRow(i, { unlockRs: v })} numeric width="w-24" />
                    </td>
                    <td className="px-1 py-1.5">
                      <Cell value={r.renewalRs} onChange={(v) => updateRow(i, { renewalRs: v })} numeric width="w-24" />
                    </td>
                    <td className="px-1 py-1.5">
                      <Cell value={r.termDays} onChange={(v) => updateRow(i, { termDays: v })} numeric width="w-20" />
                    </td>
                    <td className="px-1 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        aria-label={`Remove tier ${i + 1}`}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add tier
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save pricing
            </button>
          </div>

          {saveError ? <p className="mt-2 text-sm text-red-600">{saveError}</p> : null}
          {saveOk ? <p className="mt-2 text-sm text-teal-700">{saveOk}</p> : null}
        </>
      )}
    </div>
  );
}

function Cell({
  value,
  onChange,
  numeric,
  placeholder,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
  placeholder?: string;
  width: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode={numeric ? "decimal" : undefined}
      placeholder={placeholder}
      className={`${width} rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100`}
    />
  );
}
