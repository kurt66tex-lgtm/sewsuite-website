import SectionWrapper from "@/components/ui/SectionWrapper";

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    title: "Your Logo, Perfected",
    body: "Every order starts with digitizing your artwork for optimal stitch quality. We don't just put a logo on a shirt — we make it look like it belongs there.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Fast Turnaround, No Surprises",
    body: "Clear timelines, honest pricing, and proactive communication from first quote to final delivery. You'll always know where your order stands.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Built for Businesses",
    body: "From 12-piece minimums to corporate runs of 500+, we work with businesses, teams, schools, and organizations of every size.",
  },
];

export default function FeatureColumns() {
  return (
    <SectionWrapper bg="cream">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green">
          Custom Embroidery & Decorated Apparel Done Right
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-sew-green/10 text-sew-green mb-6">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold text-sew-slate mb-3">{f.title}</h3>
            <p className="text-gray-600 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
