"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

// Copy-to-clipboard button with a brief "Copied!" confirmation.
export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (rare on https) — no-op; the link is visible to copy manually.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied!" : label}
    </button>
  );
}
