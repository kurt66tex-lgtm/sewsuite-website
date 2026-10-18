import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Calendar, Phone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function PortfolioDetail() {
  const { slug } = useParams();
  const { settings } = useBusinessSettings();
  const [project, setProject] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.PortfolioProject.filter({ slug, is_published: true }),
      base44.entities.PortfolioPhoto.filter({ is_published: true }, 'display_order', 200),
      base44.entities.ServiceType.filter({ active: true, publicly_advertised: true }, 'display_order', 100)
    ]).then(([projects, allPhotos, allServices]) => {
      const p = projects[0] || null;
      setProject(p);
      setPhotos(p ? (allPhotos || []).filter(photo => photo.project_id === p.id) : []);
      setServices(allServices || []);
    }).catch(() => {
      setProject(null);
      setPhotos([]);
      setServices([]);
    }).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    const businessName = settings?.business_name || 'Our Work';
    const baseUrl = (settings?.website_url || window.location.origin).replace(/\/$/, '');
    const canonicalUrl = `${baseUrl}/our-work/${project.slug}`;
    const title = project.seo_title || `${project.title} | ${businessName}`;
    const description = project.meta_description || project.summary || project.description || '';
    const image = project.cover_image_url || settings?.default_social_image_url || null;
    document.title = title;
    const setMeta = (selector, attr, value, tag='meta') => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(tag);
        if (tag === 'meta') {
          if (selector.includes('property=')) el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
          else el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        } else el.setAttribute('rel','canonical');
        document.head.appendChild(el);
      }
      el.setAttribute(attr,value);
    };
    setMeta('meta[name="description"]','content',description);
    setMeta('meta[name="robots"]','content',window.location.hostname.includes('base44.app') ? 'noindex, nofollow' : 'index, follow');
    setMeta('link[rel="canonical"]','href',canonicalUrl,'link');
    setMeta('meta[property="og:title"]','content',title);
    setMeta('meta[property="og:description"]','content',description);
    setMeta('meta[property="og:url"]','content',canonicalUrl);
    setMeta('meta[property="og:type"]','content','article');
    if (image) setMeta('meta[property="og:image"]','content',image);
  }, [project, settings]);

  if (loading) return <div className="p-20 text-center text-slate-500">Loading…</div>;
  if (!project || !settings?.portfolio_enabled || settings?.portfolio_detail_pages_enabled === false) {
    return <div className="p-20 text-center"><h1 className="text-2xl font-bold">Project not found</h1></div>;
  }

  const relatedServices = services.filter(s => (project.service_slugs || []).includes(s.slug));
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const phone = settings?.phone || '';

  return (
    <div>
      <section className="bg-brand-light border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="text-sm text-slate-500 mb-4"><Link to="/our-work" className="hover:text-brand-dark">Our Work</Link> / {project.title}</div>
          <h1 className="text-4xl font-black text-slate-900">{project.title}</h1>
          <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500">
            {project.category && <span>{project.category}</span>}
            {project.location_label && <span>• {project.location_label}</span>}
            {project.completed_date && <span>• {project.completed_date}</span>}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {project.cover_image_url && <img src={project.cover_image_url} alt={project.cover_alt_text || project.title} className="w-full max-h-[680px] object-cover rounded-xl" />}

        <div className="grid lg:grid-cols-[1fr_300px] gap-10 mt-8">
          <div>
            {project.summary && <p className="text-xl text-slate-700 leading-relaxed">{project.summary}</p>}
            {project.description && <p className="mt-5 text-slate-700 whitespace-pre-wrap leading-relaxed">{project.description}</p>}
            {project.show_customer_name && project.customer_display_name && <p className="mt-4 text-sm text-slate-500">Project for {project.customer_display_name}</p>}
          </div>
          {relatedServices.length > 0 && (
            <aside className="border border-slate-200 rounded-xl p-5 h-fit">
              <h2 className="font-bold text-slate-900">Related Services</h2>
              <div className="mt-3 space-y-2">
                {relatedServices.map(service => (
                  <Link key={service.id} to={`/services/${service.slug}`} className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-700 hover:text-brand-dark">
                    {service.name}<ArrowRight className="w-4 h-4 text-brand-accent" />
                  </Link>
                ))}
              </div>
            </aside>
          )}
        </div>

        {photos.length > 0 && <div className="grid sm:grid-cols-2 gap-5 mt-10">{photos.map(photo => <figure key={photo.id}><img src={photo.image_url} alt={photo.alt_text || project.title} className="w-full rounded-xl object-cover"/>{photo.caption && <figcaption className="text-sm text-slate-500 mt-2">{photo.caption}</figcaption>}</figure>)}</div>}

        <section className="bg-brand-dark rounded-xl p-8 text-center mt-12">
          <h2 className="text-2xl font-black text-white">{isCustomApparel ? 'Have a project like this in mind?' : 'Interested in a similar project?'}</h2>
          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">{isCustomApparel ? 'Tell us what you want to create, the approximate quantity, timing, and what artwork you have. We’ll review the details and follow up about the quote.' : 'Tell us about your project and we’ll follow up about the next steps.'}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-bold px-6 py-3 rounded-lg bg-brand-accent"><Calendar className="w-5 h-5" />{isCustomApparel ? 'Request a Quote' : 'Request Service'}</Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g,'')}`} className="inline-flex items-center gap-2 border-2 border-brand-accent text-brand-accent font-bold px-6 py-3 rounded-lg hover:bg-brand-accent hover:text-brand-dark transition-colors"><Phone className="w-5 h-5" />Call {phone}</a>}
          </div>
        </section>
      </div>
    </div>
  );
}
