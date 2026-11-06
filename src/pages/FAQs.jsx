import { Link } from 'react-router-dom';
import liveFaqs from '@/data/current-base44-public-faqs.json';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function FAQs() {
  const { settings } = useBusinessSettings();
  // Render the published FAQs directly; no client-side initialization is needed.
  const faqs = liveFaqs.filter(f => f.active === true).sort((a, b) => a.display_order - b.display_order);
  const primary = settings?.primary_brand_color || '#FF6A00';
  const businessName = settings?.business_name || 'Service Business';
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');


  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / FAQs</nav>
          <h1 className="text-4xl font-bold text-slate-900">Frequently Asked Questions</h1>
          <p className="mt-3 text-lg text-slate-600">{isCustomApparel ? `Answers to common questions about custom apparel, artwork, embroidery, printing, quotes, proofs, and ordering with ${businessName}.` : isApplianceModule ? `Answers to common questions about appliance repair with ${businessName}.` : `Answers to common questions about service, scheduling, estimates, and what to expect from ${businessName}.`}</p>
        </div>
      </section>
      <section className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <details key={f.id || i} className="group border border-slate-200 bg-white rounded-lg overflow-hidden" open={i === 0}>
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900">
                <span>{f.question}</span>
                <span aria-hidden="true" className="text-slate-500 text-xl leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">{f.answer}</div>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-slate-600">Still have questions?</p>
          <Link to="/book-service" className="mt-3 inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent">{isCustomApparel ? 'Request a Quote' : 'Book Service'}</Link>
        </div>
      </section>
    </div>
  );
}