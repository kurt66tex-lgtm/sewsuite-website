import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';

// Customer-facing Base44 credentials are not supported by the independent
// website. Staff and agency Microsoft sign-in lives only on the protected CRM.
export const SEW_SUITE_STAFF_LOGIN = 'https://sewsuite-production-crm.vercel.app/login';

export default function Login() {
  useEffect(() => {
    window.location.replace(SEW_SUITE_STAFF_LOGIN);
  }, []);

  return (
    <AuthLayout icon={LogIn} title="Staff & Agency Sign In"
      subtitle="Sew Suite now uses Microsoft work accounts for authorized CRM access."
      footer={<Link to="/" className="text-slate-400 hover:text-brand-accent font-medium">Back to website</Link>}>
      <a href={SEW_SUITE_STAFF_LOGIN}
        className="block w-full rounded-md bg-brand-accent px-5 py-3 text-center font-semibold text-brand-dark">
        Continue to Microsoft Sign In
      </a>
      <p className="mt-3 text-center text-xs text-slate-500">
        The previous website password login is no longer supported.
      </p>
    </AuthLayout>
  );
}
