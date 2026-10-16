import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Phone, Menu, X, Calendar, Shield, Facebook, Instagram, Linkedin, Youtube, Twitter, Music2 } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { base44 } from '@/api/base44Client';
import ChatWidget from './ChatWidget';
import VoiceCallWidget from './VoiceCallWidget';
import { isAgencyOwner } from '@/lib/accessControl';

const STATIC_SEO = {
  '/': {
    label: null,
    description: 'Professional service information, scheduling, and support.',
  },
  '/services': {
    label: 'Services',
    description: 'View available services and request service.',
  },
  '/appliance-repair': {
    label: 'Appliance Repair Services',
    description: 'View available appliance repair services and request service.',
  },
  '/service-areas': {
    label: 'Service Areas',
    description: 'See the communities currently served by this business.',
  },
  '/our-work': {
    label: 'Our Work',
    description: 'Explore selected completed projects and examples of our work.',
  },
  '/brands': {
    label: 'Brands We Service',
    description: 'View appliance brands currently serviced by this business.',
  },
  '/reviews': {
    label: 'Customer Reviews',
    description: 'Read approved customer reviews and feedback.',
  },
  '/about': {
    label: 'About',
    description: 'Learn more about this business and its service approach.',
  },
  '/why-us': {
    label: 'Why Choose Us',
    description: 'Learn what customers can expect from this service business.',
  },
  '/faqs': {
    label: 'Frequently Asked Questions',
    description: 'Answers to common questions about service, scheduling, estimates, and what to expect.',
  },
  '/contact': {
    label: 'Contact',
    description: 'Contact this business for service questions, scheduling help, and support.',
  },
  '/book-service': {
    label: 'Request Service',
    description: 'Request service and share the information needed to prepare for your visit.',
  },
  '/privacy-policy': {
    label: 'Privacy Policy',
    description: 'Read the privacy policy for this website.',
  },
};

const CUSTOM_APPAREL_STATIC_SEO = {
  '/services': {
    label: 'Custom Apparel & Decoration Services',
    description: 'Explore custom embroidery, screen printing, DTF printing, corporate apparel, team and school apparel, hats, bags, towels, promotional products, and artwork support.',
  },
  '/service-areas': {
    label: 'Custom Apparel Service Areas',
    description: 'View North Texas service areas for custom embroidery, screen printing, DTF printing, branded apparel, and promotional products, with shipping available nationwide.',
  },
  '/our-work': {
    label: 'Custom Apparel Portfolio',
    description: 'Explore completed embroidery, decorated apparel, hats, bags, screen printing, and other custom branding projects.',
  },
  '/reviews': {
    label: 'Customer Reviews',
    description: 'Read approved customer reviews for custom apparel, embroidery, screen printing, DTF, and branded product projects.',
  },
  '/about': {
    label: 'About',
    description: 'Learn about the custom apparel and decoration workflow, from artwork and product selection through proofing, production, pickup, and shipping.',
  },
  '/why-us': {
    label: 'Why Choose Us',
    description: 'Learn what customers can expect when ordering custom embroidery, screen printing, DTF, branded apparel, and promotional products.',
  },
  '/faqs': {
    label: 'Custom Apparel FAQs',
    description: 'Answers to common questions about custom apparel, embroidery, screen printing, DTF, artwork, proofs, quantities, pickup, and shipping.',
  },
  '/contact': {
    label: 'Contact',
    description: 'Contact the team with questions about custom apparel, embroidery, screen printing, DTF, artwork, quotes, pickup, or shipping.',
  },
  '/book-service': {
    label: 'Request a Quote',
    description: 'Request a custom apparel quote and share project type, quantity, timing, artwork status, fulfillment preference, and reference files.',
  },
};

