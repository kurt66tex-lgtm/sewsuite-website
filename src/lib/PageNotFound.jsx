import { Link } from 'react-router-dom';
import { Phone, Calendar, Home } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';


export default function PageNotFound() {
  const { settings } = useBusinessSettings();
  const businessName = settings?.business_name || 'Service Business';
  const phone = settings?.phone || '';
  const logoUrl = settings?.logo_reversed_url || settings?.logo_url || null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brand-light">
      <div className="max-w-lg w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-brand-dark px-3 py-2 rounded-lg">
            {logoUrl ? <img src={logoUrl} alt={businessName} className="w-[140px] h-auto object-contain" /> : <span className="font-black text-white">{businessName}</span>}
          </div>
        </div>
        <h1 className="text-7xl font-black text-brand-dark">404</h1>
        <div className="h-1 w-16 bg-brand-accent mx-auto my-4 rounded-full" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Page Not Found</h2>
        <p className="text-slate-600 leading-relaxed mb-8">
          The page you're looking for doesn't exist. It may have been moved or removed.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-dark font-bold px-5 py-3 rounded-lg bg-brand-accent hover:bg-brand-accent-dark transition-colors">
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link to="/book-service" className="inline-flex items-center gap-2 text-brand-dark font-bold px-5 py-3 rounded-lg border-2 border-slate-300 hover:border-brand-accent transition-colors">
            <Calendar className="w-4 h-4" /> Book Service
          </Link>
          {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 text-brand-dark font-bold px-5 py-3 rounded-lg border-2 border-slate-300 hover:border-brand-accent transition-colors">
            <Phone className="w-4 h-4" /> {phone}
          </a>}
        </div>
      </div>
    </div>
  );
}