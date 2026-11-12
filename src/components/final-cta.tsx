"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { STUDIO_URL } from "@/lib/links";
import { CtaButtons } from "./cta-buttons";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      <div className="bg-glow pointer-events-none absolute inset-0 opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto max-w-3xl px-6 py-12 text-center md:py-16"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Get everyone their photos.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Start a group and let TripSync sort the album by face - each person
          gets the photos they&apos;re in, full resolution.
        </p>
        <div className="mt-8 flex justify-center">
          <CtaButtons align="center" />
        </div>

        {/* Photographer close - Studio is free to start. */}
        <div className="mx-auto mt-10 max-w-xl border-t border-white/10 pt-6">
          <p className="text-sm text-slate-400">Photographer or event host?</p>
          <a
            href={STUDIO_URL}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Open Studio - free to start
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
