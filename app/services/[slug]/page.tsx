import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getService } from "@/lib/content";
import { localBusinessSchema, serviceSchema } from "@/lib/schema";
import SchemaOrg from "@/components/ui/SchemaOrg";
import SectionWrapper from "@/components/ui/SectionWrapper";
import CTAButton from "@/components/ui/CTAButton";
import FAQSection from "@/components/sections/FAQSection";
import type { SewSuiteFAQ } from "@/types";

export const revalidate = 3600;

const SERVICE_SLUGS = [
  "custom-embroidery",
  "screen-printing",
  "branded-apparel",
  "hats-and-caps",
  "corporate-gifts",
  "team-uniforms",
];

export async function generateStaticParams() {
  return SERVICE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug).catch(() => null);

  const title = service?.meta_title ?? `${slug.replace(/-/g, " ")} | Sew Suite`;
  const description =
    service?.meta_desc ??
    "Professional custom embroidery and decorated apparel services in Allen TX and DFW.";

  return {
    title,
    description,
    alternates: { canonical: `https://sewsuite.com/services/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://sewsuite.com/services/${slug}`,
      type: "website",
      siteName: "Sew Suite",
    },
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!SERVICE_SLUGS.includes(slug)) {
    notFound();
  }

  const service = await getService(slug).catch(() => null);

  if (!service) {
    notFound();
  }

  const faqItems: SewSuiteFAQ[] = (service.faq_items ?? []).map((f, i) => ({
    id: `${service.id}-faq-${i}`,
    question: f.q,
    answer: f.a,
    sort_order: i,
    active: true,
  }));

  const longDescParagraphs = (service.long_desc ?? "").split("\n\n").filter(Boolean);

  return (
    <>
      <SchemaOrg schema={[localBusinessSchema(), serviceSchema(service)]} />

      {/* Hero */}
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sew-cream/50 text-sm mb-6">
            <Link href="/" className="hover:text-sew-cream transition-colors">Home</Link>
            <span>/</span>
            <Link href="/services" className="hover:text-sew-cream transition-colors">Services</Link>
            <span>/</span>
            <span className="text-sew-cream">{service.name}</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">
            {service.name}
          </h1>
          {service.short_desc && (
            <p className="text-sew-cream/75 text-lg max-w-2xl">{service.short_desc}</p>
          )}
        </div>
      </div>

      <SectionWrapper bg="white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="prose prose-slate max-w-none">
              {longDescParagraphs.map((para, i) => (
                <p key={i} className="text-gray-600 leading-relaxed mb-5 text-base">
                  {para}
                </p>
              ))}
            </div>

            {service.features && service.features.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold text-sew-slate mb-5">
                  What's Included
                </h2>
                <ul className="space-y-3">
                  {service.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-sew-green flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600 text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="bg-sew-green rounded-2xl p-8 sticky top-24">
              <h3 className="text-xl font-semibold text-sew-cream mb-3">
                Ready to get started?
              </h3>
              <p className="text-sew-cream/70 text-sm mb-6 leading-relaxed">
                Send us your logo and tell us what you need. We'll respond with
                a quote within 24 business hours.
              </p>
              <CTAButton href="/contact" variant="primary" className="w-full justify-center">
                Get a Free Quote
              </CTAButton>
              <div className="mt-5 pt-5 border-t border-sew-green-light">
                <p className="text-sew-cream/50 text-xs text-center">
                  17+ years experience · In-house production · Low minimums
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {faqItems.length > 0 && (
        <FAQSection
          faqs={faqItems}
          heading={`Common Questions About ${service.name}`}
        />
      )}

      {/* Bottom CTA */}
      <div className="bg-sew-cream py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold text-sew-green mb-4">
            Let's talk about your {service.name.toLowerCase()} order.
          </h2>
          <p className="text-gray-600 mb-7 max-w-lg mx-auto text-sm">
            No obligation. We'll review your needs, recommend garments, and send
            a clear quote.
          </p>
          <CTAButton href="/contact" variant="primary">
            Contact Us
          </CTAButton>
        </div>
      </div>
    </>
  );
}
