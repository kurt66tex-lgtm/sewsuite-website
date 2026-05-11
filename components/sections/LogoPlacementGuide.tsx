import SectionWrapper from "@/components/ui/SectionWrapper";

const placements = [
  {
    name: "Left Chest",
    desc: "The standard. Professional, clean, works on almost every garment. Most popular placement for polos and dress shirts.",
    popular: true,
  },
  {
    name: "Center Chest",
    desc: "Bold and visible. Great for t-shirts, hoodies, and athletic wear where impact matters more than subtlety.",
    popular: false,
  },
  {
    name: "Back Large",
    desc: "Maximum visibility. Perfect for event shirts, volunteer gear, and anything meant to be seen from a distance.",
    popular: false,
  },
  {
    name: "Hat Front",
    desc: "Your logo front and center on structured caps. The most recognized placement in the industry.",
    popular: false,
  },
  {
    name: "Sleeve",
    desc: "Used for secondary branding, department labels, or sponsor logos alongside a main design.",
    popular: false,
  },
  {
    name: "Bag/Tote Side",
    desc: "Brand every touchpoint. Reusable bags with your logo are a walking advertisement.",
    popular: false,
  },
];

export default function LogoPlacementGuide() {
  return (
    <SectionWrapper bg="white">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green mb-4">
          Logo Placement Guide
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Not sure where to put your logo? Here's how most businesses approach it.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {placements.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl border p-6 ${
              p.popular
                ? "border-sew-gold bg-sew-gold/5"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-sew-slate">{p.name}</h3>
              {p.popular && (
                <span className="text-xs font-semibold text-sew-gold bg-sew-gold/10 px-2 py-0.5 rounded-full ml-2 whitespace-nowrap">
                  Most Popular
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-sew-cream border border-sew-cream-dark rounded-xl p-6 text-center max-w-2xl mx-auto">
        <p className="text-sew-slate text-sm leading-relaxed">
          <strong>Not sure what's right for your order?</strong> We'll walk you
          through it. Our team recommends placement based on your garment type,
          logo shape, and intended use.
        </p>
      </div>
    </SectionWrapper>
  );
}
