import { Link } from 'react-router-dom';
import { Phone, Clock, MapPin, Calendar, ShieldCheck, Star, Truck, ClipboardCheck } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function About() {
  const { settings } = useBusinessSettings();
  const businessName = settings?.business_name || 'Service Business';
  const regionLabel = settings?.service_region_label || '';
  const phone = settings?.phone || '';
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / About</nav>
          <h1 className="text-4xl font-bold text-slate-900">About {businessName}</h1>
          {settings?.primary_message && <p className="mt-3 text-lg text-slate-600">{settings.primary_message}</p>}
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-12">
        {settings?.about_image_url && (
          <img
            src={settings.about_image_url}
            alt={`${businessName} team`}
            className="mb-8 aspect-[16/9] w-full rounded-xl border border-slate-200 object-cover"
          />
        )}
        <div className="prose prose-slate max-w-none text-slate-700">
          <p>{settings?.about_copy || (isCustomApparel ? `${businessName} creates custom branded apparel and decorated products for businesses, schools, teams, organizations, and individuals. From embroidery and screen printing to DTF, hats, bags, towels, corporate apparel, team wear, and specialty projects, the goal is to match the decoration method and product to the way the customer will actually use it.` : `${businessName} provides ${isApplianceModule ? 'appliance repair' : 'professional service'}${regionLabel ? ` in ${regionLabel}` : ``}.`)}</p>
          <p>{isCustomApparel ? 'Customers can start with a quote request that includes the project type, approximate quantity, desired completion date, artwork status, fulfillment preference, and logo or reference files. Sew Suite can then review the artwork, products, decoration method, proof requirements, and production plan before the order moves forward.' : isPlumbingModule ? 'Customers can share the plumbing problem, service address, intake details, and photos before scheduling so the team has better information before the visit.' : (isApplianceModule ? 'Service requests can collect appliance details, symptoms, model information, and photos before dispatch so the team has better information before the visit.' : 'Service requests can collect useful project details before work begins.')}</p>
          {isPlumbingModule && settings?.established_year && <p>Serving the area since {settings.established_year}, with the business credentials and trust information shown here sourced from the client profile rather than hard-coded page claims.</p>}
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ...(isPlumbingModule && Array.isArray(settings?.credentials) ? settings.credentials.map(credential => ({ icon: ShieldCheck, title: credential, text: 'Verified credential provided by the business.' })) : []),
            { icon: ClipboardCheck, title: isCustomApparel ? 'Project Intake' : 'Pre-Visit Information', text: isCustomApparel ? 'We review project type, quantity, timing, artwork, and product details before quoting.' : isPlumbingModule ? 'We review plumbing issue details and photos before the visit when available.' : (isApplianceModule ? 'We review appliance information before dispatch when available.' : 'We review service and project information before the visit when available.') },
            { icon: Truck, title: isCustomApparel ? 'Production Planning' : 'Service Preparation', text: isCustomApparel ? 'Artwork, proof, approval, production, pickup or shipping, and completion details stay organized.' : 'The service workflow keeps job details organized before the visit.' },
            { icon: Star, title: isCustomApparel ? 'Decoration Options' : isApplianceModule ? 'Clear Repair Options' : 'Clear Service Options', text: isCustomApparel ? 'Embroidery, screen printing, DTF, and product choices can be matched to the project.' : 'Assessment, estimate, and next steps can be documented for the customer.' },
            ...(settings?.warranty_text ? [{ icon: ShieldCheck, title: settings.warranty_text, text: 'Warranty information provided by the business.' }] : []),
            ...((settings?.hours_mon_fri || settings?.hours_saturday || settings?.hours_sunday) ? [{ icon: Clock, title: 'Business Hours', text: [settings?.hours_mon_fri && `Mon-Fri: ${settings.hours_mon_fri}`, settings?.hours_saturday && `Sat: ${settings.hours_saturday}`, settings?.hours_sunday && `Sun: ${settings.hours_sunday}`].filter(Boolean).join(' · ') }] : []),
            ...(regionLabel ? [{ icon: MapPin, title: 'Service Area', text: `Serving ${regionLabel}.` }] : [])
          ].map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-5">
              <f.icon className="w-7 h-7 text-brand-accent mb-2" />
              <h3 className="font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-brand-dark text-white rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold">{isCustomApparel ? 'Ready to start your project?' : isApplianceModule ? 'Ready to get your appliance fixed?' : 'Ready to request service?'}</h2>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-semibold px-5 py-2.5 rounded-lg"><Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Book Service'}</Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 border border-white/30 font-semibold px-5 py-2.5 rounded-lg"><Phone className="w-4 h-4" /> {phone}</a>}
          </div>
        </div>
      </section>
    </div>
  );
}