export default function SiteLayout() {
  const { settings } = useBusinessSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [siteAccess, setSiteAccess] = useState({ site_status: 'Setup', heading: null, message: null });
  const [siteAccessChecked, setSiteAccessChecked] = useState(false);
  const [agencyPreview, setAgencyPreview] = useState(false);
  const [previewChecked, setPreviewChecked] = useState(false);
  const location = useLocation();
  const businessName = settings?.business_name || 'Service Business';
  const regionLabel = settings?.service_region_label || '';
  const phone = settings?.phone || '';
  const customerSupportEmail = settings?.customer_support_email || settings?.email || '';
  const logoLight = settings?.logo_url || settings?.logo_reversed_url || null;
  const logoDark = settings?.logo_reversed_url || settings?.logo_url || null;
  const supportName = settings?.community_support_name || '';
  const supportLabel = settings?.community_support_label || 'Proudly Supporting';
  const supportUrl = settings?.community_support_url || '';
  const supportBadgeUrl = settings?.community_support_badge_url || null;
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const socialLinks = [
    { key: 'facebook', label: 'Facebook', enabled: settings?.social_facebook_enabled, url: settings?.social_facebook_url, Icon: Facebook },
    { key: 'instagram', label: 'Instagram', enabled: settings?.social_instagram_enabled, url: settings?.social_instagram_url, Icon: Instagram },
    { key: 'tiktok', label: 'TikTok', enabled: settings?.social_tiktok_enabled, url: settings?.social_tiktok_url, Icon: Music2 },
    { key: 'linkedin', label: 'LinkedIn', enabled: settings?.social_linkedin_enabled, url: settings?.social_linkedin_url, Icon: Linkedin },
    { key: 'youtube', label: 'YouTube', enabled: settings?.social_youtube_enabled, url: settings?.social_youtube_url, Icon: Youtube },
    { key: 'x', label: 'X / Twitter', enabled: settings?.social_x_enabled, url: settings?.social_x_url, Icon: Twitter }
  ].filter(item => item.enabled && item.url);

  const nav = [
    { label: 'Home', to: '/' },
    { label: isApplianceModule ? 'Appliance Repair' : isPlumbingModule ? 'Plumbing Services' : 'Services', to: isApplianceModule ? '/appliance-repair' : '/services' },
    ...(isApplianceModule ? [{ label: 'Brands', to: '/brands' }] : []),
    { label: 'Service Areas', to: '/service-areas' },
    ...(settings?.portfolio_enabled === true && settings?.portfolio_page_enabled !== false ? [{ label: settings?.portfolio_display_label || 'Our Work', to: '/our-work' }] : []),
    { label: 'Why Us', to: '/why-us' },
    { label: 'Reviews', to: '/reviews' },
    { label: 'About', to: '/about' },
    { label: 'FAQs', to: '/faqs' }
  ];

  const isNavActive = (to) => location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));

  useEffect(() => {
    let active = true;
    base44.functions.invoke('getPublicSiteStatus', {})
      .then(res => {
        if (!active) return;
        const data = res?.data || res || {};
        setSiteAccess({
          site_status: data.site_status || 'Setup',
          heading: data.heading || null,
          message: data.message || null
        });
      })
      .catch(() => {
        if (active) setSiteAccess({ site_status: 'Active', heading: null, message: null });
      })
      .finally(() => {
        if (active) setSiteAccessChecked(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then(user => {
        if (active) setAgencyPreview(isAgencyOwner(user));
      })
      .catch(() => {
        if (active) setAgencyPreview(false);
      })
      .finally(() => {
        if (active) setPreviewChecked(true);
      });
    return () => { active = false; };
  }, []);

  // Staging noindex: while on base44.app domain, keep noindex; on custom domain, allow indexing
  useEffect(() => {
    const isStaging = window.location.hostname.includes('base44.app');
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const dynamicDetailRoute = /^\/(services|appliance-repair|service-areas|our-work)\/[^/]+\/?$/.test(location.pathname);
    if (isStaging || siteAccess.site_status !== 'Active') meta.content = 'noindex, nofollow';
    else if (!dynamicDetailRoute) meta.content = 'index, follow';
  }, [siteAccess.site_status, location.pathname]);

  // Static-route SEO. Dynamic service and service-area detail pages manage their own metadata.
  useEffect(() => {
    const seo = isCustomApparel ? (CUSTOM_APPAREL_STATIC_SEO[location.pathname] || STATIC_SEO[location.pathname]) : STATIC_SEO[location.pathname];
    if (!seo) return;

    const baseUrl = (settings?.website_url || window.location.origin).replace(/\/$/, '');
    const canonicalUrl = location.pathname === '/' ? `${baseUrl}/` : `${baseUrl}${location.pathname}`;
    const regionSuffix = regionLabel ? ` | ${regionLabel}` : '';
    const title = location.pathname === '/'
      ? (settings?.seo_default_meta_title || `${businessName}${regionSuffix}`)
      : `${seo.label} | ${businessName}`;
    const description = location.pathname === '/' && settings?.seo_default_meta_description
      ? settings.seo_default_meta_description
      : `${seo.description}${regionLabel ? ` Serving ${regionLabel}.` : ``}`;
    const socialImage = settings?.default_social_image_url || settings?.hero_image_url || null;

    const setMeta = (selector, attr, value, tag = 'meta') => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(tag);
        if (tag === 'meta') {
          if (selector.includes('property=')) el.setAttribute('property', selector.match(/property="([^"]+)"/)?.[1] || '');
          else el.setAttribute('name', selector.match(/name="([^"]+)"/)?.[1] || '');
        } else if (tag === 'link') {
          el.setAttribute('rel', 'canonical');
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
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
  }, [location.pathname, settings, businessName, regionLabel]);

  // Google Analytics 4: load only on the live/custom domain when analytics use is approved.
  useEffect(() => {
    const measurementId = String(settings?.ga4_id || '').trim().toUpperCase();
    const validId = /^G-[A-Z0-9]+$/i.test(measurementId);
    const isStaging = window.location.hostname.includes('base44.app');
    const enabled = settings?.privacy_use_analytics === true && validId && !isStaging && siteAccess.site_status === 'Active';
    if (!enabled) return;

    if (window.__rrsGa4Id !== measurementId) {
      let script = document.getElementById('rrs-ga4-script');
      if (!script) {
        script = document.createElement('script');
        script.id = 'rrs-ga4-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        document.head.appendChild(script);
      }
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, { send_page_view: false, anonymize_ip: true });
      window.__rrsGa4Id = measurementId;
    }

    window.gtag?.('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: location.pathname + location.search
    });
  }, [settings?.ga4_id, settings?.privacy_use_analytics, siteAccess.site_status, location.pathname, location.search]);

  // Structured data: LocalBusiness (service-area business, no physical address shown unless enabled)
  useEffect(() => {
    const showAddress = settings?.show_business_address_publicly;
    const ld = {
      '@context': 'https://schema.org',
      '@type': isCustomApparel ? 'LocalBusiness' : 'HomeAndConstructionBusiness',
      name: businessName,
      url: settings?.website_url || window.location.origin,
    };
    if (phone) ld.telephone = phone;
    if (customerSupportEmail) ld.email = customerSupportEmail;
    if (regionLabel) ld.areaServed = regionLabel;
    if (showAddress) {
      ld.address = {
        '@type': 'PostalAddress',
        streetAddress: settings?.address_line_1,
        addressLocality: settings?.address_city,
        addressRegion: settings?.address_state,
        postalCode: settings?.address_zip,
      };
    }
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(ld);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [settings, phone, customerSupportEmail, businessName, regionLabel, isCustomApparel]);

  if (!siteAccessChecked || !previewChecked) {
    return <div className="min-h-screen bg-brand-dark" />;
  }

  if (siteAccess.site_status !== 'Active' && !agencyPreview) {
    const isSetup = siteAccess.site_status === 'Setup';
    return (
      <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-6 font-body">
        <div className="w-full max-w-xl text-center">
          {!isSetup && (
            <div className="inline-flex bg-black rounded-xl px-5 py-3 mb-8">
              <img src={logoDark} alt={settings?.business_name || 'Business logo'} className="w-56 h-auto object-contain" />
            </div>
          )}
          <div className="text-xs font-bold tracking-[0.2em] uppercase text-brand-accent mb-3">
            {isSetup ? 'Pre-Launch' : siteAccess.site_status === 'Maintenance' ? 'Scheduled Maintenance' : 'Service Notice'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            {siteAccess.heading || (isSetup ? 'Website Setup in Progress' : 'Website Temporarily Unavailable')}
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            {siteAccess.message || (isSetup
              ? 'This website is being configured and is not yet available to the public.'
              : 'This website is temporarily unavailable. Please contact the business directly for assistance.')}
          </p>
          {!isSetup && settings?.phone && (
            <a
              href={`tel:${settings.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex mt-8 items-center gap-2 rounded-lg bg-brand-accent px-6 py-3 font-bold text-brand-dark"
            >
              <Phone className="w-4 h-4" /> {settings.phone}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="public-site min-h-screen flex flex-col bg-brand-light font-body">
      {siteAccess.site_status !== 'Active' && agencyPreview && (
        <div className="bg-amber-400 text-slate-950 text-xs font-bold tracking-wide text-center px-3 py-2">
          PRE-LAUNCH PREVIEW · PUBLIC SITE STATUS: {siteAccess.site_status.toUpperCase()} · NOINDEX
        </div>
      )}
      {/* Top utility bar — hidden on mobile (sticky bar covers it) */}
      <div className="hidden lg:block bg-brand-dark text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          {phone ? (
            <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 font-semibold text-brand-accent hover:text-white">
              <Phone className="w-3.5 h-3.5" /> {phone}
            </a>
          ) : <span />}
          <span className="hidden md:inline text-slate-300">{isPlumbingModule && settings?.credentials?.[0] ? `${settings.credentials[0]} · ${settings?.service_region_label || ''}` : (settings?.emergency_service_enabled && settings?.emergency_service_text ? settings.emergency_service_text : settings?.primary_message)}</span>
          <div className="flex items-center gap-4">
            {settings?.family_owned && <span className="flex items-center gap-1 text-slate-200"><Shield className="w-3.5 h-3.5 text-brand-accent" /> Family Owned</span>}
            {settings?.first_trip_completion_text && <span className="text-slate-200">{settings.first_trip_completion_text}</span>}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-dark lg:bg-brand-light border-b border-brand-accent/40 lg:border-slate-300/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-[88px] sm:h-24 lg:h-28">
          <Link to="/" className="flex items-center min-w-0" onClick={() => setMobileOpen(false)}>
            <img src={logoDark} alt={businessName} className="lg:hidden w-[clamp(205px,64vw,245px)] sm:w-[275px] h-auto object-contain" />
            {logoLight ? <img src={logoLight} alt={businessName} className="hidden lg:block lg:w-[250px] xl:w-[285px] h-auto object-contain" /> : <span className="hidden lg:block font-black text-xl text-brand-dark">{businessName}</span>}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={`px-3 py-2 text-sm transition-colors border-b-2 text-brand-dark hover:text-brand-dark ${
                  isNavActive(n.to) ? 'font-bold' : 'font-semibold border-transparent hover:border-brand-accent/50'
                }`}
                style={isNavActive(n.to) ? { borderBottomColor: 'var(--brand-accent)', color: 'var(--brand-dark)' } : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/book-service" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-brand-dark bg-brand-accent px-5 py-2.5 rounded-lg transition-colors hover:bg-brand-accent-dark">
              <Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Book Service'}
            </Link>
            <button className="lg:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/10 bg-brand-dark">
            <div className="px-4 py-3 space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 text-sm text-white rounded-md transition-colors border-l-2 ${isNavActive(n.to) ? 'font-bold bg-white/10' : 'font-semibold border-transparent hover:bg-white/10'}`}
                  style={isNavActive(n.to) ? { borderLeftColor: 'var(--brand-accent)' } : undefined}
                >
                  {n.label}
                </Link>
              ))}
              <Link to="/book-service" onClick={() => setMobileOpen(false)} className="block mt-2 text-center text-sm font-bold text-brand-dark bg-brand-accent px-5 py-2.5 rounded-lg">
                {isCustomApparel ? 'Request a Quote' : 'Book Service'}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark text-slate-300 pb-14 sm:pb-0">
        <div className="max-w-7xl mx-auto px-4 py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-3">
              {logoDark ? <img src={logoDark} alt={businessName} className="w-[220px] h-auto object-contain" /> : <span className="font-black text-white">{businessName}</span>}
            </div>
            {settings?.primary_message && <p className="text-sm font-semibold text-white">{settings.primary_message}</p>}
            {regionLabel && <p className="text-sm mt-2">Serving {regionLabel}.</p>}
            {socialLinks.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">Follow Us</div>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(({ key, label, url, Icon }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${businessName} on ${label}`}
                      title={label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-brand-accent hover:text-brand-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <Link to="/book-service" className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-brand-dark bg-brand-accent px-5 py-2.5 rounded-lg">
              <Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Request Service'}
            </Link>
          </div>
          <div>
            <div className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Services</div>
            <ul className="space-y-1.5 text-sm">
              <li><Link to={isApplianceModule ? '/appliance-repair' : '/services'} className="hover:text-brand-accent">{isApplianceModule ? 'Appliance Repair' : 'Services'}</Link></li>
              {isApplianceModule && <li><Link to="/brands" className="hover:text-brand-accent">Brands We Service</Link></li>}
              <li><Link to="/service-areas" className="hover:text-brand-accent">Service Areas</Link></li>
              {settings?.portfolio_enabled === true && settings?.portfolio_page_enabled !== false && <li><Link to="/our-work" className="hover:text-brand-accent">{settings?.portfolio_display_label || 'Our Work'}</Link></li>}
              <li><Link to="/book-service" className="hover:text-brand-accent">{isCustomApparel ? 'Request a Quote' : 'Book Service'}</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Company</div>
            <ul className="space-y-1.5 text-sm">
              <li><Link to="/why-us" className="hover:text-brand-accent">Why Us</Link></li>
              <li><Link to="/about" className="hover:text-brand-accent">About</Link></li>
              <li><Link to="/reviews" className="hover:text-brand-accent">Reviews</Link></li>
              <li><Link to="/faqs" className="hover:text-brand-accent">FAQs</Link></li>
              <li><Link to="/contact" className="hover:text-brand-accent">Contact</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-brand-accent">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-3 text-sm uppercase tracking-wide">Contact</div>
            <ul className="space-y-1.5 text-sm">
              {phone && <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-accent" /> <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="hover:text-brand-accent font-semibold">{phone}</a></li>}
              {customerSupportEmail && <li className="text-sm"><a href={`mailto:${customerSupportEmail}`} className="hover:text-brand-accent">{customerSupportEmail}</a></li>}
              {settings?.hours_mon_fri && <li className="text-sm">Mon-Fri: {settings.hours_mon_fri}</li>}
              {settings?.hours_saturday && <li className="text-sm">Sat: {settings.hours_saturday}</li>}
              {settings?.hours_sunday && <li className="text-sm">Sun: {settings.hours_sunday}</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            {supportName && (
              supportUrl ? (
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-xl px-2 py-1 -ml-2 transition-all duration-300 hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                  aria-label={`${supportLabel} ${supportName}`}
                >
                  {supportBadgeUrl && <img src={supportBadgeUrl} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-contain flex-shrink-0" />}
                  <div>
                    <div className="text-xs font-bold text-brand-accent uppercase tracking-wide">{supportLabel}</div>
                    <div className="text-sm font-semibold text-white">{supportName}</div>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 rounded-xl px-2 py-1 -ml-2">
                  {supportBadgeUrl && <img src={supportBadgeUrl} alt="" className="w-14 h-14 sm:w-16 sm:h-16 object-contain flex-shrink-0" />}
                  <div>
                    <div className="text-xs font-bold text-brand-accent uppercase tracking-wide">{supportLabel}</div>
                    <div className="text-sm font-semibold text-white">{supportName}</div>
                  </div>
                </div>
              )
            )}
            <span className="text-xs text-slate-500">© {new Date().getFullYear()} {businessName}. All rights reserved.{regionLabel ? ` Serving ${regionLabel}.` : ''}</span>
          </div>
        </div>
      </footer>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-slate-300/70 bg-brand-light shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-brand-dark border-r border-slate-200">
          <Phone className="w-4 h-4" /> Call
        </a>}
        <Link to="/book-service" className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-brand-dark bg-brand-accent">
          <Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Request Service'}
        </Link>
      </div>

      <VoiceCallWidget />
      <ChatWidget />
    </div>
  );
}