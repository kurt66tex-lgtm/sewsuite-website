import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, Calendar, ChevronRight, Home as HomeIcon, AlertCircle, CheckCircle, ClipboardCheck, Camera, MapPin } from 'lucide-react';
import ServiceIcon from '@/components/site/ServiceIcon';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import PortfolioSection from '@/components/site/PortfolioSection';

export default function ServiceTypeDetail() {
  const { slug } = useParams();
  const { settings } = useBusinessSettings();
  const [service, setService] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceType.filter({ slug, active: true }),
      base44.entities.ServiceType.filter({ active: true, publicly_advertised: true }, 'display_order', 100)
    ])
      .then(([list, services]) => {
        setService(list[0] || null);
        setAllServices(services || []);
      })
      .catch(() => {
        setService(null);
        setAllServices([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!service) return;
    const baseUrl = (settings?.website_url || window.location.origin).replace(/\/$/, '');
    const isApplianceModule = settings?.industry_module === 'appliance_repair';
    const isPlumbingModule = settings?.industry_module === 'plumbing';
    const servicesBasePath = isApplianceModule ? '/appliance-repair' : '/services';
    const servicesLabel = isApplianceModule ? 'Appliance Repair' : isPlumbingModule ? 'Plumbing Services' : 'Services';
    const canonicalUrl = `${baseUrl}${servicesBasePath}/${service.slug}`;
    const businessName = settings?.business_name || 'Service Business';
    const regionLabel = settings?.service_region_label || '';
    const title = service.seo_title || `${service.name}${regionLabel ? ` in ${regionLabel}` : ''} | ${businessName}`;
    const description = service.meta_description || service.short_description || '';
    const socialImage = settings?.default_social_image_url || settings?.hero_image_url || null;

    document.title = title;
    const setMeta = (selector, attr, content, tag = 'meta') => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(tag);
        if (tag === 'meta') {
          if (selector.includes('property=')) el.setAttribute('property', selector.match(/property=\"([^\"]+)\"/)?.[1] || '');
          else el.setAttribute('name', selector.match(/name=\"([^\"]+)\"/)?.[1] || '');
        } else if (tag === 'link') {
          el.setAttribute('rel', 'canonical');
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', window.location.hostname.includes('base44.app') ? 'noindex, nofollow' : (service.indexable !== false && service.publicly_advertised !== false ? 'index, follow' : 'noindex, follow'));
    setMeta('link[rel="canonical"]', 'href', canonicalUrl, 'link');
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:type"]', 'content', 'website');
    setMeta('meta[property="og:site_name"]', 'content', businessName);
    if (socialImage) setMeta('meta[property="og:image"]', 'content', socialImage);
    setMeta('meta[name="twitter:card"]', 'content', socialImage ? 'summary_large_image' : 'summary');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    if (socialImage) setMeta('meta[name="twitter:image"]', 'content', socialImage);

    const scripts = [];
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: servicesLabel, item: `${baseUrl}${servicesBasePath}` },
        { '@type': 'ListItem', position: 3, name: service.name, item: canonicalUrl }
      ]
    };
    const serviceSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      serviceType: service.name,
      provider: {
        '@type': settings?.industry_module === 'custom' ? 'LocalBusiness' : isPlumbingModule ? 'Plumber' : 'HomeAndConstructionBusiness',
        name: businessName,
        ...(settings?.phone ? { telephone: settings.phone } : {}),
        ...(settings?.website_url ? { url: settings.website_url } : {})
      },
      ...(regionLabel ? { areaServed: regionLabel } : {}),
      description
    };
    const faqSchema = service.faqs?.length ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: service.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    } : null;
    [breadcrumb, serviceSchema, faqSchema].filter(Boolean).forEach(data => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(data);
      s.setAttribute('data-page-seo', 'true');
      document.head.appendChild(s);
      scripts.push(s);
    });
    return () => scripts.forEach(s => document.head.removeChild(s));
  }, [service, settings]);

  const phone = settings?.phone || '';
  const regionLabel = settings?.service_region_label || '';
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const isProjectQuote = settings?.business_model === 'project_quote';
  const servicesBasePath = isApplianceModule ? '/appliance-repair' : '/services';
  const servicesLabel = isApplianceModule ? 'Appliance Repair' : isPlumbingModule ? 'Plumbing Services' : 'Services';
  const relatedServices = service ? allServices
    .filter(s => s.id !== service.id && s.category === service.category)
    .slice(0, 4) : [];

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">Loading…</div>;
  if (!service) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-slate-900">Service Not Found</h1>
      <Link to={servicesBasePath} className="inline-flex items-center gap-2 mt-4 text-brand-dark font-semibold">← Back to all services</Link>
    </div>
  );

  return (
    <div>
      <div className="bg-brand-light border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-brand-dark flex items-center gap-1"><HomeIcon className="w-3 h-3" /> Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={servicesBasePath} className="hover:text-brand-dark">{servicesLabel}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-dark font-medium">{service.name}</span>
        </div>
      </div>

      <section className="bg-brand-dark py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-lg bg-brand-accent flex items-center justify-center">
              <ServiceIcon service={service} className="w-6 h-6 text-brand-dark" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white">{isProjectQuote ? service.name : <>{service.name}{regionLabel ? ` in ${regionLabel}` : ''}</>}</h1>
          </div>
          <p className="text-slate-300 text-lg max-w-3xl">{service.short_description}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-bold px-6 py-3 rounded-lg bg-brand-accent">
              <Calendar className="w-5 h-5" /> {isCustomApparel ? 'Request a Quote' : `Book ${service.name}`}
            </Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 border-2 border-brand-accent text-brand-accent font-bold px-6 py-3 rounded-lg hover:bg-brand-accent hover:text-brand-dark transition-colors">
              <Phone className="w-5 h-5" /> {phone}
            </a>}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {(service.service_intro || service.page_content) && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-3">{isCustomApparel ? 'A better project starts with the right details' : 'A better-prepared service call starts before we arrive'}</h2>
            <p className="text-lg leading-relaxed text-slate-700">{service.service_intro || service.page_content}</p>
          </section>
        )}

        {(service.what_we_check?.length > 0 || service.before_we_arrive?.length > 0) && (
          <section className="grid md:grid-cols-2 gap-5">
            {service.what_we_check?.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3"><ClipboardCheck className="w-5 h-5 text-brand-accent" /><h2 className="text-xl font-bold text-slate-900">{isCustomApparel ? 'What we review for your project' : 'What we check'}</h2></div>
                <div className="space-y-2">
                  {service.what_we_check.map((item, i) => <div key={i} className="flex gap-2 text-sm text-slate-700"><CheckCircle className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" />{item}</div>)}
                </div>
              </div>
            )}
            {service.before_we_arrive?.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3"><Camera className="w-5 h-5 text-brand-accent" /><h2 className="text-xl font-bold text-slate-900">{isCustomApparel ? 'Helpful details before we quote' : 'Helpful details before the visit'}</h2></div>
                <div className="space-y-2">
                  {service.before_we_arrive.map((item, i) => <div key={i} className="flex gap-2 text-sm text-slate-700"><CheckCircle className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" />{item}</div>)}
                </div>
              </div>
            )}
          </section>
        )}

        {service.common_symptoms?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">{isCustomApparel ? `${service.name} project considerations` : `Common ${service.name} Problems We Fix`}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {service.common_symptoms.map((symptom, i) => (
                <div key={i} className="flex items-start gap-2 bg-brand-light rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{symptom}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {service.repair_considerations && (
          <section className="bg-slate-50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-slate-900">{isCustomApparel ? 'What Goes Into Your Custom Order?' : isPlumbingModule ? 'What affects the repair or replacement decision?' : 'What affects the repair decision?'}</h2>
            <p className="mt-3 text-slate-700 leading-relaxed">{service.repair_considerations}</p>
            {service.helpful_tip && <p className="mt-4 text-sm font-medium text-slate-800 border-l-4 border-brand-accent pl-4">{service.helpful_tip}</p>}
          </section>
        )}

        {service.common_causes?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Common Causes</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {service.common_causes.map((cause, i) => (
                <div key={i} className="flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{cause}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {service.faqs?.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">{service.name} FAQs</h2>
            <div className="space-y-3">
              {service.faqs.map((faq, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-5">
                  <h3 className="font-semibold text-brand-dark">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {relatedServices.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-brand-dark mb-4">Related {isPlumbingModule ? 'Plumbing ' : ''}Services</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {relatedServices.map(related => (
                <Link key={related.id} to={`${servicesBasePath}/${related.slug}`} className="group border border-slate-200 rounded-lg p-4 hover:border-brand-accent hover:shadow-sm transition-all">
                  <ServiceIcon service={related} className="w-5 h-5 text-brand-accent mb-2" />
                  <div className="font-semibold text-slate-900">{related.name}</div>
                  <div className="mt-1 text-xs text-slate-500 line-clamp-2">{related.short_description}</div>
                  <div className="mt-3 text-xs font-bold text-brand-accent inline-flex items-center gap-1">View service <ChevronRight className="w-3 h-3" /></div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {settings?.portfolio_enabled === true && settings?.portfolio_service_pages_enabled !== false && <PortfolioSection serviceSlug={service.slug} heading={`${service.name} Projects`} limit={6} />}

        <section className="border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold"><MapPin className="w-5 h-5 text-brand-accent" /> {isCustomApparel ? (regionLabel ? `Custom apparel for ${regionLabel}` : 'Custom apparel across our service area') : (regionLabel ? `Serving communities across ${regionLabel}` : 'Serving configured service areas')}</div>
            <p className="mt-1 text-sm text-slate-500">{isCustomApparel ? 'Explore the North Texas communities we serve locally, with shipping available nationwide.' : 'See the cities and ZIP codes currently listed in our service area.'}</p>
          </div>
          <Link to="/service-areas" className="text-sm font-bold text-slate-800 hover:text-brand-dark">View Service Areas →</Link>
        </section>

        <div className="bg-brand-dark rounded-xl p-8 text-center">
          <h2 className="text-2xl font-black text-white">Need {service.name}?</h2>
          <p className="text-slate-400 mt-2">{isCustomApparel ? 'Share your project, approximate quantity, timing, artwork, and product ideas. We will review the details before quoting.' : isApplianceModule ? 'Tell us what is happening and include the model number if you have it. We will review the details before dispatch.' : 'Tell us what you need help with and share any useful details or photos. We will review the information before the visit.'}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-bold px-6 py-3 rounded-lg bg-brand-accent">
              <Calendar className="w-5 h-5" /> {isCustomApparel ? 'Request a Quote' : 'Book Service'}
            </Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 border-2 border-brand-accent text-brand-accent font-bold px-6 py-3 rounded-lg hover:bg-brand-accent hover:text-brand-dark transition-colors">
              <Phone className="w-5 h-5" /> Call {phone}
            </a>}
          </div>
        </div>
      </div>
    </div>
  );
}
