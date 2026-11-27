"use client";

import { motion } from "framer-motion";
import { Check, HandCoins, Sparkles } from "lucide-react";

import { STUDIO_URL, CONTACT_WHATSAPP } from "@/lib/links";

// Marketing pricing. Hand-curated (kept in sync with the API plan catalog in
// tripsync-api/src/config/plans.ts) so the content is in the static HTML - no loading flicker, and
// it's readable by search / answer engines. Checkout happens in Studio after sign-in.
type Tier = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "Free",
    tagline: "Try it, no card needed",
    features: [
      "AI face-recognition delivery",
      "Full-resolution photos",
      "Upload from the web Studio",
      "5 GB storage",
      "Up to 1,000 photos",
    ],
  },
  {
    name: "Essential",
    price: "₹2,999",
    tagline: "For getting started",
    features: [
      "AI face-recognition delivery",
      "Full-resolution photos",
      "Upload from the web Studio",
      "50 GB storage",
      "Up to 25,000 photos",
    ],
  },
  {
    name: "Pro",
    price: "₹12,999",
    tagline: "For working photographers",
    highlight: true,
    features: [
      "Everything in Essential",
      "Watermark & proofing",
      "Folders to organise shoots",
      "100 GB storage",
      "Up to 100,000 photos",
    ],
  },
  {
    name: "Premium",
    price: "₹25,999",
    tagline: "For studios & high volume",
    features: [
      "Everything in Pro",
      "250 GB storage",
      "Up to 250,000 photos",
      "Best for busy studios",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-slate-200/70 bg-white/70 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="grid items-end gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14"
        >
          <h2 className="font-editorial text-4xl font-normal leading-[0.95] tracking-[-0.025em] text-slate-950 sm:text-6xl">
            Plans for photographers &amp; studios
          </h2>
          <p className="text-lg leading-8 text-slate-600 lg:pb-1">
            One link, every guest finds their own photos. Pick the plan that fits your volume - pay
            yearly, cancel anytime. Shooting one-off events? See per-event pricing below.
          </p>
        </motion.div>

        <div className="mt-10 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.05 }}
              className={`landing-card landing-card-interactive relative flex flex-col rounded-2xl p-6 sm:p-7 ${
                tier.highlight ? "border-slate-950 ring-1 ring-slate-950" : ""
              }`}
            >
              {tier.highlight ? (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  Most popular
                </span>
              ) : null}

              <h3 className="text-lg font-bold text-slate-950">{tier.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{tier.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold tracking-[-0.035em] text-slate-950 xl:text-4xl">
                  {tier.price}
                </span>
                {tier.price.startsWith("₹") ? (
                  <span className="text-sm text-slate-500">/ year</span>
                ) : null}
              </div>

              <ul className="mt-6 space-y-3.5 border-t border-slate-100 pt-6 text-sm text-slate-600">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={STUDIO_URL}
                className={`mt-8 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  tier.highlight
                    ? "bg-slate-950 text-white hover:bg-teal-800"
                    : "border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {tier.price === "Free" ? "Start free" : "Get started"}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Per-event pricing - a second model for event & sports photographers. A flat per-event
            platform fee (AI matching + hosting); the photographer bills their client directly. Set up
            per event, so the CTA is a conversation, not a checkout. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="landing-dark relative mt-8 overflow-hidden rounded-3xl border border-white/5 p-7 text-white shadow-[0_20px_52px_-40px_rgba(15,23,42,0.68)] sm:p-8"
        >
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-xs font-semibold text-teal-100">
                <HandCoins className="h-3.5 w-3.5" />
                Per-event pricing - for event &amp; sports photographers
              </span>
              <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.025em] text-white sm:text-3xl">
                Pay per event, not per year
              </h3>
              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                Perfect for marathons, tournaments, and one-off shoots. Pay a small per-event fee that
                covers the AI face matching and hosting - then bill your clients whatever you like,
                directly. TripSync only takes its fee; we don&apos;t touch what you charge. The fee
                scales with the event&apos;s size, so let&apos;s talk through yours.
              </p>
            </div>
            <a
              href={CONTACT_WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-50"
            >
              Contact us for details
            </a>
          </div>
        </motion.div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Guests receive and download their photos free in the TripSync app. Plan prices exclude GST.
        </p>
      </div>
    </section>
  );
}
