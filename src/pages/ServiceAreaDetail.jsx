import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MapPin, Phone, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import ServiceIcon from '@/components/site/ServiceIcon';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import PortfolioSection from '@/components/site/PortfolioSection';

export default function ServiceAreaDetail() {
  const { slug } = useParams();
  const { settings } = useBusinessSettings();
  const [area, setArea] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const phone = settings?.phone || '';
  const businessName = settings?.business_name || 'Service Business';
  const regionLabel = settings?.service_region_label || '';
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const servicesBasePath = isApplianceModule ? '/appliance-repair' : '/services';

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceArea.filter({ slug, active: true }),
      base44.entities.ServiceType.filter({ publicly_advertised: true }, 'display_order', 20)
    ]).then(([areas, serviceList]) => {
      setArea(areas[0] || null);
      setServices(serviceList || []);
    }).catch(() => {
      setArea(null);
      setServices([]);
    }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!area) return;
    const baseUrl = (settings?.website_url || window.location.origin).replace(/\/$/, '');
    const canonicalUrl = `${baseUrl}/service-areas/${area.slug}`;
    const serviceLabel = isCustomApparel ? 'Custom Embroidery & Apparel' : isApplianceModule ? 'Appliance Repair' : isPlumbingModule ? 'Plumber' : 'Service';
    const serviceDescription = isCustomApparel ? 'custom embroidery, screen printing and branded apparel' : isApplianceModule ? 'appliance repair' : isPlumbingModule ? 'residential plumbing service' : 'professional service';
    const title = area.seo_title || `${serviceLabel} in ${area.city}, TX | ${businessName}`;
    const description = area.meta_description || `${businessName} provides ${serviceDescription} in ${area.city}, TX.`;
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
    setMeta('meta[name="robots"]', 'content', window.location.hostname.includes('base44.app') ? 'noindex, nofollow' : (area.indexable === false ? 'noindex, follow' : 'index, follow'));
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
        { '@type': 'ListItem', position: 2, name: 'Service Areas', item: `${baseUrl}/service-areas` },
        { '@type': 'ListItem', position: 3, name: area.city, item: canonicalUrl }
      ]
    };
    const areaService = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: isCustomApparel ? `Custom Embroidery & Apparel in ${area.city}, TX` : isPlumbingModule ? `Plumbing Service in ${area.city}, TX` : isApplianceModule ? `Appliance Repair in ${area.city}, TX` : `Service in ${area.city}, TX`,
      serviceType: isCustomApparel ? 'Custom Apparel Decoration' : isPlumbingModule ? 'Residential Plumbing' : isApplianceModule ? 'Appliance Repair' : 'Professional Service',
      provider: {
        '@type': isCustomApparel ? 'LocalBusiness' : isPlumbingModule ? 'Plumber' : 'HomeAndConstructionBusiness',
        name: businessName,
        ...(settings?.phone ? { telephone: settings.phone } : {}),
        ...(settings?.website_url ? { url: settings.website_url } : {})
      },
      areaServed: {
        '@type': 'City',
        name: `${area.city}, TX`
      },
      description
    };
    const faqSchema = area.faqs?.length ? {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: area.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer }
      }))
    } : null;
    [breadcrumb, areaService, faqSchema].filter(Boolean).forEach(data => {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(data);
      s.setAttribute('data-page-seo', 'true');
      document.head.appendChild(s);
      scripts.push(s);
    });
    return () => scripts.forEach(s => document.head.removeChild(s));
  }, [area, settings, businessName, isApplianceModule, isPlumbingModule, isCustomApparel]);

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">Loading…</div>;
  if (!area) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Service area not found</h1>
      <Link to="/service-areas" className="mt-4 inline-block text-brand-accent font-semibold">← All service areas</Link>
    </div>
  );

  const intro = area.local_intro || area.page_content || `${businessName} provides ${isCustomApparel ? 'custom embroidery and branded apparel' : isApplianceModule ? 'appliance repair' : isPlumbingModule ? 'residential plumbing service' : 'professional service'} throughout ${area.city}, TX.`;
  const ctaText = area.local_cta_text || (isCustomApparel ? `Tell us about your ${area.city} apparel project, quantity, timing, and artwork so we can review it for a quote.` : isApplianceModule ? `Tell us what your appliance is doing and we'll review the details before scheduling your ${area.city} service call.` : isPlumbingModule ? `Tell us what plumbing problem you are dealing with and share useful details or photos before scheduling your ${area.city} service call.` : `Tell us what service you need and share useful details before scheduling your ${area.city} service call.`);

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3">
            <Link to="/" className="hover:text-brand-dark">Home</Link> / <Link to="/service-areas" className="hover:text-brand-dark">Service Areas</Link> / {area.city}
          </nav>
          <div className="flex items-center gap-2 text-brand-accent mb-2">
            <MapPin className="w-5 h-5" />
            <span className="text-sm font-semibold">{area.region_label || regionLabel || area.city}</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">{isCustomApparel ? 'Custom Embroidery & Apparel' : isApplianceModule ? 'Appliance Repair' : isPlumbingModule ? 'Plumber' : 'Service'} in {area.city}, TX</h1>
          <p className="mt-3 text-lg text-slate-600 max-w-3xl">
            {area.hero_subtitle || (isApplianceModule ? `Prepared, straightforward appliance repair for homes across ${area.city}.` : isPlumbingModule ? `Licensed residential plumbing for homeowners across ${area.city}.` : `Professional service for customers across ${area.city}.`)}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent">
              <Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : `Book Service in ${area.city}`}
            </Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 text-slate-900 font-semibold px-5 py-2.5 rounded-lg border border-slate-300">
              <Phone className="w-4 h-4" /> {phone}
            </a>}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-8 items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{isCustomApparel ? `Apparel projects for ${area.city} businesses and groups` : area.local_heading || (isApplianceModule ? `Appliance repair across ${area.city}` : isPlumbingModule ? `Plumbing service across ${area.city}` : `Service across ${area.city}`)}</h2>
            <p className="mt-4 text-slate-700 text-lg leading-relaxed">{intro}</p>
            {area.local_service_context && (
              <p className="mt-4 text-slate-700 leading-relaxed">{area.local_service_context}</p>
            )}
          </div>

          <div className="bg-brand-light rounded-xl p-5">
            <div className="font-bold text-slate-900 mb-3">What to expect from {businessName}</div>
            <div className="space-y-3 text-sm text-slate-700">
              <div className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" /><span>{isCustomApparel ? 'We review artwork, products, quantity, decoration method, and timing before quoting.' : isApplianceModule ? 'We review appliance details before dispatch.' : 'We review service details before the visit.'}</span></div>
              <div className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" /><span>{isCustomApparel ? 'Artwork, proof, approval, production, pickup or shipping details stay connected to the project.' : 'Job details and relevant information stay connected to the service workflow.'}</span></div>
              <div className="flex gap-2"><CheckCircle2 className="w-5 h-5 text-brand-accent flex-shrink-0" /><span>{isCustomApparel ? 'We explain decoration options, artwork needs, quote details, and next steps clearly.' : 'We explain the assessment, options, and next steps clearly.'}</span></div>
            </div>
          </div>
        </div>

        {area.local_highlights?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{area.local_highlights_heading || (isApplianceModule ? `Appliance repair considerations in ${area.city}` : isCustomApparel ? `Custom apparel ideas for ${area.city}` : `Service considerations in ${area.city}`)}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {area.local_highlights.map((item, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-5">
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isApplianceModule && area.local_appliance_context?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">How we prepare for common appliance calls in {area.city}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {area.local_appliance_context.map((item, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-5">
                  <h3 className="font-bold text-slate-900">{item.appliance}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {area.neighborhoods?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Areas we commonly serve around {area.city}</h2>
            <p className="mt-2 text-sm text-slate-500">These are general service areas, not separate business locations.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {area.neighborhoods.map(n => <span key={n} className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1.5">{n}</span>)}
            </div>
          </div>
        )}

        <div>
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{isCustomApparel ? 'Custom apparel services' : isApplianceModule ? 'Appliance repairs' : isPlumbingModule ? 'Plumbing services' : 'Services'} available in {area.city}</h2>
              <p className="mt-1 text-sm text-slate-500">{isCustomApparel ? 'Choose a service to explore project options, artwork considerations, and what to include with your quote request.' : 'Choose a service to see common symptoms, causes and what we check.'}</p>
            </div>
            <Link to={servicesBasePath} className="text-sm font-semibold text-slate-700 hover:text-brand-dark">View all services →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(service => (
              <Link key={service.id} to={`${servicesBasePath}/${service.slug}`} className="group border border-slate-200 rounded-lg p-5 hover:border-brand-accent hover:shadow-sm transition-all flex flex-col">
                <ServiceIcon service={service} className="w-5 h-5 text-brand-accent mb-2" />
                <div className="font-semibold text-slate-900">{service.name}</div>
                <div className="mt-2 text-sm leading-relaxed text-slate-600 flex-1">{service.short_description}</div>
                <div className="mt-4 text-sm font-bold text-slate-700 group-hover:text-brand-dark inline-flex items-center gap-1">Learn more <ArrowRight className="w-3 h-3" /></div>
              </Link>
            ))}
          </div>
        </div>

        {area.zip_codes?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">ZIP codes we service in {area.city}</h2>
            <div className="flex flex-wrap gap-2">{area.zip_codes.map(z => <span key={z} className="text-sm border border-slate-200 rounded-full px-3 py-1">{z}</span>)}</div>
          </div>
        )}

        {area.faqs?.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{area.city} {isCustomApparel ? 'Custom Apparel' : isApplianceModule ? 'Appliance Repair' : isPlumbingModule ? 'Plumbing' : 'Service'} FAQs</h2>
            <div className="space-y-4">
              {area.faqs.map((f, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-5">
                  <h3 className="font-semibold text-slate-900">{f.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {settings?.portfolio_enabled === true && settings?.portfolio_service_area_pages_enabled === true && <PortfolioSection areaSlug={area.slug} heading={`Recent Work in ${area.city}`} limit={6} />}

        <div className="bg-brand-dark rounded-xl p-8 text-center">
          <h2 className="text-2xl font-black text-white">{isCustomApparel ? 'Need custom apparel' : isApplianceModule ? 'Need appliance repair' : isPlumbingModule ? 'Need a plumber' : 'Need service'} in {area.city}?</h2>
          <p className="text-slate-300 mt-2 max-w-2xl mx-auto">{ctaText}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-bold px-6 py-3 rounded-lg bg-brand-accent">
              <Calendar className="w-5 h-5" /> {isCustomApparel ? 'Request a Quote' : 'Check Service Availability'}
            </Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 border-2 border-brand-accent text-brand-accent font-bold px-6 py-3 rounded-lg">
              <Phone className="w-5 h-5" /> Call {phone}
            </a>}
          </div>
        </div>
      </section>
    </div>
  );
}
