import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import BrandTheme from '@/components/BrandTheme';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here
import SiteLayout from '@/components/site/SiteLayout';
import AdminLayout from '@/components/admin/AdminLayout';
import Home from '@/pages/Home';
import ApplianceRepair from '@/pages/ApplianceRepair';
import Services from '@/pages/Services';
import ServiceTypeDetail from '@/pages/ServiceTypeDetail';
import BookService from '@/pages/BookService';
import ServiceAreas from '@/pages/ServiceAreas';
import ServiceAreaDetail from '@/pages/ServiceAreaDetail';
import Brands from '@/pages/Brands';
import Reviews from '@/pages/Reviews';
import FAQs from '@/pages/FAQs';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import OurWork from '@/pages/OurWork';
import PortfolioDetail from '@/pages/PortfolioDetail';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import QuoteReview from '@/pages/QuoteReview';
import ProofReview from '@/pages/ProofReview';
import WhyUs from '@/pages/WhyUs';
import Dashboard from '@/pages/admin/Dashboard';
import Inbox from '@/pages/admin/Inbox';
import Conversations from '@/pages/admin/Conversations';
import Customers from '@/pages/admin/Customers';
import Jobs from '@/pages/admin/Jobs';
import ReviewQueue from '@/pages/admin/ReviewQueue';
import BrandsAdmin from '@/pages/admin/BrandsAdmin';
import ServiceAreasAdmin from '@/pages/admin/ServiceAreasAdmin';
import Calendar from '@/pages/admin/Calendar';
import TechnicianView from '@/pages/admin/TechnicianView';
import ServiceLocations from '@/pages/admin/ServiceLocations';
import Appliances from '@/pages/admin/Appliances';
import Reports from '@/pages/admin/Reports';
import Settings from '@/pages/admin/Settings';
import TeamAccess from '@/pages/admin/TeamAccess';
import AgencyControls from '@/pages/admin/AgencyControls';
import AgencyClients from '@/pages/admin/AgencyClients';
import PortfolioManager from '@/pages/admin/PortfolioManager';
import PermissionGate from '@/components/admin/PermissionGate';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Public website */}
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/branded-apparel" element={<Navigate to="/services/corporate-apparel" replace />} />
        <Route path="/services/hats-and-caps" element={<Navigate to="/services/custom-hats-caps" replace />} />
        <Route path="/services/corporate-gifts" element={<Navigate to="/services/specialty-promotional-items" replace />} />
        <Route path="/services/team-uniforms" element={<Navigate to="/services/team-school-apparel" replace />} />
        <Route path="/services/:slug" element={<ServiceTypeDetail />} />
        <Route path="/appliance-repair" element={<ApplianceRepair />} />
        <Route path="/appliance-repair/:slug" element={<ServiceTypeDetail />} />
        <Route path="/book-service" element={<BookService />} />
        <Route path="/service-areas" element={<ServiceAreas />} />
        <Route path="/service-areas/:slug" element={<ServiceAreaDetail />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/about" element={<About />} />
        <Route path="/why-us" element={<WhyUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<Navigate to="/our-work" replace />} />
        <Route path="/our-work" element={<OurWork />} />
        <Route path="/our-work/:slug" element={<PortfolioDetail />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>

      {/* Tokenized customer quote review — intentionally outside the normal site layout */}
      <Route path="/quote/:token" element={<QuoteReview />} />
      <Route path="/proof/:token" element={<ProofReview />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin / CRM — protected */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/admin" replace />} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<PermissionGate permission="dashboard"><Dashboard /></PermissionGate>} />
          <Route path="inbox" element={<PermissionGate permission="inbox"><Inbox /></PermissionGate>} />
          <Route path="leads" element={<Navigate to="/admin/inbox" replace />} />
          <Route path="conversations" element={<PermissionGate permission="inbox"><Conversations /></PermissionGate>} />
          <Route path="customers" element={<PermissionGate permission="customers"><Customers /></PermissionGate>} />
          <Route path="jobs" element={<PermissionGate permission="jobs"><Jobs /></PermissionGate>} />
          <Route path="reviews" element={<PermissionGate permission="reviews"><ReviewQueue /></PermissionGate>} />
          <Route path="portfolio" element={<PermissionGate permission="business_settings"><PortfolioManager /></PermissionGate>} />
          <Route path="brands" element={<PermissionGate permission="agency_settings"><BrandsAdmin /></PermissionGate>} />
          <Route path="service-areas" element={<PermissionGate permission="agency_settings"><ServiceAreasAdmin /></PermissionGate>} />
          <Route path="calendar" element={<PermissionGate permission="schedule"><Calendar /></PermissionGate>} />
          <Route path="technician" element={<PermissionGate permission="technician"><TechnicianView /></PermissionGate>} />
          <Route path="service-locations" element={<PermissionGate permission="customers"><ServiceLocations /></PermissionGate>} />
          <Route path="appliances" element={<PermissionGate permission="customers"><Appliances /></PermissionGate>} />
          <Route path="reports" element={<PermissionGate permission="reports"><Reports /></PermissionGate>} />
          <Route path="access" element={<PermissionGate permission="team_access"><TeamAccess /></PermissionGate>} />
          <Route path="settings" element={<PermissionGate permission="business_settings"><Settings /></PermissionGate>} />
          <Route path="clients" element={<PermissionGate permission="agency_controls"><AgencyClients /></PermissionGate>} />
          <Route path="agency" element={<PermissionGate permission="agency_controls"><AgencyControls /></PermissionGate>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <BrandTheme />
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App