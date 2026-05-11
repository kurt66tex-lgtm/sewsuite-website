import CTAButton from "@/components/ui/CTAButton";

export default function StitchInkCTA() {
  return (
    <section className="bg-sew-green-dark py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-sew-cream mb-3">
              Need to Order Online?
            </h2>
            <p className="text-sew-cream/70 text-base max-w-lg leading-relaxed">
              Visit our online storefront at Stitch Ink Studios to browse
              products, upload artwork, and place orders directly — available
              24/7.
            </p>
          </div>
          <div className="flex-shrink-0">
            <CTAButton
              href="https://stitchinkstudios.com"
              variant="primary"
              external
              className="whitespace-nowrap"
            >
              Shop at Stitch Ink Studios ↗
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}
