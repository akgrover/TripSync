"use client";

import { Check, Loader2 } from "lucide-react";

// A field-level Save button with three clear states, so an idle button never looks like a broken /
// disabled control:
//  - nothing to save  → muted grey (not a washed-out teal)
//  - unsaved change    → solid brand, inviting the tap
//  - just saved        → teal "Saved ✓" (until the field changes again)
export function SaveButton({
  dirty,
  saving,
  saved,
  onClick,
  label = "Save",
}: {
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  onClick: () => void;
  label?: string;
}) {
  const showSaved = saved && !dirty;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!dirty || saving}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        dirty
          ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          : showSaved
            ? "bg-emerald-50 text-emerald-700"
            : "cursor-default border border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : showSaved ? (
        <Check className="h-4 w-4" />
      ) : null}
      {showSaved ? "Saved" : label}
    </button>
  );
}
