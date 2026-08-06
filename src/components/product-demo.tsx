"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ScanFace, Circle, Zap } from "lucide-react";
import { unsplash, groupMembers, demoPhotos } from "@/lib/photos";

type Tab = "all" | "you";

export function ProductDemo() {
  const [tab, setTab] = useState<Tab>("all");

  const visible =
    tab === "all" ? demoPhotos : demoPhotos.filter((p) => p.ofYou);

  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-teal-600">
          See it in action
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Your camera roll, automatically sorted by who&apos;s in the shot
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Every upload runs through TripSync&apos;s on-device-first face
          matching. One tap and you&apos;re only looking at photos you&apos;re
          actually in.
        </p>
      </div>

      {/* Browser / app chrome */}
      <div className="mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        {/* Window bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <div className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-slate-400 ring-1 ring-slate-200 sm:text-left">
            app.tripsync.com/albums/cabo-trip-26
          </div>
        </div>

        {/* Album top bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-lg font-bold text-slate-900">
              Cabo Trip &apos;26 🇲🇽
            </p>
            <p className="text-xs text-slate-500">Shared album &bull; 5 members</p>
          </div>
          <div className="flex -space-x-2.5">
            {groupMembers.map((m) => (
              <div
                key={m.name}
                title={m.name}
                className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-white"
              >
                <Image
                  src={unsplash(m.id, { w: 80, faces: true })}
                  alt={m.name}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
            ))}
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
              +12
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 px-4 pt-4 sm:px-6">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`relative rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "all"
                ? "text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "all" && (
              <motion.span
                layoutId="tab-highlight"
                className="absolute inset-0 rounded-full bg-teal-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative">All Photos (248)</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("you")}
            className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "you"
                ? "text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab === "you" && (
              <motion.span
                layoutId="tab-highlight"
                className="absolute inset-0 rounded-full bg-teal-600"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <span
                className={`relative flex h-4 w-4 overflow-hidden rounded-full ring-1 ${
                  tab === "you" ? "ring-white/60" : "ring-slate-300"
                }`}
              >
                <Image
                  src={unsplash(groupMembers[0].id, { w: 40, faces: true })}
                  alt=""
                  fill
                  sizes="16px"
                  className="object-cover"
                />
              </span>
              Photos of You (32)
            </span>
          </button>
        </div>

        {/* Photo grid */}
        <div className="px-4 py-6 sm:px-6">
          <AnimatePresence mode="popLayout">
            <motion.div layout className="masonry">
              {visible.map((photo, i) => (
                <motion.div
                  layout
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.35, delay: i * 0.02 }}
                  className={`group relative overflow-hidden rounded-xl bg-slate-100 ${
                    photo.tall ? "aspect-[3/4]" : "aspect-square"
                  }`}
                >
                  <Image
                    src={unsplash(photo.id, { w: 500 })}
                    alt="Trip photo"
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  {photo.ofYou && (
                    <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-slate-800 shadow-sm backdrop-blur">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                      </span>
                      TripSync AI: Recognized as You
                    </span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {tab === "you" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"
            >
              <ScanFace className="h-3.5 w-3.5 text-teal-600" />
              Showing a preview &mdash; all 32 matches sync to your phone
              instantly.
            </motion.div>
          )}
        </div>
      </div>

      <Legend />
    </section>
  );
}

function Legend() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1.5">
        <Circle className="h-2 w-2 fill-teal-500 text-teal-500" />
        AI-matched to your face
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Zap className="h-3 w-3" />
        No manual tagging, ever
      </span>
    </div>
  );
}
