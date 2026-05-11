import type { Metadata } from "next";
import Link from "next/link";
import { getServices } from "@/lib/content";
import { localBusinessSchema } from "@/lib/schema";
import SchemaOrg from "@/components/ui/SchemaOrg";
import SectionWrapper from "@/components/ui/SectionWrapper";
import CTAButton from "@/components/ui/CTAButton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Custom Embroidery & Apparel Services | Sew Suite",
  description:
    "Explore Sew Suite's full range of decorated apparel services — custom embroidery, screen printing, branded apparel programs, hats and caps, corporate gifts, and team uniforms.",
  alternates: { canonical: "https://sewsuite.com/services" },
  openGraph: {
    title: "Custom Embroidery & Apparel Services | Sew Suite",
    description:
      "From custom embroidery to screen printing and team uniforms — every decoration service for businesses in Allen TX and DFW.",
    url: "https://sewsuite.com/services",
    type: "website",
    siteName: "Sew Suite",
  },
};

const fallbackServices = [
  { slug: "custom-embroidery", name: "Custom Embroidery", short_desc: "Thread-perfect logos on polos, hats, jackets, bags, and more." },
  { slug: "screen-printing", name: "Screen Printing", short_desc: "Vibrant, long-lasting prints for t-shirts, hoodies, and event apparel." },
  { slug: "branded-apparel", name: "Branded Apparel", short_desc: "Full-service apparel programs for businesses — sourced, decorated, delivered." },
  { slug: "hats-and-caps", name: "Hats & Caps", short_desc: "Structured caps, beanies, and visors with embroidered or printed logos." },
  { slug: "corporate-gifts", name: "Corporate Gifts", short_desc: "Branded merchandise packages for employees, clients, and company events." },
  { slug: "team-uniforms", name: "Team Uniforms", short_desc: "Jerseys and performance wear for sports teams and leagues, named and numbered." },
];

export default async function ServicesPage() {
  const services = await getServices().catch(() => fallbackServices);
  const items = services.length > 0 ? services : fallbackServices;

  return (
    <>
      <SchemaOrg schema={localBusinessSchema()} />

      {/* Hero */}
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">
            Our Services
          </h1>
          <p className="text-sew-cream/75 text-lg max-w-2xl">
            Every decoration method under one roof — done right, by a team with
            17+ years of experience.
          </p>
        </div>
      </div>

      <SectionWrapper bg="cream">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((s) => (
            <Link
              key={s.slug}
              href={`/services/${s.slug}`}
              className="group bg-white border border-gray-200 rounded-xl p-8 hover:border-sew-green hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <h2 className="text-lg font-semibold text-sew-slate mb-3 group-hover:text-sew-green transition-colors">
                {s.name}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed flex-1">
                {s.short_desc}
              </p>
              <p className="mt-6 text-sew-green text-sm font-medium flex items-center gap-1">
                Learn more
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-16 bg-sew-green rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-semibold text-sew-cream mb-4">
            Not sure which service is right for you?
          </h2>
          <p className="text-sew-cream/70 mb-7 max-w-lg mx-auto text-sm">
            Tell us about your project and we'll recommend the best method,
            garment, and placement for your order.
          </p>
          <CTAButton href="/contact" variant="primary">
            Get a Free Quote
          </CTAButton>
        </div>
      </SectionWrapper>
    </>
  );
}
