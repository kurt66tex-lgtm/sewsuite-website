import type { Metadata } from "next";
import Link from "next/link";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";
import SchemaOrg from "@/components/ui/SchemaOrg";
import { localBusinessSchema } from "@/lib/schema";

const services=snapshot.ServiceType.filter(s=>s.active&&s.publicly_advertised).slice().sort((a,b)=>a.display_order-b.display_order);

export const metadata: Metadata = {
  title:"Embroidery, Screen Printing & Apparel Services | Sew Suite",
  description:"Professional custom embroidery, screen printing, DTF printing, corporate apparel, team and school gear, hats, bags, towels and artwork assistance in North Texas.",
  alternates:{canonical:"https://sewsuite.com/services"},
  openGraph:{title:"Custom Apparel Services | Sew Suite",description:"Explore Sew Suite's full range of nine custom apparel and decoration services.",url:"https://sewsuite.com/services",type:"website"},
};

export default function ServicesPage(){
  return <>
    <SchemaOrg schema={localBusinessSchema()} />
    <div className="bg-sew-green pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-sew-cream/70 text-sm mb-5"><Link href="/">Home</Link> / Services</nav>
        <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">Custom Apparel & Decoration Services</h1>
        <p className="text-sew-cream/80 text-lg max-w-3xl">Browse embroidery, screen printing, DTF, business uniforms, team apparel, hats and caps, bags and towels, promotional items and artwork assistance.</p>
      </div>
    </div>
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service=>(
          <Link key={service.slug} href={`/services/${service.slug}`} className="bg-white border border-gray-200 hover:border-sew-green hover:shadow-md transition-all rounded-xl p-7 flex flex-col">
            <h2 className="font-semibold text-sew-slate text-lg mb-3">{service.name}</h2>
            <p className="text-gray-600 text-sm leading-relaxed flex-1">{service.short_description}</p>
            <span className="block mt-5 text-sew-green text-sm font-medium">Learn more →</span>
          </Link>
        ))}
      </div>
      <div className="mt-12 bg-sew-cream rounded-xl p-9 text-center">
        <h2 className="text-2xl font-semibold text-sew-slate mb-3">Planning an apparel project?</h2>
        <p className="text-gray-700 max-w-xl mx-auto mb-6">Share your design, products, quantities, and desired date so Sew Suite can recommend the appropriate decoration method and prepare a quote.</p>
        <Link href="/contact" className="inline-flex bg-sew-green text-white font-semibold rounded-lg px-7 py-3 hover:opacity-90">Request a Quote</Link>
      </div>
    </main>
  </>;
}
