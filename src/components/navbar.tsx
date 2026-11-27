"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";

const links = [
  { label: "For photographers", href: "#for-photographers" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Privacy", href: "#privacy" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <nav className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-white/70 bg-white/82 px-4 py-3 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:px-5">
        <a href="#top" className="shrink-0">
          <Logo />
        </a>

        <div className="hidden items-center gap-1 rounded-xl bg-slate-50/80 p-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <a
            href="/studio"
            className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Open Studio
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-xl md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/studio"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Open Studio
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
