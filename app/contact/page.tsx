import type { Metadata } from "next";
import { localBusinessSchema } from "@/lib/schema";
import SchemaOrg from "@/components/ui/SchemaOrg";
import SectionWrapper from "@/components/ui/SectionWrapper";
import ContactForm from "@/components/ui/ContactForm";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact Sew Suite | Get a Free Quote",
  description:
    "Contact Sew Suite for a free custom embroidery or branded apparel quote. Serving businesses in Allen, Lucas, and the DFW area. Fast response — usually within 24 hours.",
  alternates: { canonical: "https://sewsuite.com/contact" },
  openGraph: {
    title: "Contact Sew Suite | Get a Free Quote",
    description:
      "Send us your logo and project details and we'll get back to you with a quote within 24 business hours.",
    url: "https://sewsuite.com/contact",
    type: "website",
    siteName: "Sew Suite",
  },
};

const infoItems = [
  {
    label: "Location",
    value: "Allen/Lucas, TX (DFW Area)",
    sub: "Local pickup available",
  },
  {
    label: "Response Time",
    value: "Within 1 Business Day",
    sub: "Quotes typically within 24 hours",
  },
  {
    label: "Shipping",
    value: "Nationwide via UPS/FedEx",
    sub: "Or local pickup in Allen/Lucas TX",
  },
  {
    label: "Minimum Order",
    value: "12 Pieces",
    sub: "For most embroidery and screen print orders",
  },
];

export default function ContactPage() {
  return (
    <>
      <SchemaOrg schema={localBusinessSchema()} />

      {/* Hero */}
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">
            Get a Free Quote
          </h1>
          <p className="text-sew-cream/75 text-lg max-w-2xl">
            Tell us about your project and we'll respond with pricing, garment
            recommendations, and next steps — usually within 24 business hours.
          </p>
        </div>
      </div>

      <SectionWrapper bg="white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-14">
          {/* Form */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-sew-slate mb-7">
              Send Us a Message
            </h2>
            <ContactForm />
          </div>

          {/* Info sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="bg-sew-cream rounded-xl p-6 border border-sew-cream-dark"
              >
                <p className="text-xs uppercase tracking-widest text-sew-tan font-semibold mb-2">
                  {item.label}
                </p>
                <p className="font-semibold text-sew-slate text-sm">{item.value}</p>
                <p className="text-gray-500 text-xs mt-1">{item.sub}</p>
              </div>
            ))}

            <div className="bg-sew-green rounded-xl p-6 mt-4">
              <p className="text-sew-cream/70 text-sm leading-relaxed">
                You can also browse and order online 24/7 at{" "}
                <a
                  href="https://stitchinkstudios.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sew-gold hover:text-sew-gold-light font-medium transition-colors"
                >
                  Stitch Ink Studios ↗
                </a>
              </p>
            </div>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
