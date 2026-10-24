"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ScanFace } from "lucide-react";
import { CtaButtons } from "./cta-buttons";
import { unsplash, groupMembers } from "@/lib/photos";

export function Hero() {
  return (
    <section id="top" className="bg-glow relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-16 md:pb-28 md:pt-24 lg:grid-cols-2">
        {/* Left: copy + CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1.5 text-xs font-semibold text-teal-700">
            <ScanFace className="h-3.5 w-3.5" />
            For weddings, events &amp; trips
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
            Group photos,
            <br />
            sorted by AI
            <br />
            <span className="text-teal-600">face recognition.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
            Create a private group, add your photos, and TripSync sorts the album
            by face — so each person sees the shots they&apos;re actually in, at
            full resolution. No scrolling, no compressed chat forwards.
          </p>

          <div className="mt-8">
            <CtaButtons />
          </div>

          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-500">
            Running an event? Upload the whole shoot from{" "}
            <span className="font-medium text-slate-700">TripSync Studio</span> on the web and share
            one link — guests join and find their photos automatically.
          </p>
        </motion.div>

        {/* Right: photo collage */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none"
        >
          <div className="absolute left-[6%] top-[4%] h-[46%] w-[56%] -rotate-3 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
            <Image
              src={unsplash("1517457373958-b7bdd4587205", { w: 700 })}
              alt="Friends jumping together on the beach at sunset"
              fill
              sizes="(min-width: 1024px) 320px, 55vw"
              className="object-cover"
            />
          </div>
          <div className="absolute right-[2%] top-[0%] h-[36%] w-[42%] rotate-2 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
            <Image
              src={unsplash("1523580494863-6f3031224c94", { w: 500 })}
              alt="Friends toasting drinks together"
              fill
              sizes="(min-width: 1024px) 240px, 42vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-[6%] right-[4%] h-[42%] w-[50%] rotate-3 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
            <Image
              src={unsplash("1531058020387-3be344556be6", { w: 700 })}
              alt="Group of friends laughing outdoors"
              fill
              sizes="(min-width: 1024px) 300px, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-[2%] left-[0%] h-[34%] w-[38%] -rotate-2 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5">
            <Image
              src={unsplash("1529333166437-7750a6dd5a70", { w: 500 })}
              alt="Group of friends on a trip together"
              fill
              sizes="(min-width: 1024px) 220px, 38vw"
              className="object-cover"
            />
          </div>

          {/* Floating recognized badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-lg ring-1 ring-black/5 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            248 photos synced
          </motion.div>

          {/* Avatar stack */}
          <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center rounded-full border border-slate-100 bg-white px-2 py-1.5 shadow-lg sm:-bottom-6">
            <div className="flex -space-x-2.5">
              {groupMembers.map((m) => (
                <div
                  key={m.name}
                  className="relative h-7 w-7 overflow-hidden rounded-full ring-2 ring-white"
                >
                  <Image
                    src={unsplash(m.id, { w: 80, faces: true })}
                    alt={m.name}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <span className="ml-2 mr-1 text-xs font-medium text-slate-500">
              +12 in this trip
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
