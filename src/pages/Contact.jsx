import { Link } from 'react-router-dom';
import { Phone, Mail, Clock, MapPin, Calendar } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function Contact() {
  const { settings } = useBusinessSettings();
  const businessName = settings?.business_name || 'Service Business';
  const phone = settings?.phone || '';
  const email = settings?.customer_support_email || settings?.email || '';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');

  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <nav className="text-xs text-slate-500 mb-3"><Link to="/" className="hover:text-brand-dark">Home</Link> / Contact</nav>
          <h1 className="text-4xl font-bold text-slate-900">Contact {businessName}</h1>
          <p className="mt-3 text-lg text-slate-600">{isCustomApparel ? 'Call, email, or send your project details and artwork through our quote request.' : 'Call us, email us, or book service online.'}</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-12 grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 border border-slate-200 rounded-xl p-4 hover:border-brand-accent">
            <Phone className="w-5 h-5 text-brand-accent" />
            <div><div className="text-xs text-slate-500">Call us</div><div className="font-semibold text-slate-900">{phone}</div></div>
          </a>}
          {email && <a href={`mailto:${email}`} className="flex items-center gap-3 border border-slate-200 rounded-xl p-4 hover:border-brand-accent">
            <Mail className="w-5 h-5 text-brand-accent" />
            <div><div className="text-xs text-slate-500">Email us</div><div className="font-semibold text-slate-900">{email}</div></div>
          </a>}
          {(settings?.hours_mon_fri || settings?.hours_saturday || settings?.hours_sunday) && <div className="flex items-start gap-3 border border-slate-200 rounded-xl p-4">
            <Clock className="w-5 h-5 text-brand-accent mt-0.5" />
            <div>
              <div className="text-xs text-slate-500">Hours</div>
              {settings?.hours_mon_fri && <div className="text-sm text-slate-800">Mon-Fri: {settings.hours_mon_fri}</div>}
              {settings?.hours_saturday && <div className="text-sm text-slate-800">Sat: {settings.hours_saturday}</div>}
              {settings?.hours_sunday && <div className="text-sm text-slate-800">Sun: {settings.hours_sunday}</div>}
            </div>
          </div>}
          {settings?.show_business_address_publicly && (
            <div className="flex items-start gap-3 border border-slate-200 rounded-xl p-4">
              <MapPin className="w-5 h-5 text-brand-accent mt-0.5" />
              <div><div className="text-xs text-slate-500">Address</div><div className="text-sm text-slate-800">{settings?.address_line_1}, {settings?.address_city}, {settings?.address_state} {settings?.address_zip}</div></div>
            </div>
          )}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <h2 className="font-semibold text-slate-900">{isCustomApparel ? 'Have a project in mind?' : 'Need service?'}</h2>
          <p className="mt-1 text-sm text-slate-600">{isCustomApparel ? 'Send the project type, quantity, timing, artwork status, and reference files so Sew Suite can review the quote.' : "The fastest way to get help is to book online. Tell us what's going on and we'll review it before your appointment."}</p>
          <Link to="/book-service" className="mt-4 inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent"><Calendar className="w-4 h-4" /> {isCustomApparel ? 'Request a Quote' : 'Book Service'}</Link>
        </div>
      </section>
    </div>
  );
}