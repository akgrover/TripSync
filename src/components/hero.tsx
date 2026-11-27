"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ScanFace, Check } from "lucide-react";
import { groupMembers, heroCollage, unsplash } from "@/lib/photos";
import { CtaButtons } from "./cta-buttons";
import { LiteYouTube } from "./lite-youtube";

export function Hero() {
  return (
    <section id="top" className="landing-hero-grid relative isolate overflow-hidden pb-6 pt-6 sm:pt-9 lg:pb-10 lg:pt-12">
      <div aria-hidden className="landing-halo absolute -right-32 top-0 -z-10 h-[34rem] w-[34rem]" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-10 pt-6 md:pb-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:pt-10">
        {/* Left: copy + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-teal-800 shadow-sm backdrop-blur">
            <ScanFace className="h-3.5 w-3.5" />
            For photographers, events &amp; sports
          </div>

          <h1 className="font-editorial max-w-xl text-[3.5rem] font-normal leading-[0.88] tracking-[-0.035em] text-slate-950 sm:text-7xl lg:text-[5rem]">
            Everyone gets the photos <span className="italic text-teal-700">they&apos;re in.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            TripSync sorts an event&apos;s photos by face, so every guest opens
            one link and finds their own, in full quality. For photographers,
            every link, poster, and gallery carries your brand.
          </p>

          <div className="mt-8">
            <CtaButtons />
          </div>

          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
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
          <ul className="mt-7 grid max-w-xl gap-x-5 gap-y-2.5 border-t border-slate-200/80 pt-5 text-sm text-slate-600 sm:grid-cols-2">
            {["AI face recognition", "Full-resolution", "Private & invite-only", "Branded for photographers"].map(
              (point) => (
                <li key={point} className="inline-flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                    <Check className="h-3 w-3" />
                  </span>
                  {point}
                </li>
              ),
            )}
          </ul>
        </motion.div>

        {/* Right: click-to-play product video (facade — loads nothing from YouTube until clicked). */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.52, ease: "easeOut", delay: 0.08 }}
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
        >
          <div className="relative px-4 pb-14 pt-10 sm:px-10 sm:pb-16">
            <div className="absolute left-0 top-3 hidden h-44 w-32 -rotate-6 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:block">
              <Image
                src={unsplash(heroCollage[1], { w: 360 })}
                alt=""
                fill
                sizes="128px"
                className="object-cover saturate-[0.82]"
              />
            </div>
            <div className="absolute bottom-8 right-1 hidden h-40 w-28 rotate-6 overflow-hidden rounded-2xl border-4 border-white shadow-xl sm:block">
              <Image
                src={unsplash(heroCollage[2], { w: 320 })}
                alt=""
                fill
                sizes="112px"
                className="object-cover saturate-[0.82]"
              />
            </div>

            <div className="absolute -inset-2 -z-10 rounded-[2rem] bg-teal-100/35 blur-2xl" />
            <div className="relative z-10 rounded-3xl border border-white bg-white/85 p-1.5 shadow-[0_30px_70px_-34px_rgba(15,23,42,0.42)] backdrop-blur">
              <LiteYouTube id="-b9dqACisgc" title="See how TripSync works" className="!rounded-[1.15rem] !shadow-none" />
            </div>

            <div className="absolute right-0 top-0 z-20 flex items-center gap-2.5 rounded-2xl border border-white/70 bg-slate-950/92 px-3.5 py-3 text-white shadow-xl backdrop-blur-md sm:right-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-300 text-teal-950">
                <ScanFace className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Photos of You</p>
                <p className="text-sm font-bold">32 photos</p>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 z-20 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/92 px-3.5 py-3 shadow-xl backdrop-blur-md sm:left-5">
              <div className="flex -space-x-2">
                {groupMembers.slice(0, 3).map((member) => (
                  <span key={member.name} className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white">
                    <Image
                      src={unsplash(member.id, { w: 80, faces: true })}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-950">Riya &amp; Karan</p>
                <p className="text-[11px] text-slate-500">Event gallery · 248 photos</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
