import type { Metadata } from "next";
import Link from "next/link";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";
import SchemaOrg from "@/components/ui/SchemaOrg";
import { localBusinessSchema } from "@/lib/schema";

const areas = snapshot.ServiceArea.filter((area) => area.active && area.indexable).slice().sort((a,b)=>a.city.localeCompare(b.city));
export const metadata: Metadata = {
  title: "Custom Embroidery & Branded Apparel Service Areas | Sew Suite",
  description: "Explore Sew Suite's custom embroidery, screen printing, DTF and branded apparel service areas across North Texas, with nationwide shipping available.",
  alternates: { canonical: "https://sewsuite.com/service-areas" },
  openGraph: {
    title: "North Texas Custom Apparel Service Areas | Sew Suite",
    description: "Local embroidery, screen printing and decorated apparel for North Texas businesses, schools and teams.",
    url: "https://sewsuite.com/service-areas",
    type: "website",
  },
};
export default function ServiceAreasPage(){
  return (
    <>
      <SchemaOrg schema={localBusinessSchema()} />
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sew-cream/70 text-sm mb-5"><Link href="/">Home</Link> / Service Areas</nav>
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">Custom Apparel Service Areas</h1>
          <p className="text-sew-cream/80 text-lg max-w-3xl">Sew Suite works with businesses, schools, teams and organizations throughout North Texas. Local pickup and nationwide shipping options are available for eligible projects.</p>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map(area => (
            <Link key={area.slug} href={`/service-areas/${area.slug}`} className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md hover:border-sew-green transition-all">
              <h2 className="text-lg font-semibold text-sew-green mb-3">Custom Embroidery & Apparel in {area.city}, TX</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{area.local_intro}</p>
              <span className="block mt-4 text-sm font-medium text-sew-green">Explore {area.city} services →</span>
            </Link>
          ))}
        </div>
        <div className="mt-12 rounded-xl bg-sew-cream p-8">
          <h2 className="text-2xl font-semibold text-sew-slate mb-3">Not seeing your city?</h2>
          <p className="text-gray-700 mb-5">Sew Suite also ships completed apparel orders across the United States. Contact us to discuss the scope of your project and fulfillment options.</p>
          <Link href="/contact" className="inline-flex px-6 py-3 bg-sew-green text-white font-semibold rounded-lg hover:opacity-90">Request a Quote</Link>
        </div>
      </main>
    </>
  );
}
