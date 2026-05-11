import type { SewSuiteFAQ, SewSuiteService } from "@/types";

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Sew Suite",
    description:
      "Custom embroidery and branded apparel for businesses across North Texas",
    url: "https://sewsuite.com",
    telephone: "TBD",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Allen",
      addressRegion: "TX",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.103,
      longitude: -96.671,
    },
    areaServed: [
      "Allen TX",
      "Lucas TX",
      "McKinney TX",
      "Frisco TX",
      "Plano TX",
      "DFW",
    ],
    priceRange: "$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "3",
    },
  };
}

export function faqPageSchema(faqs: SewSuiteFAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function serviceSchema(service: SewSuiteService) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.long_desc ?? service.short_desc ?? "",
    provider: {
      "@type": "LocalBusiness",
      name: "Sew Suite",
      url: "https://sewsuite.com",
    },
    areaServed: "Allen TX",
    url: `https://sewsuite.com/services/${service.slug}`,
  };
}
