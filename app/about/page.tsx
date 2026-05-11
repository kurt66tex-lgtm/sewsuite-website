import type { Metadata } from "next";
import { localBusinessSchema } from "@/lib/schema";
import SchemaOrg from "@/components/ui/SchemaOrg";
import SectionWrapper from "@/components/ui/SectionWrapper";
import CTAButton from "@/components/ui/CTAButton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About Sew Suite | Custom Embroidery & Branded Apparel — Allen, TX",
  description:
    "Learn about Sew Suite — 17+ years of custom embroidery and branded apparel experience serving businesses across Allen, Lucas, and the DFW area.",
  alternates: { canonical: "https://sewsuite.com/about" },
  openGraph: {
    title: "About Sew Suite",
    description:
      "17+ years decorating apparel for businesses across North Texas. In-house production, expert digitizing, and a commitment to quality.",
    url: "https://sewsuite.com/about",
    type: "website",
    siteName: "Sew Suite",
  },
};

const beliefs = [
  "Good embroidery isn't about the machine — it's about the people running it.",
  "Your logo represents your business. It deserves to look right.",
  "Clear pricing, honest timelines, and proactive communication aren't extras — they're the baseline.",
  "A 12-piece order deserves the same care as a 500-piece order.",
];

const processSteps = [
  "We digitize your logo properly.",
  "We send you a proof for approval.",
  "We produce your order in-house.",
  "We deliver on time.",
];

export default function AboutPage() {
  return (
    <>
      <SchemaOrg schema={localBusinessSchema()} />

      {/* Hero */}
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-6">
            Sewn Into the Fabric of North Texas Business
          </h1>
          <p className="text-sew-cream/75 text-lg leading-relaxed">
            For over 17 years, Sew Suite has been helping businesses across
            Allen, Lucas, McKinney, Frisco, Plano, and the wider DFW metroplex
            look their best.
          </p>
        </div>
      </div>

      <SectionWrapper bg="white">
        <div className="max-w-3xl">
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            What started as a passion for precision craftsmanship has grown into
            a full-service decorated apparel operation trusted by hundreds of
            local businesses, teams, schools, and organizations. We've decorated
            more than 10,000 orders — from a single custom cap to 500-piece
            corporate uniform rollouts.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Every order goes through in-house production. No outsourcing, no
            middlemen, no hand-offs that lose quality along the way. When we
            produce your order, we own it from digitizing to delivery.
          </p>
        </div>
      </SectionWrapper>

      <SectionWrapper bg="cream">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-sew-green mb-7">
              What We Believe
            </h2>
            <ul className="space-y-5">
              {beliefs.map((b) => (
                <li key={b} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-sew-gold mt-2" />
                  <p className="text-gray-600 leading-relaxed text-sm">{b}</p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-sew-green mb-7">
              How We Work
            </h2>
            <ol className="space-y-4">
              {processSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-sew-green text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-gray-600 leading-relaxed text-sm pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </SectionWrapper>

      <SectionWrapper bg="white">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-semibold text-sew-green mb-5">
            Where We Serve
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Based in Allen/Lucas TX, we serve businesses throughout Collin
            County and the greater DFW area — Allen, Lucas, McKinney, Frisco,
            Plano, Prosper, Wylie, and surrounding communities.
          </p>
          <p className="text-gray-600 leading-relaxed mb-10">
            Local pickup is available. We also ship nationwide via UPS and
            FedEx, so if you're outside our backyard, we can still get your
            order to you.
          </p>
          <CTAButton href="/contact" variant="outline">
            Ready to get started? Talk to us.
          </CTAButton>
        </div>
      </SectionWrapper>
    </>
  );
}
