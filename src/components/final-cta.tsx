"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { STUDIO_URL } from "@/lib/links";
import { demoPhotos, unsplash } from "@/lib/photos";
import { StoreButtons } from "./cta-buttons";

export function FinalCta() {
  return (
    <section className="relative px-6 pb-16 md:pb-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.42 }}
        className="landing-dark relative mx-auto min-h-[31rem] max-w-6xl overflow-hidden rounded-3xl border border-white/5 shadow-[0_22px_58px_-42px_rgba(15,23,42,0.72)]"
      >
        <div className="absolute inset-y-0 right-0 w-full lg:w-[52%]">
          <Image
            src={unsplash(demoPhotos[12].id, { w: 1000 })}
            alt=""
            fill
            sizes="(min-width: 1024px) 52vw, 100vw"
            className="object-cover opacity-55 saturate-[0.75] lg:opacity-85"
          />
          <span className="absolute inset-0 bg-slate-950/65 lg:bg-gradient-to-r lg:from-[#0c1918] lg:via-[#0c1918]/50 lg:to-transparent" />
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(45,212,191,0.12),transparent_45%)]" />
        <div className="relative flex min-h-[31rem] items-center px-6 py-12 sm:px-10 lg:w-[58%] lg:px-12 lg:py-16">
        <div>
        <h2 className="font-editorial text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-white sm:text-6xl">
          Deliver every guest their photos.
        </h2>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
          Upload the whole shoot to TripSync Studio and share one link - face
          matching gets every guest the photos they&apos;re in, full resolution.
        </p>
        <div className="mt-8 flex">
          <a
            href={STUDIO_URL}
            className="inline-flex min-h-12 items-center rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-slate-950 transition hover:bg-teal-50"
          >
            Open Studio - free to start
          </a>
        </div>

        {/* Guest close - receiving photos is free in the app. */}
        <div className="mt-10 max-w-xl border-t border-white/10 pt-6">
          <p className="text-sm text-slate-400">Guest at an event? Get your photos in the app.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <StoreButtons />
          </div>
        </div>
        </div>
        </div>
      </motion.div>
    </section>
  );
}
