import type { Metadata } from "next";
import Image from "next/image";
import { localBusinessSchema } from "@/lib/schema";
import SchemaOrg from "@/components/ui/SchemaOrg";
import SectionWrapper from "@/components/ui/SectionWrapper";
import CTAButton from "@/components/ui/CTAButton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Our Work | Sew Suite",
  description:
    "Browse Sew Suite's custom embroidery and branded apparel portfolio. See examples from real orders produced for businesses across Allen TX and DFW.",
  alternates: { canonical: "https://sewsuite.com/gallery" },
  openGraph: {
    title: "Our Work | Sew Suite",
    description:
      "Custom embroidery and branded apparel portfolio — real orders for real businesses in Allen TX and DFW.",
    url: "https://sewsuite.com/gallery",
    type: "website",
    siteName: "Sew Suite",
  },
};

const photos = [
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/c3df55321_Allen_eagles_applique.jpg",
    alt: "Allen Eagles custom embroidered applique on jackets — booster club order",
    label: "Allen Eagles Booster Club",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/0f95beb52_Easygame_cap.jpg",
    alt: "Easygame custom embroidered structured cap",
    label: "Easygame — Custom Cap",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/cf546f01e_Fire_arms_instructorcap.jpg",
    alt: "Firearms instructor custom embroidered cap with logo",
    label: "Firearms Instructor Cap",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/8884949b5_Greentech_renewables_bag.jpg",
    alt: "GreenTech Renewables branded embroidered tote bag",
    label: "GreenTech Renewables — Branded Bag",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/493bd22ab_Rodeo_cap.jpg",
    alt: "Custom embroidered rodeo event cap",
    label: "Rodeo Event Cap",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/9198b7c65_Solar_50aniversary_jacket.jpg",
    alt: "Solar company 50th anniversary custom embroidered commemorative jacket",
    label: "Solar 50th Anniversary Jacket",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/3e8f6f7ca_Tommy_terrifics_carwash_visor.jpg",
    alt: "Tommy Terrific's Car Wash custom embroidered visor",
    label: "Tommy Terrific's Car Wash — Visor",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/384a492a1_Winter_wonderland_sweatshirt.jpg",
    alt: "Custom screen-printed Winter Wonderland event sweatshirt",
    label: "Winter Wonderland Event Sweatshirt",
  },
];

export default function GalleryPage() {
  return (
    <>
      <SchemaOrg schema={localBusinessSchema()} />

      {/* Hero */}
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">
            Our Work
          </h1>
          <p className="text-sew-cream/75 text-lg max-w-2xl">
            Real orders. Real businesses. A sample of what we've produced for
            clients across North Texas.
          </p>
        </div>
      </div>

      <SectionWrapper bg="cream">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {photos.map((photo, i) => (
            <div
              key={photo.src}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                priority={i < 4}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white text-xs font-medium">{photo.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-sew-green rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-semibold text-sew-cream mb-4">
            Ready to create something like this?
          </h2>
          <p className="text-sew-cream/70 mb-7 text-sm max-w-lg mx-auto">
            Send us your logo and project details and we'll get you a quote —
            usually within 24 business hours.
          </p>
          <CTAButton href="/contact" variant="primary">
            Get a Free Quote
          </CTAButton>
        </div>
      </SectionWrapper>
    </>
  );
}
