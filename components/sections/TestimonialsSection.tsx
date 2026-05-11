import SectionWrapper from "@/components/ui/SectionWrapper";
import type { SewSuiteTestimonial } from "@/types";

const fallbackTestimonials: SewSuiteTestimonial[] = [
  {
    id: "1",
    name: "Marcus T.",
    company: "Allen Eagles Booster Club",
    quote:
      "Sew Suite handled our entire booster club order — over 200 pieces — without a single issue. The embroidery quality on the jackets was exceptional. We've been going back for three years.",
    rating: 5,
    approved: true,
    sort_order: 0,
  },
  {
    id: "2",
    name: "Sarah K.",
    company: "GreenTech Renewables",
    quote:
      "We needed branded bags and polos for a trade show with a tight deadline. Sew Suite delivered early and the quality was exactly what we needed. Our team looked professional and we got compliments all weekend.",
    rating: 5,
    approved: true,
    sort_order: 1,
  },
  {
    id: "3",
    name: "James R.",
    company: "Tommy Terrific's Car Wash",
    quote:
      "I've ordered from a lot of places online and nothing compares. Sew Suite actually took the time to make our logo look right on a visor — something I could never get right through a print-on-demand site.",
    rating: 5,
    approved: true,
    sort_order: 2,
  },
];

interface Props {
  testimonials?: SewSuiteTestimonial[];
}

export default function TestimonialsSection({ testimonials = fallbackTestimonials }: Props) {
  const items = testimonials.length > 0 ? testimonials : fallbackTestimonials;

  return (
    <SectionWrapper bg="cream">
      <div className="text-center mb-14">
        <h2 className="text-3xl sm:text-4xl font-semibold text-sew-green">
          What Our Customers Say
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm flex flex-col"
          >
            <div className="flex mb-5">
              {[...Array(t.rating)].map((_, i) => (
                <svg
                  key={i}
                  className="w-5 h-5 text-sew-gold fill-current"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <blockquote className="text-gray-600 leading-relaxed text-sm flex-1 mb-6">
              "{t.quote}"
            </blockquote>
            <div className="border-t border-gray-100 pt-5">
              <p className="font-semibold text-sew-slate text-sm">{t.name}</p>
              {t.company && (
                <p className="text-gray-400 text-xs mt-0.5">{t.company}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
