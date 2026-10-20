import type { Metadata } from "next";
import SchemaOrg from "@/components/ui/SchemaOrg";
import HeroSection from "@/components/sections/HeroSection";
import FeatureColumns from "@/components/sections/FeatureColumns";
import ServicesGrid from "@/components/sections/ServicesGrid";
import GalleryGrid from "@/components/sections/GalleryGrid";
import ClientTypesSection from "@/components/sections/ClientTypesSection";
import WhyUsGrid from "@/components/sections/WhyUsGrid";
import LogoPlacementGuide from "@/components/sections/LogoPlacementGuide";
import ProcessSteps from "@/components/sections/ProcessSteps";
import StitchInkCTA from "@/components/sections/StitchInkCTA";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FAQSection from "@/components/sections/FAQSection";
import { localBusinessSchema, faqPageSchema } from "@/lib/schema";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";
import type { SewSuiteFAQ } from "@/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sew Suite | Custom Embroidery & Branded Apparel — Allen, TX",
  description:
    "Professional custom embroidery and branded apparel for businesses, teams, and organizations in Allen, Lucas, and the DFW area. Serving North Texas and customers nationwide.",
  alternates: {
    canonical: "https://sewsuite.com",
  },
  openGraph: {
    title: "Sew Suite | Custom Embroidery & Branded Apparel — Allen, TX",
    description:
      "Professional custom embroidery and branded apparel for businesses, teams, and organizations in Allen, Lucas, and the DFW area.",
    url: "https://sewsuite.com",
    type: "website",
    siteName: "Sew Suite",
  },
};

const verifiedFAQs: SewSuiteFAQ[] = snapshot.ServiceType
  .filter(service => service.active && service.publicly_advertised)
  .flatMap(service => (Array.isArray(service.faqs) ? service.faqs : []).map((item,i) => ({
    id: `${service.slug}-${i}`,
    question: item.question,
    answer: item.answer,
    sort_order: i,
    active: true,
  })))
  .filter((item,i,arr) => arr.findIndex(x => x.question === item.question) === i)
  .slice(0, 8);

export default function HomePage() {
  const faqs = verifiedFAQs;
  // Testimonials stay unpublished until owner-approved customer reviews are migrated.
  const testimonials: never[] = [];

  return (
    <>
      <SchemaOrg schema={[localBusinessSchema(), faqPageSchema(faqs)]} />
      <HeroSection />
      <FeatureColumns />
      <ServicesGrid />
      <GalleryGrid />
      <ClientTypesSection />
      <WhyUsGrid />
      <LogoPlacementGuide />
      <ProcessSteps />
      <StitchInkCTA />
      <TestimonialsSection testimonials={testimonials} />
      <FAQSection faqs={faqs} />
    </>
  );
}
