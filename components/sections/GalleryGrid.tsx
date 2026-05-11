import Image from "next/image";
import Link from "next/link";
import SectionWrapper from "@/components/ui/SectionWrapper";

const photos = [
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/c3df55321_Allen_eagles_applique.jpg",
    alt: "Allen Eagles custom embroidered applique on apparel",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/0f95beb52_Easygame_cap.jpg",
    alt: "Easygame custom embroidered cap",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/cf546f01e_Fire_arms_instructorcap.jpg",
    alt: "Firearms instructor custom embroidered cap",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/8884949b5_Greentech_renewables_bag.jpg",
    alt: "GreenTech Renewables custom embroidered tote bag",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/493bd22ab_Rodeo_cap.jpg",
    alt: "Custom embroidered rodeo event cap",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/9198b7c65_Solar_50aniversary_jacket.jpg",
    alt: "Solar company 50th anniversary custom embroidered jacket",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/3e8f6f7ca_Tommy_terrifics_carwash_visor.jpg",
    alt: "Tommy Terrific's Car Wash custom embroidered visor",
  },
  {
    src: "https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/384a492a1_Winter_wonderland_sweatshirt.jpg",
    alt: "Custom screen-printed Winter Wonderland sweatshirt",
  },
];

export default function GalleryGrid() {
  return (
    <SectionWrapper bg="cream">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green mb-4">
          Our Work
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          A sample of what we've produced for businesses across North Texas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo, i) => (
          <div
            key={photo.src}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 group"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              priority={i < 2}
            />
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-sew-green font-semibold hover:text-sew-green-light transition-colors text-sm"
        >
          See the Full Gallery
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </SectionWrapper>
  );
}
