import SectionWrapper from "@/components/ui/SectionWrapper";
import CTAButton from "@/components/ui/CTAButton";

const steps = [
  {
    n: 1,
    title: "Send Us Your Logo",
    body: "Share your artwork file (AI, EPS, PDF, or high-res PNG). Not sure what you have? Send us what you've got and we'll work with it.",
  },
  {
    n: 2,
    title: "Get Your Quote",
    body: "We'll come back with pricing, garment options, and placement recommendations — usually within 24 business hours.",
  },
  {
    n: 3,
    title: "Approve Your Proof",
    body: "Before production begins, you approve a digital proof showing exactly how your finished product will look.",
  },
  {
    n: 4,
    title: "We Produce Your Order",
    body: "Your order goes into production with our in-house team. Standard turnaround is 7-10 business days from approval.",
  },
  {
    n: 5,
    title: "Delivery or Pickup",
    body: "Orders ship directly to you or are available for local pickup in Allen/Lucas TX.",
  },
];

export default function ProcessSteps() {
  return (
    <SectionWrapper bg="green">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-cream mb-4">
          From Logo to Finished Apparel
        </h2>
        <p className="text-sew-cream/70 text-lg max-w-2xl mx-auto">
          Here's how a typical Sew Suite order works.
        </p>
      </div>

      <div className="relative">
        {/* Connector line */}
        <div className="hidden lg:block absolute top-10 left-0 right-0 h-px bg-sew-green-light mx-20" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="relative text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sew-gold text-white font-bold text-lg mb-5 relative z-10 shadow-md mx-auto lg:mx-0">
                {s.n}
              </div>
              <h3 className="text-sew-cream font-semibold text-sm mb-2">{s.title}</h3>
              <p className="text-sew-cream/60 text-xs leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 text-center">
        <CTAButton href="/contact" variant="primary">
          Start Your Order
        </CTAButton>
      </div>
    </SectionWrapper>
  );
}
