import Link from "next/link";
import SectionWrapper from "@/components/ui/SectionWrapper";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";

// Sew Suite's published catalog is the canonical source until the independent
// public content API and secured agency editing workflow are accepted.
const services=snapshot.ServiceType
  .filter(s=>s.active&&s.publicly_advertised)
  .slice().sort((a,b)=>a.display_order-b.display_order);

export default function ServicesGrid(){
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green mb-4">What We Do</h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Embroidery, screen printing, DTF and branded apparel for North Texas businesses, schools, teams and organizations.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(s=>(
          <Link key={s.slug} href={`/services/${s.slug}`}
            className="group bg-white border border-gray-200 rounded-xl p-7 hover:border-sew-green hover:shadow-md transition-all duration-300 flex flex-col">
            <div className="w-12 h-12 rounded-lg bg-sew-cream text-sew-green group-hover:bg-sew-green group-hover:text-white transition-colors duration-300 mb-5 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16M8 3v18M16 3v18"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-sew-slate mb-2 group-hover:text-sew-green transition-colors">{s.name}</h3>
            <p className="text-gray-600 text-sm leading-relaxed flex-1">{s.short_description}</p>
            <span className="mt-5 text-sew-green text-sm font-semibold">Learn more →</span>
          </Link>
        ))}
      </div>
      <div className="mt-9 text-center"><Link className="font-semibold text-sew-green hover:underline" href="/services">See all services →</Link></div>
    </SectionWrapper>
  );
}
