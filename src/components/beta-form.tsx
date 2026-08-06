"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function BetaForm({
  align = "left",
  size = "default",
}: {
  align?: "left" | "center";
  size?: "default" | "large";
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status !== "idle") return;
    setStatus("loading");
    // Simulated request — private beta signups are not wired to a backend yet.
    setTimeout(() => setStatus("done"), 900);
  }

  if (status === "done") {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-teal-800 ${
          align === "center" ? "mx-auto justify-center" : ""
        }`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <div className="text-left">
          <p className="font-semibold">You&apos;re on the list.</p>
          <p className="text-sm text-teal-700/80">
            We&apos;ll email {email} when your spot opens up.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex w-full flex-col gap-2 sm:flex-row ${
        size === "large" ? "sm:gap-3" : ""
      } ${align === "center" ? "mx-auto max-w-md" : "max-w-md"}`}
    >
      <label htmlFor="beta-email" className="sr-only">
        Work or personal email
      </label>
      <input
        id="beta-email"
        type="email"
        required
        placeholder="you@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={`w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 ${
          size === "large" ? "py-3.5 text-base" : "py-3 text-sm"
        }`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-teal-600 font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 ${
          size === "large" ? "px-6 py-3.5 text-base" : "px-5 py-3 text-sm"
        }`}
      >
        {status === "loading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Join TripSync Beta
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
