import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Phone, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function Brands() {
  const { settings, loading: settingsLoading } = useBusinessSettings();
  const [brands, setBrands] = useState([]);
  const businessName = settings?.business_name || 'Service Business';
  const phone = settings?.phone || '';

  useEffect(() => {
    base44.entities.Brand.filter({ active: true }, 'display_order', 100).then(setBrands).catch(() => {});
  }, []);

  if (settingsLoading) return null;
  if (settings?.industry_module !== 'appliance_repair') return <Navigate to="/services" replace />;

  const featured = brands.filter(b => b.featured);
  const others = brands.filter(b => !b.featured);

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / Brands</nav>
          <h1 className="text-4xl font-bold text-slate-900">Brands We Service</h1>
          <p className="mt-3 text-lg text-slate-600">View the appliance brands currently listed as serviced by {businessName}.</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Featured Brands</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map(b => (
            <div key={b.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-slate-900">{b.name}</h3>
              <p className="mt-1 text-sm text-slate-600">{b.description || `${b.name} appliance repair.`}</p>
              {b.appliances_serviced?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">{b.appliances_serviced.map(a => <span key={a} className="text-xs bg-slate-100 rounded px-2 py-0.5">{a}</span>)}</div>
              )}
            </div>
          ))}
        </div>
        {others.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Additional Brands</h2>
            <div className="flex flex-wrap gap-2">
              {others.map(b => <span key={b.id} className="text-sm border border-slate-200 rounded-full px-3 py-1.5">{b.name}</span>)}
            </div>
          </div>
        )}
        <div className="mt-10 bg-brand-dark text-white rounded-xl p-8 text-center">
          <h2 className="text-xl font-bold">Don't see your brand?</h2>
          <p className="mt-1 text-slate-300 text-sm">We service many more. Call us to confirm.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-semibold px-5 py-2.5 rounded-lg"><Calendar className="w-4 h-4" /> Book Service</Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 border border-white/30 font-semibold px-5 py-2.5 rounded-lg"><Phone className="w-4 h-4" /> {phone}</a>}
          </div>
        </div>
      </section>
    </div>
  );
}