import Link from "next/link";
import SectionWrapper from "@/components/ui/SectionWrapper";

const services = [
  {
    slug: "custom-embroidery",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    name: "Custom Embroidery",
    desc: "Thread-perfect logos and text on polos, hats, jackets, bags, and more. Our most popular service for a reason.",
  },
  {
    slug: "screen-printing",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
    ),
    name: "Screen Printing",
    desc: "Vibrant, long-lasting prints for t-shirts, hoodies, and apparel. Best for larger runs and bold designs.",
  },
  {
    slug: "branded-apparel",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    name: "Branded Apparel",
    desc: "Full-service branded uniform and apparel programs for businesses. We handle sourcing, decoration, and delivery.",
  },
  {
    slug: "hats-and-caps",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    name: "Hats & Caps",
    desc: "Structured and unstructured caps, beanies, and visors with embroidered or printed logos. Always a crowd favorite.",
  },
  {
    slug: "corporate-gifts",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    name: "Corporate Gifts",
    desc: "Branded bags, drinkware, jackets, and apparel sets for employee gifts, client appreciation, and company events.",
  },
  {
    slug: "team-uniforms",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    name: "Team Uniforms",
    desc: "Jerseys, polos, and performance wear for sports teams, leagues, and company sports days. Numbered and named.",
  },
];

export default function ServicesGrid() {
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green mb-4">
          What We Do
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          From logo to finished product — every decoration method under one roof.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((s) => (
          <Link
            key={s.slug}
            href={`/services/${s.slug}`}
            className="group bg-white border border-gray-200 rounded-xl p-7 hover:border-sew-green hover:shadow-md transition-all duration-300"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-sew-cream text-sew-green group-hover:bg-sew-green group-hover:text-white transition-colors duration-300 mb-5">
              {s.icon}
            </div>
            <h3 className="text-base font-semibold text-sew-slate mb-2 group-hover:text-sew-green transition-colors">
              {s.name}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            <p className="mt-4 text-sew-green text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Learn more
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </p>
          </Link>
        ))}
      </div>
    </SectionWrapper>
  );
}
