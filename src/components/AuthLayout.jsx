import React from "react";
import { Link } from "react-router-dom";
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { settings } = useBusinessSettings();
  const businessName = settings?.business_name || 'Service Business';
  const logoUrl = settings?.logo_reversed_url || settings?.logo_url || null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <div className="bg-brand-dark px-3 py-2 rounded-lg inline-flex items-center justify-center">
              {logoUrl ? <img src={logoUrl} alt={businessName} className="w-[140px] h-auto object-contain" /> : <span className="font-black text-white">{businessName}</span>}
            </div>
          </Link>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-accent mb-3">
            <Icon className="w-6 h-6 text-brand-dark" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-heading">{title}</h1>
          {subtitle && <p className="text-slate-400 mt-1.5 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-700 p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-slate-400 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}