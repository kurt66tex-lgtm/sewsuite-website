import SectionWrapper from "@/components/ui/SectionWrapper";

const reasons = [
  {
    num: "01",
    title: "17+ Years of Experience",
    body: "We've decorated more than 10,000 orders for businesses across North Texas. We've seen every logo, every garment challenge, every rush deadline.",
  },
  {
    num: "02",
    title: "In-House Production",
    body: "No middlemen. Everything is decorated in-house, which means faster turnaround and tighter quality control.",
  },
  {
    num: "03",
    title: "Expert Digitizing",
    body: "Bad digitizing ruins good logos. We properly convert every design for optimal stitch quality before a single thread is placed.",
  },
  {
    num: "04",
    title: "No Surprise Pricing",
    body: "You get a clear quote before anything starts. What we quote is what you pay.",
  },
  {
    num: "05",
    title: "Low Minimums",
    body: "Most services start at just 12 pieces, making professional branded apparel accessible for small businesses and growing teams.",
  },
  {
    num: "06",
    title: "Local & Responsive",
    body: "Based in Allen/Lucas TX. Real people, real answers, fast response times. Not a faceless online order form.",
  },
];

export default function WhyUsGrid() {
  return (
    <SectionWrapper bg="cream">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green mb-3">
          Why Businesses Choose Sew Suite
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {reasons.map((r) => (
          <div key={r.num} className="flex gap-5">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-2xl font-bold text-sew-gold/40">{r.num}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-sew-slate mb-2">{r.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{r.body}</p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
