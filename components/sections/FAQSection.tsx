"use client";

import { useState } from "react";
import type { SewSuiteFAQ } from "@/types";

interface Props {
  faqs?: SewSuiteFAQ[];
  heading?: string;
}

export default function FAQSection({ faqs = [], heading = "Common Questions About Custom Embroidery & Branded Apparel" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = faqs.filter(f => f.active === true);
  if (items.length === 0) return null;

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green text-center mb-12">
          {heading}
        </h2>
        <div className="space-y-2">
          {items.map((faq, i) => (
            <div
              key={faq.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 hover:bg-sew-cream/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span className="font-medium text-sew-slate text-sm pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 text-sew-green transition-transform duration-200 ${openIndex === i ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === i && (
                <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
