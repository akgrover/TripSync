"use client";

import { motion } from "framer-motion";
import { BetaForm } from "./beta-form";

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
          Stop losing photos in group chats.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Join the private beta and get your next trip&apos;s photos in one
          full-resolution vault — sorted for you, automatically.
        </p>
        <div className="mt-8 flex justify-center">
          <BetaForm align="center" size="large" />
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Limited to 500 beta spots &bull; Free forever for early users
        </p>
      </motion.div>
    </section>
  );
}
