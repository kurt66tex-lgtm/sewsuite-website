import { CheckCircle2, Circle, ExternalLink, ShieldCheck, Star } from 'lucide-react';
import AddOnOffer from './AddOnOffer';
import TabReviews from './TabReviews';
import ReputationOverview from '@/components/admin/ReputationOverview';

function Step({ done, title, children }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />}
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">{children}</div>
      </div>
    </div>
  );
}

export default function TabReputationManagement({ settings, update, addOn }) {
  const rep = addOn?.reputation || {};
  const agency = addOn?.agency || {};
  const features = [
    'Automatic review requests after eligible completed jobs',
    'One timed reminder with duplicate/request safeguards',
    'Google review monitoring and CRM review dashboard',
    'AI-written response drafts with agency/client approval workflow',
    'Post approved replies back to Google',
    'Low-rating alerts and attention queue',
    'Approve selected reviews for the public website',
    'Track review-request conversion and response activity'
  ];

  if (!rep.enabled) {
    return <AddOnOffer
      title="Reputation Management"
      summary={rep.offer_summary}
      monthlyFee={rep.monthly_fee}
      agency={agency}
      features={features}
    />;
  }

  const agencyAccount = agency.email || 'the agency Google account provided by your administrator';

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-brand-accent" />
              <h2 className="font-bold text-slate-900">Reputation Management Setup</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Complete the connection once. After that, the review workflow operates from the CRM.</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">ADD-ON ACTIVE</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Step done={rep.google_connection_ready} title="Google Business Profile">
            {rep.google_connection_ready ? 'Google review synchronization is connected.' : 'Client access and agency OAuth/account setup are still required.'}
          </Step>
          <Step done={rep.review_url_configured} title="Google review link">
            {rep.review_url_configured ? 'The direct review link is stored in Business Settings.' : 'Add the business’s direct Google review link below.'}
          </Step>
          <Step done={rep.review_request_ready} title="Automated requests">
            {rep.review_request_ready ? 'Email review requests are configured and enabled.' : 'Configure the request schedule and enable the email channel below when ready.'}
          </Step>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-700" />
          <h2 className="font-bold text-slate-900">Client setup instructions</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">These are the steps the business owner completes on Google before the agency turns on live synchronization.</p>

        <ol className="mt-5 space-y-4">
          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">1. Confirm the correct Google Business Profile</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Sign in with the Google account that owns or manages the business. Confirm the profile is verified and the business name, address/service-area configuration, phone, website and hours are correct.</p>
            <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/business/" target="_blank" rel="noopener noreferrer">Open Google Business Profile Help <ExternalLink className="h-3 w-3" /></a>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">2. Give the agency access to the Business Profile</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">In the Business Profile, open Business Profile settings → People and access. Add <strong>{agencyAccount}</strong> as a Manager unless the agency asks for a different access level. Do not transfer primary ownership.</p>
            <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/business/answer/3403100" target="_blank" rel="noopener noreferrer">Google instructions for owners and managers <ExternalLink className="h-3 w-3" /></a>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">3. Get the direct Google review link</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">From the Business Profile, use the “Ask for reviews” / “Get more reviews” option and copy the direct review link. Paste that link into the Review Configuration section below, or send it to the agency.</p>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">4. The agency completes the API connection</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">The agency authorizes its Google Business Profile integration, selects the correct account and location IDs, and performs the first review synchronization. Google OAuth credentials and refresh tokens stay server-side and are never exposed in Business Settings.</p>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">5. Test before automation is enabled</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">The agency verifies that reviews import correctly, drafts one test response, and confirms the approval/posting workflow. Auto-post remains optional and should stay off until the client and agency are comfortable with the workflow.</p>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">6. Turn on completed-job review requests</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Configure the initial delay, reminder delay and templates below. Review eligibility is based on completed-service rules—not predicted satisfaction or star rating—so the workflow does not review-gate customers.</p>
          </li>
        </ol>
      </section>

      <TabReviews settings={settings} update={update} />
      <ReputationOverview />
    </div>
  );
}
