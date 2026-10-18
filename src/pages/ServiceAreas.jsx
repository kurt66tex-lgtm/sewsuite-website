import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function ServiceAreas() {
  const { settings } = useBusinessSettings();
  const [areas, setAreas] = useState([]);
  const businessName = settings?.business_name || 'Service Business';
  const regionLabel = settings?.service_region_label || '';
  const phone = settings?.phone || '';
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');

  useEffect(() => {
    base44.entities.ServiceArea.filter({ active: true }, 'display_order', 50).then(setAreas).catch(() => {});
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / Service Areas</nav>
          <h1 className="text-4xl font-bold text-slate-900">{isCustomApparel ? 'North Texas Custom Apparel Service Areas' : isPlumbingModule ? 'Plumbing Service Areas' : 'Service Areas'}</h1>
          <p className="mt-3 text-lg text-slate-600">{isCustomApparel ? `${businessName} works with businesses, schools, teams, organizations, and individuals across North Texas, with shipping available nationwide.` : regionLabel ? `${businessName} serves ${isPlumbingModule ? 'homeowners' : 'customers'} across ${regionLabel}.` : `View the current service areas for ${businessName}.`}</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map(a => (
            <Link key={a.id} to={`/service-areas/${a.slug}`} className="border border-slate-200 rounded-xl p-5 hover:border-brand-accent hover:shadow-md transition-all">
              <div className="flex items-center gap-2 text-brand-accent"><MapPin className="w-5 h-5" /><h2 className="font-semibold text-slate-900">{isCustomApparel ? `Custom Embroidery & Apparel in ${a.city}, TX` : isApplianceModule ? `Appliance Repair in ${a.city}, TX` : isPlumbingModule ? `Plumber in ${a.city}, TX` : `Service in ${a.city}, TX`}</h2></div>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{isCustomApparel ? a.local_intro : a.hero_subtitle || a.local_intro || a.page_content || (isApplianceModule ? `Prepared appliance repair in ${a.city}, TX.` : isPlumbingModule ? `Residential plumbing service in ${a.city}, TX.` : `Professional service in ${a.city}, TX.`)}</p>
              <div className="mt-3 text-sm font-semibold text-brand-dark">View {a.city} page →</div>
            </Link>
          ))}
        </div>
        <div className="mt-10 text-center">
          <p className="text-slate-600">Don't see your city? Give us a call — we may still be able to help.</p>
          {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="mt-3 inline-flex items-center gap-2 text-slate-900 font-semibold px-5 py-2.5 rounded-lg border border-slate-300"><Phone className="w-4 h-4" /> {phone}</a>}
        </div>
      </section>
    </div>
  );
}