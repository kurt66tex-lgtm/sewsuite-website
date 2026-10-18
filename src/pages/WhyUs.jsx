import { Link } from 'react-router-dom';
import { ClipboardCheck, Star, Truck, ShieldCheck, Wrench, Clock, MapPin, CalendarCheck, Phone } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function WhyUs() {
  const { settings } = useBusinessSettings();
  const businessName = settings?.business_name || 'Service Business';
  const phone = settings?.phone || '';
  const regionLabel = settings?.service_region_label || '';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');

  const features = isCustomApparel ? [
    { icon: ClipboardCheck, title: 'Project Details Up Front', text: 'Quantity, timing, product ideas, decoration method, and artwork are reviewed together before production.' },
    { icon: Star, title: 'Artwork & Proof Support', text: 'Logos and graphics can be reviewed for embroidery, screen printing, DTF, and other decorated-product requirements.' },
    { icon: Wrench, title: 'Multiple Decoration Options', text: 'Embroidery, screen printing, DTF, hats, bags, towels, corporate apparel, team wear, and specialty projects can be coordinated in one place.' },
    { icon: CalendarCheck, title: 'Quote-to-Production Workflow', text: 'Quote, artwork, proof when needed, approval, production, quality check, pickup or shipping, and completion stay organized.' },
    { icon: Star, title: 'Built for Repeat Orders', text: 'Approved artwork and prior project details can support more consistent future company, school, team, and organization orders.' },
    { icon: MapPin, title: 'North Texas + Nationwide', text: 'Sew Suite serves North Texas locally and can ship completed orders to customers throughout the United States.' }
  ] : [
    { icon: ClipboardCheck, title: 'Prepared Before Arrival', text: 'We review the service information before dispatch so the technician can arrive prepared.' },
    settings?.first_trip_completion_text ? { icon: Star, title: settings.first_trip_completion_text, text: 'Ask us how preparation and stocked service vehicles support efficient service.' } : null,
    { icon: Wrench, title: 'Professional Service', text: 'Our service process is designed to keep communication clear from intake through completion.' },
    { icon: Truck, title: 'Prepared Service Vehicles', text: 'The team can prepare commonly needed parts, tools, and information before dispatch.' },
    { icon: CalendarCheck, title: 'Clear Estimates', text: 'When applicable, diagnosis and pricing can be reviewed before work begins.' },
    settings?.warranty_text ? { icon: ShieldCheck, title: settings.warranty_text, text: 'Warranty terms are provided by the business for eligible work.' } : null,
    { icon: Star, title: 'Straightforward Recommendations', text: 'Service options should be explained clearly so the customer can make an informed decision.' },
    settings?.hours_mon_fri || settings?.hours_saturday || settings?.hours_sunday ? {
      icon: Clock,
      title: 'Business Hours',
      text: [settings?.hours_mon_fri ? `Mon-Fri: ${settings.hours_mon_fri}` : null, settings?.hours_saturday ? `Sat: ${settings.hours_saturday}` : null, settings?.hours_sunday ? `Sun: ${settings.hours_sunday}` : null].filter(Boolean).join(' · ')
    } : null,
    settings?.family_owned ? { icon: MapPin, title: 'Family-Owned', text: regionLabel ? `Serving ${regionLabel}.` : 'Locally operated and family-owned.' } : (regionLabel ? { icon: MapPin, title: 'Local Service', text: `Serving ${regionLabel}.` } : null)
  ].filter(Boolean);

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / Why Us</nav>
          <h1 className="text-4xl font-bold text-slate-900">Why Choose {businessName}</h1>
          <p className="mt-3 text-lg text-slate-600">{isCustomApparel ? 'Custom apparel projects built around your brand, artwork, product needs, timing, and a clear path from quote to finished order.' : 'A service experience built around preparation, clear communication, and dependable follow-through.'}</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="border border-slate-200 rounded-xl p-5">
              <f.icon className="w-8 h-8 text-brand-accent mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 bg-brand-dark text-white rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold">{isCustomApparel ? 'Have a project in mind?' : `See how ${businessName} can help.`}</h2>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-semibold px-5 py-2.5 rounded-lg"><CalendarCheck className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Request Service'}</Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 border border-white/30 font-semibold px-5 py-2.5 rounded-lg"><Phone className="w-4 h-4" /> {phone}</a>}
          </div>
        </div>
      </section>
    </div>
  );
}
