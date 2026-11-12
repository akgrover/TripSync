import { ChevronDown } from "lucide-react";

import { FAQS } from "@/lib/faq";

// Visible FAQ. Native <details> so the answers are always in the DOM (crawlable by search + answer
// engines) and work without JS. The same content is emitted as FAQPage JSON-LD in the layout.
export function Faq() {
  return (
    <section id="faq" className="py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mt-4 text-center text-lg text-slate-600">
          How TripSync works for photographers, event hosts, and friends.
        </p>

        <div className="mt-10 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-6 py-5 [&_summary]:list-none">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold text-slate-900">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-relaxed text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
