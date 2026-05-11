"use client";

import { useState } from "react";
import type { SewSuiteFAQ } from "@/types";

const fallbackFAQs: SewSuiteFAQ[] = [
  { id: "1", question: "What's the minimum order quantity?", answer: "Most embroidery and screen print orders start at 12 pieces. Some specialty items or complex jobs may have higher minimums. Contact us with your specific needs and we'll find the right solution.", sort_order: 0, active: true },
  { id: "2", question: "Do I need print-ready artwork?", answer: "We can work with most file formats — AI, EPS, PDF, and high-res PNG are ideal. If you only have a low-resolution logo, we can often work with it or advise on getting a proper file from a designer. Just send us what you have.", sort_order: 1, active: true },
  { id: "3", question: "How long does an order take?", answer: "Standard turnaround is 7-10 business days from proof approval. Rush options are available for an additional fee — contact us to discuss your timeline.", sort_order: 2, active: true },
  { id: "4", question: "Can you source the garments for me?", answer: "Yes. We work with multiple wholesale suppliers and can source polos, t-shirts, jackets, hats, bags, and more. Just tell us what you're looking for and your budget.", sort_order: 3, active: true },
  { id: "5", question: "What's the difference between embroidery and screen printing?", answer: "Embroidery uses thread stitched directly into the fabric — it's durable, professional, and ideal for logos on polos, hats, and jackets. Screen printing uses ink applied to the surface of the fabric — it's better for complex artwork, large prints, and high-quantity t-shirt runs.", sort_order: 4, active: true },
  { id: "6", question: "Do you offer design services?", answer: "We handle the digitizing process that converts your artwork for embroidery production. For original logo design or brand creation, we recommend working with a graphic designer first, then bringing us the finished file.", sort_order: 5, active: true },
  { id: "7", question: "Can I see a proof before my order goes into production?", answer: "Always. We send a digital proof for approval before any production begins. Nothing gets made until you sign off.", sort_order: 6, active: true },
  { id: "8", question: "Do you ship or is pickup only?", answer: "Both. We ship nationwide via UPS/FedEx, and local pickup is available at our Allen/Lucas TX location.", sort_order: 7, active: true },
];

interface Props {
  faqs?: SewSuiteFAQ[];
  heading?: string;
}

export default function FAQSection({ faqs = fallbackFAQs, heading = "Common Questions About Custom Embroidery & Branded Apparel" }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = faqs.length > 0 ? faqs : fallbackFAQs;

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
