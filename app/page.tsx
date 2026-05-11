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
import { getTestimonials, getFAQs } from "@/lib/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Sew Suite | Custom Embroidery & Branded Apparel — Allen, TX",
  description:
    "Professional custom embroidery and branded apparel for businesses, teams, and organizations in Allen, Lucas, and the DFW area. 17+ years of experience. Fast turnaround. Low minimums.",
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

export default async function HomePage() {
  const [testimonials, faqs] = await Promise.all([
    getTestimonials().catch(() => []),
    getFAQs().catch(() => []),
  ]);

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
