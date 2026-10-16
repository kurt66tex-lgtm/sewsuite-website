import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Wrench, Phone, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function ApplianceRepair() {
  const { settings, loading: settingsLoading } = useBusinessSettings();
  const [services, setServices] = useState([]);
  const phone = settings?.phone || '';
  const businessName = settings?.business_name || 'Service Business';

  useEffect(() => {
    base44.entities.ServiceType.filter({ publicly_advertised: true }, 'display_order', 50).then(setServices).catch(() => {});
  }, []);

  if (settingsLoading) return null;
  if (settings?.industry_module !== 'appliance_repair') return <Navigate to="/services" replace />;

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / Appliance Repair</nav>
          <h1 className="text-4xl font-bold text-slate-900">Appliance Repair</h1>
          <p className="mt-3 text-lg text-slate-600 max-w-3xl">
            {businessName} provides appliance repair for the services and brands listed on this site. We review service details before dispatch so the technician can arrive better prepared.{settings?.first_trip_completion_text ? ` ${settings.first_trip_completion_text}.` : ''}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent"><Calendar className="w-4 h-4" /> Book Service</Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 text-slate-900 font-semibold px-5 py-2.5 rounded-lg border border-slate-300"><Phone className="w-4 h-4" /> {phone}</a>}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => (
            <div key={s.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center"><Wrench className="w-5 h-5 text-brand-accent" /></div>
                <h2 className="font-semibold text-slate-900">
                  <Link to={`/appliance-repair/${s.slug}`} className="hover:underline">{s.name}</Link>
                </h2>
              </div>
              <p className="text-sm text-slate-600">{s.short_description}</p>
              {s.common_symptoms?.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-semibold text-slate-700 mb-1">Common symptoms:</div>
                  <ul className="text-xs text-slate-600 space-y-0.5">
                    {s.common_symptoms.slice(0, 5).map((sym, i) => <li key={i} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-brand-accent mt-0.5 flex-shrink-0" /> {sym}</li>)}
                  </ul>
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link to={`/appliance-repair/${s.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-dark">
                  View {s.name} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/book-service" className="text-sm font-semibold text-slate-500 hover:text-brand-dark">
                  Book Service
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-dark text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <h2 className="text-2xl font-bold">Not sure what's wrong? Tell us the symptoms.</h2>
          <p className="mt-2 text-slate-300">We'll review the information before your appointment so the technician arrives prepared.</p>
          <Link to="/book-service" className="mt-5 inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-semibold px-6 py-3 rounded-lg"><Calendar className="w-5 h-5" /> Book Service</Link>
        </div>
      </section>
    </div>
  );
}