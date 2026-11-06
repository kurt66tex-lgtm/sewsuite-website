import { Link } from 'react-router-dom';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function FAQs() {
  const { settings } = useBusinessSettings();
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
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden" open>
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>What decoration methods does Sew Suite offer?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Sew Suite offers custom embroidery, screen printing, DTF printing, branded apparel, hats and caps, bags and towels, specialty promotional items, and logo/artwork assistance.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>What should I include with a quote request?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Include the project type, approximate quantity, desired completion date, product or garment ideas, decoration needs, and the best logo or artwork files you have. You can upload reference files directly with the quote request.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>Can Sew Suite help if my logo is not production-ready?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Yes. Send the best file you have. Sew Suite can review whether the artwork needs cleanup, vector preparation, embroidery digitizing, resizing, or other adjustments for the selected decoration method.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>Do you work with businesses and corporate apparel?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Yes. Projects can include embroidered polos, jackets, hats, workwear, staff shirts, event apparel, and other branded products for businesses and organizations.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>Do you make school, team, club, and spirit wear?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Yes. Sew Suite can quote apparel and decorated products for schools, teams, clubs, booster groups, staff, and supporters. Customers must have appropriate permission to use protected school, team, sponsor, or organization marks.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>How do I know whether embroidery, screen printing, or DTF is best?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">The best method depends on the artwork, product, fabric, quantity, number of colors, desired appearance, and budget. Send the project details and Sew Suite can review the practical options.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>Can I order hats, bags, towels, or specialty items too?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Yes. Sew Suite handles hats and caps, bags, towels, and other specialty decorated products when the item and decoration method are compatible.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>Do you serve customers outside Allen?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Yes. Sew Suite serves customers throughout North Texas and can ship completed orders nationwide.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>Can I reorder a previous project?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Repeat orders can be easier when prior artwork, product choices, decoration details, and project history are available. Contact Sew Suite with the previous project information and current quantity or changes.</div>
          </details>
          <details className="group border border-slate-200 bg-white rounded-lg overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center justify-between gap-4 px-4 py-3 font-semibold text-slate-900"><span>When should I place an order for an event, season, or deadline?</span><span aria-hidden="true" className="text-slate-500 text-xl">+</span></summary>
            <div className="px-4 pb-4 text-slate-600 text-sm leading-relaxed">Send the request as early as possible. Timing depends on product availability, artwork readiness, proof approval, quantity, decoration method, and production workload. Include the required in-hand date with the quote request.</div>
          </details>
        </div>
        <div className="mt-10 text-center">
          <p className="text-slate-600">Still have questions?</p>
          <Link to="/book-service" className="mt-3 inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent">{isCustomApparel ? 'Request a Quote' : 'Book Service'}</Link>
        </div>
      </section>
    </div>
  );
}