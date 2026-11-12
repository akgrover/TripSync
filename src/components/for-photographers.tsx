"use client";

import { motion } from "framer-motion";
import { ArrowRight, QrCode, ScanFace, Sparkles } from "lucide-react";

import { STUDIO_URL } from "@/lib/links";

// The photographer sell: why a studio pays for TripSync. Leads with the business case (your brand
// reaches every guest), then three concrete wins. The mock card mirrors the real QR poster so the
// "your brand everywhere" promise is shown, not just told.
const WINS = [
  {
    icon: QrCode,
    title: "A QR code on every table",
    body: "Print one poster for the event. Guests scan it to get their photos and see your brand - a whole room of people who might book you next.",
  },
  {
    icon: ScanFace,
    title: "Deliver in minutes, not weekends",
    body: "Face recognition sorts the whole shoot for you, and guests find their own photos in seconds. No sorting, no folders, no links that expire.",
  },
  {
    icon: Sparkles,
    title: "A delivery clients love",
    body: "Guests get a clean app and a branded gallery with full-quality downloads, private and invite-only. The kind of experience that gets you referrals.",
  },
];

export function ForPhotographers() {
  return (
    <section id="for-photographers" className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-2xl text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-teal-600">
          For photographers &amp; studios
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Every event is your next booking
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          It&apos;s not just how you deliver photos. It&apos;s how every guest sees your brand, and how
          some of them become your next clients.
        </p>
      </motion.div>

      {/* Feature tile: your brand travels with every photo. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mt-10 overflow-hidden rounded-3xl p-8 sm:p-10"
        style={{
          background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #2dd4bf 100%)",
        }}
      >
        {/* soft glow accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 60% at 90% 0%, rgba(255,255,255,0.18), transparent 60%)" }}
        />
        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              Your brand travels with every photo
            </h3>
            <p className="mt-3 max-w-md leading-relaxed text-teal-50">
              Your studio name and logo show up on every link you share, every QR poster, and every
              guest&apos;s gallery. At a 200-guest wedding, that&apos;s 200 people who see your work -
              and might book you next.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                "Branded share links & QR posters",
                "Branded web gallery for every guest",
                "Your logo on the pages they actually open",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-white">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={STUDIO_URL}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
            >
              Open Studio - free to start
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Mock branded share card - echoes the real QR poster. */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[260px] rounded-2xl bg-white p-6 text-center shadow-xl">
              <div className="flex items-center justify-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  L
                </span>
                <span className="text-sm font-extrabold text-slate-900">Lumina Studio</span>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Riya &amp; Karan
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">Get all your photos</p>
              <div className="mx-auto mt-4 flex h-28 w-28 items-center justify-center rounded-xl bg-slate-900">
                <QrCode className="h-16 w-16 text-white" />
              </div>
              <p className="mt-3 text-xs text-slate-400">Scan for your photos</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Three concrete wins. */}
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {WINS.map((win, i) => (
          <motion.div
            key={win.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <win.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{win.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{win.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
