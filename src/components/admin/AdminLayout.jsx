import { useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Star, Settings, ClipboardList, Phone, BarChart3, Inbox, UserCog, LogOut, Building2, Images } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { useAuth } from '@/lib/AuthContext';
import { hasSectionAccess, canManageTeamAccess, canManageBusinessSettings, isAgencyOwner, isClientAdmin, accountLabel } from '@/lib/accessControl';
import { crmVocabulary } from '@/lib/businessModel';

const NAV = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, permission: 'dashboard' },
  { label: 'Clients', to: '/admin/clients', icon: Building2, permission: 'agency_controls' },
  { label: 'Inbox', to: '/admin/inbox', icon: Inbox, permission: 'inbox' },
  { label: 'Schedule', to: '/admin/calendar', icon: Calendar, permission: 'schedule' },
  { label: 'Jobs', to: '/admin/jobs', icon: ClipboardList, permission: 'jobs' },
  { label: 'Customers', to: '/admin/customers', icon: Users, permission: 'customers' },
  { label: 'Reviews', to: '/admin/reviews', icon: Star, permission: 'reviews' },
  { label: 'Portfolio', to: '/admin/portfolio', icon: Images, permission: 'business_settings', portfolioOnly: true },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, permission: 'reports' },
  { label: 'Team & Access', to: '/admin/access', icon: UserCog, permission: 'team_access' },
  { label: 'Business Settings', to: '/admin/settings', icon: Settings, permission: 'business_settings' },
  { label: 'Agency Controls', to: '/admin/agency', icon: Settings, permission: 'agency_controls' }
];

export default function AdminLayout() {
  const location = useLocation();
  const { settings } = useBusinessSettings();
  const { user, logout } = useAuth();
  const phone = settings?.phone || '';
  const businessName = settings?.business_name || 'Client';
  const adminLogo = settings?.logo_reversed_url || settings?.logo_url || null;
  const businessInitial = businessName.trim().charAt(0).toUpperCase() || 'C';
  const isTechnicianPage = location.pathname === '/admin/technician';
  const userRole = user?.role || 'user';
  const isTechnician = userRole === 'technician';
  const clientAdmin = isClientAdmin(user);
  const agencyOwner = isAgencyOwner(user);
  const terms = crmVocabulary(settings);
  const isFieldService = (settings?.business_model || 'field_service') === 'field_service';
  const visibleNav = NAV.filter(n => {
    if (n.to === '/admin/calendar' && !isFieldService) return false;
    if (n.portfolioOnly && settings?.portfolio_enabled !== true) return false;
    if (n.permission === 'team_access') return canManageTeamAccess(user);
    if (n.permission === 'business_settings') return canManageBusinessSettings(user);
    if (n.permission === 'agency_controls') return agencyOwner;
    if (n.permission === 'agency_settings') return agencyOwner;
    return hasSectionAccess(user, n.permission);
  }).map(n => n.to === '/admin/jobs' ? { ...n, label: terms.workPlural } : n);
  const noCrmAccess = userRole === 'user' || (userRole === 'office' && !clientAdmin && user?.crm_enabled !== true);

  // Noindex for all CRM/admin routes
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  if (noCrmAccess) {
    return <Navigate to="/" replace />;
  }

  // Technicians can only access the Technician View — redirect all other admin pages
  if (isTechnician && !isTechnicianPage) {
    return <Navigate to="/admin/technician" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar — hidden for technicians (they only see Technician View) */}
      {!isTechnician && (
      <aside className="hidden lg:flex w-60 flex-col bg-brand-dark text-slate-200 fixed inset-y-0">
        <div className="px-5 py-4 border-b border-slate-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg font-bold bg-brand-accent text-brand-dark overflow-hidden">
              {adminLogo ? <img src={adminLogo} alt="" className="w-full h-full object-contain p-0.5" /> : businessInitial}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{`${businessName} CRM`}</div>
              <div className="text-[10px] text-slate-400">{accountLabel(user)}</div>
            </div>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {visibleNav.map(n => {
            const active = location.pathname === n.to || (n.to !== '/admin' && location.pathname.startsWith(n.to));
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-3 px-5 py-2.5 text-sm ${active ? 'bg-white/10 text-white border-l-2 border-brand-accent' : 'hover:bg-white/5'}`}>
                <n.icon className="w-4 h-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-slate-700 text-xs space-y-2">
          <div className="text-[11px] text-slate-500 truncate" title={user?.email || ''}>{user?.email || ''}</div>
          {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 text-slate-300"><Phone className="w-3.5 h-3.5" /> {phone}</a>}
          <Link to="/" className="block text-slate-400 hover:text-white">← View public site</Link>
          <button onClick={() => logout('/login?returnTo=/admin')} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </aside>
      )}

      {/* Mobile top nav — hidden for technicians and on technician page */}
      {!isTechnicianPage && !isTechnician && (
        <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-brand-dark text-white">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/admin" className="font-bold text-sm">{`${businessName} CRM`}</Link>
            <div className="flex items-center gap-3">
              <Link to="/" className="text-xs text-slate-300">View site</Link>
              <button onClick={() => logout('/login?returnTo=/admin')} className="text-xs text-slate-300 inline-flex items-center gap-1">
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-1 px-2 pb-2">
            {visibleNav.map(n => (
              <Link key={n.to} to={n.to} className={`flex-shrink-0 text-xs px-3 py-1.5 rounded ${location.pathname === n.to ? 'bg-white/20' : 'text-slate-300'}`}>{n.label}</Link>
            ))}
          </div>
        </div>
      )}

      <main className={`flex-1 ${isTechnician ? 'lg:ml-0' : 'lg:ml-60'} ${isTechnicianPage ? 'pt-0 lg:pt-0' : 'pt-20 lg:pt-0'}`}>
        <Outlet />
      </main>
    </div>
  );
}