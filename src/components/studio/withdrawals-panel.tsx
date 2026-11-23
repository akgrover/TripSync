"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { studioApi, ApiError } from "@/lib/studio/api";
import { formatRupees } from "@/lib/studio/money";
import { Dialog } from "@/components/studio/dialog";
import type { AdminWithdrawalRow } from "@/lib/studio/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type Action = { row: AdminWithdrawalRow; mode: "settle" | "reject" };

// Admin panel: rev-share withdrawal requests. Settle (mark paid, off-platform) or reject. Pending
// requests surface at the top; settled/rejected form the history. Self-contained (fetches its own
// data) so it can drop into the records page without touching the owners table. Renders nothing when
// there are no withdrawals at all, so the admin view stays clean for non-rev-share setups.
export function WithdrawalsPanel() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rows, setRows] = useState<AdminWithdrawalRow[]>([]);

  const [action, setAction] = useState<Action | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load(): Promise<void> {
    try {
      const res = await studioApi.adminListWithdrawals();
      setRows(res.withdrawals);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    let active = true;
    void studioApi
      .adminListWithdrawals()
      .then((res) => {
        if (!active) return;
        setRows(res.withdrawals);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  function openAction(row: AdminWithdrawalRow, mode: "settle" | "reject") {
    setAction({ row, mode });
    setReference("");
    setNote("");
    setActionError(null);
  }

  async function confirmAction() {
    if (!action || submitting) {
      return;
    }
    setSubmitting(true);
    setActionError(null);
    try {
      if (action.mode === "settle") {
        await studioApi.adminSettleWithdrawal(action.row.id, {
          reference: reference.trim() || undefined,
          adminNote: note.trim() || undefined,
        });
      } else {
        await studioApi.adminRejectWithdrawal(action.row.id, { adminNote: note.trim() || undefined });
      }
      setAction(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Couldn't update. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Stay invisible while loading and when there's nothing to show (keeps the admin page clean and
  // avoids a brief "Loading…" box that then vanishes on setups with no withdrawals). A real load
  // error still surfaces below.
  if (status === "loading") {
    return null;
  }
  if (status === "ready" && rows.length === 0) {
    return null;
  }

  const pending = rows.filter((r) => r.status === "requested");
  const history = rows.filter((r) => r.status !== "requested");

  return (
    <section className="shadow-card mt-8 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-5 sm:px-6">
        <Wallet className="h-4 w-4 text-teal-600" />
        <h2 className="text-base font-semibold text-slate-900">Withdrawals</h2>
        {pending.length > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
            {pending.length} pending
          </span>
        ) : null}
      </div>

      {status === "error" ? (
        <button
          type="button"
          onClick={() => {
            setStatus("loading");
            void load();
          }}
          className="px-5 py-6 text-sm text-red-600"
        >
          Couldn&apos;t load withdrawals. Retry.
        </button>
      ) : (
        <div className="divide-y divide-slate-100">
          {pending.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {r.ownerName}
                  {r.ownerPhone ? (
                    <span className="ml-2 font-normal text-slate-400">{r.ownerPhone}</span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Pay to <span className="font-medium text-slate-700">{r.payoutUpiId}</span> ·
                  requested {formatDate(r.requestedAt)}
                </p>
              </div>
              <span className="text-base font-bold tabular-nums text-slate-900">
                {formatRupees(r.amountPaise)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAction(r, "settle")}
                  className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
                >
                  Mark paid
                </button>
                <button
                  type="button"
                  onClick={() => openAction(r, "reject")}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}

          {history.length > 0 ? (
            <div className="bg-slate-50/60 px-5 py-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">History</p>
              <ul className="space-y-1.5">
                {history.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {r.status === "paid" ? "Paid" : "Rejected"}
                    </span>
                    <span className="font-medium text-slate-700">{r.ownerName}</span>
                    <span className="tabular-nums text-slate-900">{formatRupees(r.amountPaise)}</span>
                    <span className="text-slate-400">· {r.payoutUpiId}</span>
                    {r.settledAt ? <span className="text-slate-400">· {formatDate(r.settledAt)}</span> : null}
                    {r.reference ? <span className="text-slate-400">· ref {r.reference}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <Dialog
        open={action !== null}
        onClose={() => !submitting && setAction(null)}
        title={action?.mode === "settle" ? "Mark withdrawal paid" : "Reject withdrawal"}
      >
        {action ? (
          <>
            <p className="text-sm text-slate-600">
              {action.mode === "settle" ? (
                <>
                  Confirm you&apos;ve paid{" "}
                  <span className="font-semibold text-slate-900">{action.row.ownerName}</span>{" "}
                  <span className="font-semibold text-slate-900">
                    {formatRupees(action.row.amountPaise)}
                  </span>{" "}
                  to <span className="font-medium">{action.row.payoutUpiId}</span>. This marks it paid
                  in their ledger.
                </>
              ) : (
                <>
                  Reject <span className="font-semibold text-slate-900">{action.row.ownerName}</span>
                  &apos;s withdrawal of{" "}
                  <span className="font-semibold text-slate-900">
                    {formatRupees(action.row.amountPaise)}
                  </span>
                  ? Their balance is released and they can request again.
                </>
              )}
            </p>

            {action.mode === "settle" ? (
              <>
                <label className="mt-4 mb-1 block text-sm font-medium text-slate-700">
                  Reference <span className="font-normal text-slate-400">— optional (UTR / txn id)</span>
                </label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. UTR 123456789012"
                  maxLength={140}
                  className="studio-input"
                />
              </>
            ) : null}

            <label className="mt-3 mb-1 block text-sm font-medium text-slate-700">
              Note <span className="font-normal text-slate-400">— optional</span>
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="studio-input"
            />

            {actionError ? <p className="mt-2 text-sm text-red-600">{actionError}</p> : null}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAction(null)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmAction()}
                disabled={submitting}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                  action.mode === "settle" ? "bg-teal-600 hover:bg-teal-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {action.mode === "settle" ? "Mark paid" : "Reject"}
              </button>
            </div>
          </>
        ) : null}
      </Dialog>
    </section>
  );
}
