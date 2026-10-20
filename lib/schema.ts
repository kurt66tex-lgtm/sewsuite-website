// Local business information must be grounded in the currently published Sew Suite website.
// Avoid fabricated rating, office coordinates, and placeholder telephone in search results.
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Sew Suite",
    description:
      "Custom embroidery, screen printing, DTF printing and branded apparel for businesses, schools, teams and organizations in North Texas and nationwide",
    url: "https://sewsuite.com",
    telephone: "+1-469-640-8568",
    email: "support@sewsuite.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Allen",
      addressRegion: "TX",
      addressCountry: "US",
    },
    areaServed: [
      "Allen TX", "McKinney TX", "Plano TX", "Frisco TX", "Lucas TX",
      "Fairview TX", "Parker TX", "Murphy TX", "Wylie TX", "Richardson TX",
      "Garland TX", "Prosper TX", "Celina TX", "Melissa TX", "Princeton TX",
      "The Colony TX", "Dallas TX", "Rockwall TX", "Rowlett TX", "Sachse TX",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Custom Apparel and Decoration Services",
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
