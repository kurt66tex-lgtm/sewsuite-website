import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Calendar, Truck, ShieldCheck, Clock, Star, ArrowRight, MapPin, Package, ClipboardCheck, Users, Award } from 'lucide-react';
import ServiceIcon from '@/components/site/ServiceIcon';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import PortfolioSection from '@/components/site/PortfolioSection';


export default function Home() {
  const { settings } = useBusinessSettings();
  const [services, setServices] = useState([]);
  const [areas, setAreas] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceType.filter({ publicly_advertised: true }, 'display_order', 20),
      base44.entities.ServiceArea.filter({ active: true }, 'display_order', 20),
      base44.entities.Brand.filter({ featured: true }, 'display_order', 20),
      base44.entities.Review.filter({ approved_for_website: true }, 'display_order', 3)
    ]).then(([s, a, b, r]) => { setServices(s); setAreas(a); setBrands(b); setReviews(r); })
      .catch(() => {});
  }, []);

  const businessName = settings?.business_name || 'Service Business';
  const regionLabel = settings?.service_region_label || '';
  const phone = settings?.phone || '';
  const heroImageUrl = settings?.hero_image_url || null;
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isPlumbingModule = settings?.industry_module === 'plumbing';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const servicesBasePath = isApplianceModule ? '/appliance-repair' : '/services';

  const verifiedTrustItems = [
    ...(Array.isArray(settings?.credentials) ? settings.credentials.map(label => ({ icon: ShieldCheck, label })) : []),
    ...(settings?.established_year ? [{ icon: Clock, label: `Serving Since ${settings.established_year}` }] : []),
    ...(Array.isArray(settings?.trust_highlights) ? settings.trust_highlights.map(label => ({ icon: Award, label })) : []),
    ...(settings?.emergency_service_enabled && settings?.emergency_service_text ? [{ icon: Clock, label: settings.emergency_service_text }] : []),
    ...(settings?.first_trip_completion_text ? [{ icon: Star, label: settings.first_trip_completion_text }] : []),
    ...(settings?.warranty_text ? [{ icon: ShieldCheck, label: settings.warranty_text }] : [])
  ].slice(0, 6);

  const trustItems = verifiedTrustItems.length > 0 ? verifiedTrustItems : (isCustomApparel ? [
    { icon: Star, label: 'Custom Decorated Apparel' },
    { icon: ShieldCheck, label: 'Artwork & Proof Support' },
    { icon: Truck, label: 'Local Pickup & Nationwide Shipping' }
  ] : [
    { icon: Clock, label: 'Responsive Service' },
    { icon: ShieldCheck, label: 'Clear Communication' },
    { icon: Truck, label: 'Prepared Service Calls' }
  ]);

  const coreValues = isCustomApparel ? [
    { icon: Star, title: 'Professional', text: 'Custom decoration for businesses, schools, teams, organizations, and individual projects.' },
    { icon: ShieldCheck, title: 'Project Focused', text: 'Artwork, decoration method, product choice, quantity, and timing are reviewed together.' },
    { icon: MapPin, title: 'Local + Nationwide', text: 'Serving North Texas locally while accepting and shipping orders throughout the United States.' }
  ] : isPlumbingModule ? [
    { icon: ShieldCheck, title: 'Licensed', text: 'Service led by a Texas Master Plumber with verified credentials.' },
    { icon: Star, title: 'Honest', text: 'Clear explanations, practical options, and straightforward communication.' },
    { icon: MapPin, title: 'Local', text: `Serving ${regionLabel || 'North Texas'} with a locally focused residential plumbing operation.` }
  ] : [
    { icon: Clock, title: 'Prepared', text: 'Collect useful service details before the visit whenever possible.' },
    { icon: ShieldCheck, title: 'Clear', text: 'Keep customers informed about scheduling, diagnosis, and next steps.' },
    { icon: Star, title: 'Straightforward', text: 'Present service information and repair options clearly.' }
  ];

  const whyFeatures = isCustomApparel ? [
    { icon: ClipboardCheck, title: 'Project Details Up Front', text: 'Share project type, quantity, timing, artwork, and reference files with the quote request.' },
    { icon: Users, title: 'Built for Repeat Customers', text: 'Keep customer history, project details, and reusable artwork connected for future orders.' },
    { icon: Package, title: 'Multiple Decoration Options', text: 'Embroidery, screen printing, DTF, apparel, hats, bags, towels, and specialty work in one workflow.' },
    { icon: Star, title: 'Proof-to-Production Workflow', text: 'Quotes, artwork, proofs, approval, production, pickup or shipping, and completion stay organized.' }
  ] : isPlumbingModule ? [
    { icon: ShieldCheck, title: settings?.credentials?.[0] || 'Licensed Plumbing', text: 'Verified plumbing credentials are shown directly from the business profile.' },
    { icon: Clock, title: settings?.emergency_service_text || 'Emergency Plumbing', text: 'Emergency availability is shown only when enabled and confirmed by the business.' },
    { icon: Users, title: settings?.family_owned ? 'Family Owned' : 'Local Service', text: 'A local service-business relationship backed by connected customer, job, and visit history.' },
    { icon: ClipboardCheck, title: 'Better Information Before Dispatch', text: 'Customers can share the plumbing issue, service location, intake answers, and photos before the visit.' }
  ] : [
    { icon: ClipboardCheck, title: 'Information Before Dispatch', text: isApplianceModule ? 'Collect appliance details, symptoms, model information, and photos before the visit when available.' : 'Collect service details, project information, equipment information, and photos before the visit when available.' },
    { icon: Users, title: 'Organized Service Workflow', text: 'Keep the customer, service location, job, visit, and technician information connected in one workflow.' },
    { icon: Package, title: isApplianceModule ? 'Clear Repair Options' : 'Clear Service Options', text: 'Document the assessment, estimate, materials needs, and next steps for the customer.' },
    ...(settings?.first_trip_completion_text ? [{ icon: Award, title: settings.first_trip_completion_text, text: 'Verified performance information provided by the business.' }] : []),
    ...(settings?.warranty_text ? [{ icon: ShieldCheck, title: settings.warranty_text, text: 'Warranty information provided by the business.' }] : [])
  ];

  const howSteps = isCustomApparel ? [
    { title: 'Tell Us About the Project', text: 'Choose the project type and share quantities, timing, artwork, and reference files.' },
    { title: 'Quote & Artwork Review', text: `${businessName} reviews the project and prepares pricing and artwork requirements.` },
    { title: 'Proof & Approval', text: 'When a proof is needed, review and approve the artwork before production.' },
    { title: 'Production & Fulfillment', text: 'Approved work moves into production, quality check, then local pickup or shipping.' }
  ] : [
    { title: isApplianceModule ? 'Tell Us What\u2019s Wrong' : 'Tell Us What You Need', text: isApplianceModule ? 'Provide appliance, brand, symptoms, model information and photos when possible.' : 'Provide the service needed, project or equipment details, and photos when useful.' },
    { title: 'We Prepare', text: `${businessName} reviews the information before dispatch and prepares for the service call.` },
    { title: isApplianceModule ? 'We Diagnose & Repair' : 'We Assess & Complete the Work', text: 'The team confirms the scope, explains the estimate or options, and performs approved work.' },
    { title: 'We Verify the Work', text: settings?.warranty_text ? `We verify operation and explain the applicable ${settings.warranty_text}.` : 'We verify operation and explain the next steps before the visit is closed.' }
  ];

  return (
    <div>
      {/* Hero */}
      <section className={`${isCustomApparel ? 'bg-brand-light' : 'bg-brand-dark'} relative overflow-hidden`}>
        <div className="absolute top-0 inset-x-0 h-1 bg-brand-accent" />
        <div className={`max-w-7xl mx-auto px-5 sm:px-8 lg:px-4 grid items-center gap-5 sm:gap-6 lg:gap-10 ${heroImageUrl ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
          {/* Content: heading, paragraph, CTAs (tablet+), desktop trust items */}
          <div className={`pt-7 pb-0 sm:pt-10 sm:pb-2 lg:py-16 flex flex-col ${isCustomApparel ? 'text-brand-dark text-left items-start' : 'text-white'} ${!isCustomApparel && (heroImageUrl ? 'text-center lg:text-left items-center lg:items-start' : 'text-center items-center max-w-4xl mx-auto')}`}>
            {isCustomApparel && <div className="text-xs sm:text-sm font-black uppercase tracking-[0.1em] text-brand-accent mb-2.5">Custom Apparel & Promo Products</div>}
            <h1 className={`font-black tracking-tight leading-[1.02] lg:leading-[1.05] text-[clamp(2rem,8.5vw,2.45rem)] md:text-[clamp(2.6rem,5vw,3.2rem)] lg:text-6xl max-w-[370px] md:max-w-[650px] [text-wrap:balance] ${isCustomApparel ? 'mx-0 lg:max-w-xl' : `mx-auto ${heroImageUrl ? 'lg:max-w-xl lg:mx-0' : 'lg:max-w-4xl'}`}`}>
              {isCustomApparel ? <>Branded Gear That Works Harder <span className="text-brand-accent">for Your Business</span></> : isPlumbingModule ? <>{settings?.primary_message || 'Professional Plumbing Service'}{regionLabel && <> in <span className="text-brand-accent">{regionLabel}</span></>}</> : <>{isApplianceModule ? 'Expert Appliance Repair' : (settings?.primary_business_category || 'Professional Service')}{regionLabel && <> in <span className="text-brand-accent">{regionLabel}</span></>}</>}
            </h1>
            <p className={`mt-4 lg:mt-5 text-[15px] sm:text-[17px] lg:text-lg max-w-[360px] sm:max-w-[600px] leading-[1.48] ${isCustomApparel ? 'text-slate-600 mx-0 lg:max-w-xl' : `text-slate-300 mx-auto ${heroImageUrl ? 'lg:max-w-xl lg:mx-0' : 'lg:max-w-3xl'}`}`}>
              {isCustomApparel ? 'Embroidery, screen printing, and promotional products for businesses, schools, teams, and organizations across North Texas and nationwide.' : isPlumbingModule ? `Licensed residential plumbing service for ${regionLabel || 'North Texas'}. Tell us what is happening, share photos when useful, and the team can review the details before the visit.` : (isApplianceModule ? 'Tell us what your appliance is doing, and share the model number, error code, or photos when available. We review the details before dispatch so the service call can be prepared with better information before the technician arrives.' : 'Tell us what you need help with and share useful project, property, equipment, or photo details when available. We review the information before the visit so the team can be better prepared.')}
            </p>
            <div className={`${isCustomApparel ? 'flex' : 'hidden md:flex'} mt-5 lg:mt-7 flex-col sm:flex-row gap-2 sm:gap-3 justify-start items-stretch sm:items-center`}>
              <Link to="/book-service" className="inline-flex items-center justify-center gap-2 text-brand-dark font-bold px-5 py-3 rounded-lg shadow-md transition-transform hover:-translate-y-0.5 bg-brand-accent w-full sm:w-auto max-w-[370px]">
                <Calendar className="w-5 h-5" /> {isCustomApparel ? 'Request a Quote' : isApplianceModule ? 'Book Appliance Repair' : 'Request Service'}
              </Link>
              {isCustomApparel ? <Link to="/services" className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-lg border border-slate-300 bg-white/70 text-brand-dark hover:border-brand-accent transition-colors w-full sm:w-auto max-w-[370px]">
                Explore Our Services <ArrowRight className="w-4 h-4" />
              </Link> : phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center justify-center gap-2 font-bold px-6 py-3.5 rounded-lg border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-brand-dark transition-colors w-full md:w-auto max-w-[360px] md:max-w-none">
                <Phone className="w-5 h-5" /> Call {phone}
              </a>}
            </div>
            {/* Desktop trust items — left column, below CTAs */}
            <div className={`hidden lg:flex mt-8 flex-wrap gap-x-5 gap-y-2.5 ${heroImageUrl ? 'justify-start' : 'justify-center'}`}>
              {trustItems.map((t, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-sm ${isCustomApparel ? 'text-slate-600' : 'text-slate-200'}`}>
                  <t.icon className="w-4 h-4 text-brand-accent" /> {t.label}
                </div>
              ))}
            </div>
          </div>
          {/* Optional client hero image */}
          {heroImageUrl && <div className="relative flex items-center justify-center pb-6 sm:pb-6 lg:py-0">
            <img src={heroImageUrl} alt={`${businessName} featured service image`} className={`w-full h-auto ${isCustomApparel ? 'rounded-xl shadow-lg max-w-[420px] md:max-w-[720px] lg:max-w-none object-cover aspect-[4/3] lg:aspect-auto' : 'rounded-xl max-w-[380px] md:max-w-[680px] lg:max-w-none object-contain'} mx-auto`} />
          </div>}
          {/* Mobile/tablet trust items — below truck */}
          <div className={`hidden sm:flex lg:hidden flex-wrap ${isCustomApparel ? 'justify-start' : 'justify-center'} gap-x-4 gap-y-2 pb-7 sm:pb-8 px-2 max-w-[420px] ${isCustomApparel ? 'mx-0' : 'mx-auto'}`}>
            {trustItems.map((t, i) => (
              <div key={`m-${i}`} className={`flex items-center gap-1.5 text-xs sm:text-sm ${isCustomApparel ? 'text-slate-600' : 'text-slate-200'}`}>
                <t.icon className="w-4 h-4 text-brand-accent" /> {t.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick / Reliable / Honest */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-3 gap-8">
            {coreValues.map((v, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-accent/10 mb-3">
                  <v.icon className="w-7 h-7 text-brand-dark" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark mb-1">{v.title}</h3>
                <p className="text-sm text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-brand-light py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-brand-dark">{isCustomApparel ? 'Custom Apparel & Decoration Services' : isPlumbingModule ? 'Residential Plumbing Services' : isApplianceModule ? 'Appliance Repair Services' : 'Services'}</h2>
            <p className="mt-2 text-slate-600">{isCustomApparel ? 'From custom embroidery and screen printing to DTF, corporate apparel, team gear, hats, bags, towels, and specialty projects.' : isPlumbingModule ? 'From everyday fixture repairs to water heaters, drains, sewer lines, leaks, water lines, gas lines, and emergency plumbing.' : (isApplianceModule ? 'View the appliance repair services currently offered.' : 'View the services currently offered by this business.')}</p>
            {(settings?.first_trip_completion_text || settings?.warranty_text) && <p className="mt-1 text-xs text-slate-400">{[settings?.first_trip_completion_text, settings?.warranty_text].filter(Boolean).join(' • ')}</p>}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <Link key={s.id} to={`${servicesBasePath}/${s.slug}`} className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-brand-accent hover:shadow-lg transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                    <ServiceIcon service={s} className="w-5 h-5 text-brand-dark" />
                  </div>
                  <h3 className="font-bold text-brand-dark group-hover:text-brand-accent">{s.name}</h3>
                </div>
                <p className="text-sm text-slate-600">{s.short_description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why choose this business */}
      <section className="bg-brand-dark py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white">Why Choose <span className="text-brand-accent">{businessName}</span>?</h2>
            <p className="mt-2 text-slate-400">{isCustomApparel ? 'A project workflow from quote and artwork through approval, production, quality check, pickup or shipping.' : isApplianceModule ? 'A service workflow built around preparation, clear communication, and efficient repair.' : 'A service workflow built around preparation, clear communication, and dependable follow-through.'}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyFeatures.map((f, i) => (
              <div key={i} className="bg-brand-charcoal rounded-xl p-5 border border-slate-800">
                <f.icon className="w-8 h-8 text-brand-accent mb-3" />
                <h3 className="font-bold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-brand-dark">How It Works</h2>
            <p className="mt-2 text-slate-600">{isCustomApparel ? 'From quote request through artwork approval, production, pickup or shipping, the project stays organized.' : 'Better information before the visit helps the team prepare and keeps the service process organized.'}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {howSteps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start bg-brand-light rounded-xl p-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-accent text-brand-dark flex items-center justify-center font-black text-sm">{i + 1}</div>
                <div>
                  <h3 className="font-bold text-brand-dark text-sm">{step.title}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews preview */}
      {reviews.length > 0 && (
        <section className="bg-brand-light py-14 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-brand-dark">Reviews</h2>
              <Link to="/reviews" className="text-sm font-bold text-brand-dark hover:text-brand-accent flex items-center gap-1">See all reviews <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-xl p-5 border border-slate-100">
                  <div className="flex gap-0.5 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < (r.rating || 5) ? 'fill-brand-accent text-brand-accent' : 'text-slate-300'}`} />)}</div>
                  <p className="text-sm text-slate-700">"{r.body}"</p>
                  <div className="mt-3 text-sm font-bold text-brand-dark">
                    {r.customer_name} {r.city ? `• ${r.city}` : ''}
                    {(r.review_date_label || r.review_date) && (
                      <span className="font-normal text-slate-500"> · {r.review_date_label || new Date(r.review_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Service areas + brands */}
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-black text-brand-dark mb-4">Service Areas</h2>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <Link key={a.id} to={`/service-areas/${a.slug}`} className="inline-flex items-center gap-1.5 text-sm border border-slate-300 rounded-full px-3 py-1.5 text-brand-dark hover:border-brand-accent hover:text-brand-dark transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-brand-accent" /> {a.city}
                </Link>
              ))}
            </div>
            <Link to="/service-areas" className="inline-flex items-center gap-1 text-sm font-bold text-brand-dark hover:text-brand-accent mt-4">All service areas <ArrowRight className="w-4 h-4" /></Link>
          </div>
          {isApplianceModule && <div>
            <h2 className="text-2xl font-black text-brand-dark mb-4">Brands We Service</h2>
            <div className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <Link key={b.id} to="/brands" className="text-sm border border-slate-300 rounded-full px-3 py-1.5 text-brand-dark hover:border-brand-accent hover:text-brand-dark transition-colors">{b.name}</Link>
              ))}
            </div>
            <Link to="/brands" className="inline-flex items-center gap-1 text-sm font-bold text-brand-dark hover:text-brand-accent mt-4">All brands <ArrowRight className="w-4 h-4" /></Link>
          </div>}
        </div>
      </section>

      {settings?.portfolio_home_enabled !== false && settings?.portfolio_enabled === true && <div className="max-w-7xl mx-auto px-4"><PortfolioSection heading={settings?.portfolio_display_label || 'Our Work'} limit={6} /></div>}

      {/* Final CTA */}
      <section className="bg-brand-dark py-14">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-black text-white">{isCustomApparel ? <>Have a Project in Mind? <span className="text-brand-accent">Tell Us About It.</span></> : isPlumbingModule ? <>Have a Plumbing Problem? <span className="text-brand-accent">Tell Us What’s Going On.</span></> : isApplianceModule ? <>Need Your Appliance Fixed? <span className="text-brand-accent">Tell Us What's Going On.</span></> : <>Need Service? <span className="text-brand-accent">Tell Us What You Need.</span></>}</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">{isCustomApparel ? 'Share your project type, quantity, timing, artwork, and product ideas. Sew Suite can review the details and follow up with the quote and next steps.' : isPlumbingModule ? 'Share the plumbing issue, service address, and any useful photos. The request flows directly into the CRM so the team has the details before scheduling.' : (isApplianceModule ? "Share the appliance, brand, model number and what it's doing. When possible, we'll review the information before your appointment so the technician arrives prepared." : 'Share the service, project, property, equipment, and photo details that may help. The team can review the information before the visit.')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/book-service" className="cta-primary inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg transition-colors">
              <Calendar className="w-5 h-5" /> {isCustomApparel ? 'Request a Quote' : 'Book Service'}
            </Link>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="cta-secondary-dark inline-flex items-center gap-2 font-bold px-6 py-3 rounded-lg transition-colors">
              <Phone className="w-5 h-5" /> Call {phone}
            </a>}
          </div>
        </div>
      </section>
    </div>
  );
}