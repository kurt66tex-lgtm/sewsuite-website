import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Phone } from 'lucide-react';
import ServiceIcon from '@/components/site/ServiceIcon';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

const PLUMBING_CATEGORY_ORDER = ["Emergency & General Plumbing","Drains & Sewers","Leaks & Water Lines","Water Heaters","Fixtures & Toilets","Gas Plumbing"];
const PLUMBING_CATEGORY_INTROS = {"Emergency & General Plumbing":"Urgent plumbing help plus the everyday residential repairs every home eventually needs.","Drains & Sewers":"Drain cleaning, sewer diagnosis, camera inspection, repair and replacement for the path carrying wastewater out of the home.","Leaks & Water Lines":"Leak detection, slab-leak work and water-line repair or replacement for pressurized residential piping.","Water Heaters":"Tank and tankless water-heater repair, service and replacement for reliable hot water.","Fixtures & Toilets":"Faucets, toilets and everyday plumbing fixtures repaired or replaced when they leak, run or stop working correctly.","Gas Plumbing":"Licensed residential gas-line repair and replacement for confirmed piping and appliance-supply issues."};

function ServiceCard({ service, isCustomApparel = false }) {
  return (
    <article className="border border-slate-200 rounded-xl p-5 hover:border-brand-accent/50 hover:shadow-md transition-all bg-white">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
          <ServiceIcon service={service} className="w-5 h-5 text-brand-accent" />
        </div>
        <div>
          {service.category && <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-brand-accent mb-0.5">{service.category}</div>}
          <h3 className="font-semibold text-slate-900">
            <Link to={`/services/${service.slug}`} className="hover:underline">{service.name}</Link>
          </h3>
        </div>
      </div>
      {service.short_description && <p className="text-sm leading-relaxed text-slate-600">{service.short_description}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link to={`/services/${service.slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-accent">
          Learn more <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/book-service" className="text-sm font-semibold text-slate-500 hover:text-brand-dark">{isCustomApparel ? 'Request a Quote' : 'Request Service'}</Link>
      </div>
    </article>
  );
}

export default function Services() {
  const { settings } = useBusinessSettings();
  const [services, setServices] = useState([]);
  const businessName = settings?.business_name || 'Service Business';
  const phone = settings?.phone || '';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');

  useEffect(() => {
    base44.entities.ServiceType
      .filter({ active: true, publicly_advertised: true }, 'display_order', 100)
      .then(setServices)
      .catch(() => setServices([]));
  }, []);

  const plumbingGroups = useMemo(() => {
    const groups = {};
    services.forEach(service => {
      const key = service.category || 'Other Plumbing Services';
      if (!groups[key]) groups[key] = [];
      groups[key].push(service);
    });
    return groups;
  }, [services]);

  return (
    <div>
      <section className={isPlumbingModule ? "bg-white border-b border-slate-200" : "bg-gradient-to-b from-slate-50 to-white border-b border-slate-100"}>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-accent">Home</Link> / Services</nav>
          <h1 className="text-4xl font-black text-brand-dark">{isCustomApparel ? 'Custom Apparel & Decoration Services' : isPlumbingModule ? 'Our Plumbing Services' : 'Services'}</h1>
          <p className="mt-3 text-lg max-w-3xl text-slate-600">
            {isPlumbingModule
              ? `Licensed residential plumbing from ${businessName}, serving ${settings?.service_region_label || "the local service area"}. Browse by plumbing system below or send a request if you are not sure which category fits the problem.`
              : isCustomApparel ? `Explore embroidery, screen printing, DTF printing, corporate apparel, team and school apparel, hats, bags, towels, specialty items, and artwork support from ${businessName}.` : `Explore the services currently offered by ${businessName}. Select a service for more information or send a request so the team can review the details.`}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-white font-semibold px-5 py-2.5 rounded-lg bg-brand-accent"><Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Request Service'}</Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg border border-slate-300"><Phone className="w-4 h-4" /> {phone}</a>}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        {services.length > 0 ? (
          isPlumbingModule ? (
            <div className="space-y-14">
              {PLUMBING_CATEGORY_ORDER.map(category => {
                const items = plumbingGroups[category] || [];
                if (!items.length) return null;
                return (
                  <section key={category}>
                    <div className="border-b border-slate-200 pb-3">
                      <h2 className="font-heading text-2xl font-bold text-brand-dark">{category}</h2>
                    </div>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{PLUMBING_CATEGORY_INTROS[category]}</p>
                    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {items.map(service => <ServiceCard key={service.id} service={service} />)}
                    </div>
                  </section>
                );
              })}
              {Object.entries(plumbingGroups)
                .filter(([category]) => !PLUMBING_CATEGORY_ORDER.includes(category))
                .map(([category, items]) => (
                  <section key={category}>
                    <h2 className="font-heading text-2xl font-bold text-brand-dark border-b border-slate-200 pb-3">{category}</h2>
                    <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {items.map(service => <ServiceCard key={service.id} service={service} />)}
                    </div>
                  </section>
                ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(service => <ServiceCard key={service.id} service={service} isCustomApparel={isCustomApparel} />)}
            </div>
          )
        ) : (
          <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">
            Services have not been configured yet.
          </div>
        )}
      </section>

      <section className="bg-brand-dark text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <h2 className="text-2xl font-bold">{isCustomApparel ? 'Not sure which decoration method fits your project?' : isPlumbingModule ? 'Not sure which plumbing service you need?' : 'Not sure which service you need?'}</h2>
          <p className="mt-2 text-slate-300">{isCustomApparel ? 'Send the project, quantity, timing, and artwork. Sew Suite can help determine whether embroidery, screen printing, DTF, or another option fits.' : isPlumbingModule ? 'Describe what you are seeing, hearing, or smelling and include photos when useful. The team can review the request before scheduling.' : 'Tell us what is happening and the team can review your request.'}</p>
          <Link to="/book-service" className="mt-5 inline-flex items-center gap-2 bg-brand-accent text-white font-semibold px-6 py-3 rounded-lg"><Calendar className="w-5 h-5" /> {isCustomApparel ? 'Request a Quote' : 'Request Service'}</Link>
        </div>
      </section>
    </div>
  );
}
