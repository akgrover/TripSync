"use client";

import { motion } from "framer-motion";
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
        className="relative mx-auto max-w-3xl px-6 py-20 text-center md:py-24"
      >
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Get everyone their photos.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Start a group and let TripSync sort the album by face — each person
          gets the photos they&apos;re in, full resolution.
        </p>
        <div className="mt-8 flex justify-center">
          <CtaButtons align="center" />
        </div>
      </motion.div>
    </section>
  );
}
