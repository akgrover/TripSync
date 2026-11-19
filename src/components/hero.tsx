"use client";

import { motion } from "framer-motion";
import { ScanFace, Check } from "lucide-react";
import { CtaButtons } from "./cta-buttons";
import { LiteYouTube } from "./lite-youtube";

export function Hero() {
  return (
    <section id="top" className="bg-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 pb-12 pt-8 md:pb-16 md:pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-14">
        {/* Left: copy + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
            <ScanFace className="h-3.5 w-3.5" />
            For photographers, events &amp; trips
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
            Everyone gets
            <br />
            the photos
            <br />
            <span className="bg-gradient-to-r from-teal-500 to-teal-700 bg-clip-text text-transparent">
              they&apos;re in.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            TripSync sorts an event&apos;s photos by face, so every guest opens
            one link and finds their own, in full quality. For photographers,
            every link, poster, and gallery carries your brand.
          </p>

          <div className="mt-8">
            <CtaButtons />
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
            Shooting an event? Upload the whole shoot in{" "}
            <a
              href="/studio"
              className="whitespace-nowrap font-semibold text-teal-700 underline-offset-2 hover:underline"
            >
              TripSync Studio
            </a>{" "}
            and share one link. Guests find their own photos automatically.{" "}
            <a
              href="/studio"
              className="whitespace-nowrap font-semibold text-teal-700 underline-offset-2 hover:underline"
            >
              Try now for free&nbsp;→
            </a>
          </p>

          {/* Factual trust strip - no invented stats. */}
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {["AI face recognition", "Full-resolution", "Private & invite-only", "Branded for photographers"].map(
              (point) => (
                <li key={point} className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-teal-600" />
                  {point}
                </li>
              ),
            )}
          </ul>
        </motion.div>

        {/* Right: click-to-play product video (facade — loads nothing from YouTube until clicked). */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
        >
          <LiteYouTube id="-b9dqACisgc" title="See how TripSync works" />
        </motion.div>
      </div>
    </section>
  );
}
