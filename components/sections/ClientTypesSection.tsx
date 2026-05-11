import SectionWrapper from "@/components/ui/SectionWrapper";

const clientTypes = [
  "Restaurants & Food Service",
  "Construction & Contractors",
  "Auto Dealerships & Service",
  "Corporate & Professional Services",
  "Sports Teams & Leagues",
  "Schools & Universities",
  "Healthcare & Medical",
  "Nonprofits & Events",
];

export default function ClientTypesSection() {
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green mb-6">
          Custom Branded Apparel for Businesses, Teams & Organizations
        </h2>
        <p className="text-gray-600 text-lg max-w-3xl mx-auto">
          Whether you need 12 polos for your crew or 500 event shirts for a
          fundraiser, we handle orders of every size with the same attention to
          detail.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {clientTypes.map((type) => (
          <div
            key={type}
            className="bg-sew-cream border border-sew-cream-dark rounded-xl px-5 py-6 text-center hover:border-sew-green hover:bg-sew-green/5 transition-all duration-200"
          >
            <p className="text-sew-slate font-medium text-sm leading-snug">{type}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
