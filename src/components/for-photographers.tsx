"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { QrCode, ScanFace, Sparkles } from "lucide-react";

import { STUDIO_URL } from "@/lib/links";
import { demoPhotos, unsplash } from "@/lib/photos";

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
    <section id="for-photographers" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42, ease: "easeOut" }}
        className="grid items-end gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
      >
        <div>
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-teal-700">
          For photographers &amp; studios
        </span>
        <h2 className="font-editorial mt-4 text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-slate-950 sm:text-6xl">
          Every event is your next booking
        </h2>
        </div>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          It&apos;s not just how you deliver photos. It&apos;s how every guest sees your brand, and how
          some of them become your next clients.
        </p>
      </motion.div>

      {/* Feature tile: your brand travels with every photo. */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="landing-dark relative mt-10 overflow-hidden rounded-3xl border border-white/5 p-7 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.55)] sm:p-9 lg:p-10"
      >
        {/* soft glow accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(60% 60% at 90% 0%, rgba(45,212,191,0.11), transparent 60%)" }}
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h3 className="font-editorial text-4xl font-normal leading-[0.95] tracking-[-0.02em] text-white sm:text-5xl">
              Your brand travels with every photo
            </h3>
            <p className="mt-5 max-w-lg leading-7 text-slate-300">
              Your studio name and logo show up on every link you share, every QR poster, and every
              guest&apos;s gallery. At a 200-guest wedding, that&apos;s 200 people who see your work -
              and might book you next.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Branded share links & QR posters",
                "Branded web gallery for every guest",
                "Your logo on the pages they actually open",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm font-medium text-slate-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-300/15 text-teal-200">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href={STUDIO_URL}
              className="mt-8 inline-flex min-h-12 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-teal-50"
            >
              Open Studio - free to start
            </a>
          </div>

          {/* Mock branded share card - echoes the real QR poster. */}
          <div className="relative mx-auto min-h-[30rem] w-full max-w-md lg:mr-0">
            <div className="absolute inset-x-8 inset-y-0 overflow-hidden rounded-3xl border border-white/10 bg-slate-800">
              <Image
                src={unsplash(demoPhotos[0].id, { w: 760 })}
                alt=""
                fill
                sizes="(min-width: 1024px) 36vw, 80vw"
                className="object-cover saturate-[0.82]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/10" />
            </div>
            <div className="absolute bottom-6 left-0 w-[17rem] -rotate-2 rounded-3xl border border-white/70 bg-white p-6 text-center shadow-[0_26px_65px_-26px_rgba(0,0,0,0.7)] transition duration-300 hover:rotate-0">
              <div className="flex items-center justify-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-base font-bold text-white"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  L
                </span>
                <span className="text-sm font-extrabold text-slate-950">Lumina Studio</span>
              </div>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-teal-600">
                Riya &amp; Karan
              </p>
              <p className="mt-1 text-lg font-extrabold text-slate-900">Get all your photos</p>
              <div className="mx-auto mt-5 flex h-32 w-32 items-center justify-center rounded-2xl bg-slate-950 shadow-inner">
                <QrCode className="h-16 w-16 text-white" />
              </div>
              <p className="mt-3 text-xs text-slate-400">Scan for your photos</p>
            </div>
            <div className="absolute right-0 top-8 rounded-2xl border border-white/15 bg-slate-950/75 px-4 py-3 text-white shadow-xl backdrop-blur-md">
              <p className="text-[11px] text-slate-400">Branded web gallery</p>
              <p className="mt-0.5 text-sm font-semibold">Lumina Studio</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Three concrete wins. */}
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {WINS.map((win, i) => (
          <motion.div
            key={win.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.05 }}
            className="border-t border-slate-200 pt-6"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
              <win.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-950">{win.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{win.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
