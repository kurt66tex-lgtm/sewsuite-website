import Image from "next/image";
import CTAButton from "@/components/ui/CTAButton";

export default function HeroSection() {
  return (
    <section className="relative bg-sew-green min-h-[92vh] flex items-center overflow-hidden">
      {/* Background texture overlay */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #FAF7F0 0, #FAF7F0 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <p className="text-sew-gold text-sm font-semibold uppercase tracking-widest mb-5">
              Allen/Lucas, TX · 17+ Years Experience
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-sew-cream leading-tight mb-6">
              Custom Branded Apparel, Built Around Your Logo
            </h1>
            <p className="text-sew-cream/80 text-lg leading-relaxed mb-10 max-w-lg">
              Professional embroidery and decorated apparel for businesses,
              teams, and organizations across North Texas — done right, on time,
              every time.
            </p>
            <div className="flex flex-wrap gap-4">
              <CTAButton href="/contact" variant="primary">
                Get a Free Quote
              </CTAButton>
              <CTAButton href="/gallery" variant="secondary">
                See Our Work
              </CTAButton>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-10 border-t border-sew-green-light">
              <div className="flex items-center gap-2">
                <div className="flex text-sew-gold">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sew-cream/70 text-sm">5.0 · 3 Google Reviews</span>
              </div>
              <div className="h-4 w-px bg-sew-cream/20 hidden sm:block" />
              <span className="text-sew-cream/70 text-sm">10,000+ orders decorated</span>
              <div className="h-4 w-px bg-sew-cream/20 hidden sm:block" />
              <span className="text-sew-cream/70 text-sm">In-house production</span>
            </div>
          </div>

          {/* Hero image */}
          <div className="hidden lg:block relative">
            <div className="relative h-[520px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://media.base44.com/images/public/69e39cd9aef38e2e50456a73/c3df55321_Allen_eagles_applique.jpg"
                alt="Allen Eagles custom embroidered applique — professional embroidery work by Sew Suite"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1280px) 50vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sew-green/30 to-transparent" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-sew-gold text-white px-5 py-3 rounded-xl shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide">17+ Years</p>
              <p className="text-lg font-bold leading-none">Expert Quality</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
