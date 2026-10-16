import { CheckCircle2, Circle, ExternalLink, Search, ShieldCheck } from 'lucide-react';
import AddOnOffer from './AddOnOffer';
import GoogleLocalLeadsOverview from '@/components/admin/GoogleLocalLeadsOverview';
import GoogleLocalServicesCampaignManager from '@/components/admin/GoogleLocalServicesCampaignManager';

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

export default function TabGoogleLocalServices({ settings, addOn }) {
  const glsa = addOn?.glsa || {};
  const agency = addOn?.agency || {};
  const features = [
    'Import Google Local Services leads into the CRM automatically',
    'Track charged, booked, completed and credited leads',
    'Measure cost per lead, cost per booked job and completed-job value',
    'Track response time and Local Services conversations/calls',
    'Submit lead-quality feedback and monitor Google credit decisions',
    'Manage supported campaign status, budget and bidding settings',
    'Manage ad schedules, service/job types and location targeting',
    'AI recommendations based on real CRM outcomes and advertising performance'
  ];

  if (!glsa.enabled) {
    return <AddOnOffer
      title="Google Local Services Management"
      summary={glsa.offer_summary}
      monthlyFee={glsa.monthly_fee}
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
              <Search className="h-5 w-5 text-brand-accent" />
              <h2 className="font-bold text-slate-900">Google Local Services Management Setup</h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">Once Google access is connected, Local Services leads and supported campaign controls can be managed from the CRM.</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">ADD-ON ACTIVE</span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Step done={glsa.connection_ready} title="Google Ads / LSA connection">
            {glsa.connection_ready ? 'OAuth, developer token and the client Customer ID are configured.' : 'Google access or the client Google Ads Customer ID still needs to be configured.'}
          </Step>
          <Step done={glsa.auto_sync_enabled} title="Automatic lead sync">
            {glsa.auto_sync_enabled ? 'Scheduled Local Services lead import is enabled.' : 'The agency can test with manual sync before enabling automatic import.'}
          </Step>
          <Step done={glsa.campaign_management_enabled} title="Campaign management">
            {glsa.campaign_management_enabled ? 'Supported campaign controls are available in this tab.' : 'Campaign management is disabled by the Agency Owner.'}
          </Step>
          <Step done={glsa.ai_optimization_enabled} title="AI optimization">
            {glsa.ai_optimization_enabled ? 'Performance recommendations can be generated from CRM and ad data.' : 'AI optimization is disabled by the Agency Owner.'}
          </Step>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-700" />
          <h2 className="font-bold text-slate-900">Client setup instructions</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">The business completes these Google steps first. The agency handles the API connection, CRM sync and optimization after access is granted.</p>

        <ol className="mt-5 space-y-4">
          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">1. Confirm the Google Business Profile is verified and accurate</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">The business name, address or service-area configuration, phone and website should match the real business. Google uses verified Business Profile information during Local Services setup, and some business details flow from the Business Profile into Local Services.</p>
            <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/15683105" target="_blank" rel="noopener noreferrer">Google: Business Profile and Local Services details <ExternalLink className="h-3 w-3" /></a>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">2. Create or open the Local Services Ads account</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">From the Google Business Profile, choose the Advertise / Local Services option when available, or open the existing Local Services Ads account. Select the correct business, industry and operating area.</p>
            <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/7549347" target="_blank" rel="noopener noreferrer">Google Local Services overview <ExternalLink className="h-3 w-3" /></a>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">3. Complete Google screening and business verification</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Finish every item Google requests. Depending on the industry and market, this can include business verification, licenses, insurance and other screening requirements. The person completing the checks should also be an owner or manager of the matching Business Profile.</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/6230381" target="_blank" rel="noopener noreferrer">Qualification requirements <ExternalLink className="h-3 w-3" /></a>
              <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/11455354" target="_blank" rel="noopener noreferrer">License / insurance upload help <ExternalLink className="h-3 w-3" /></a>
            </div>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">4. Finish the Local Services profile and budget</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Set the real services/job types, service areas, business hours, ad schedule, photos, business bio/highlights, messaging preference, bidding mode and budget. Only advertise services and areas the business can actually handle. Keep the profile complete because reviews, responsiveness and profile quality affect performance.</p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/7435507" target="_blank" rel="noopener noreferrer">Edit Local Services business information <ExternalLink className="h-3 w-3" /></a>
              <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/12491364" target="_blank" rel="noopener noreferrer">Services and service areas <ExternalLink className="h-3 w-3" /></a>
              <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/10125017" target="_blank" rel="noopener noreferrer">Bidding options <ExternalLink className="h-3 w-3" /></a>
            </div>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">5. Give the agency access</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Add <strong>{agencyAccount}</strong> to the Local Services / Google Ads account with the access level requested by the agency, or link the account to the agency’s Google Ads manager account (MCC). Do not share passwords. Google account access and the payments profile are separate; billing/payment access is not needed unless the agency is specifically managing billing.</p>
            <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600" href="https://support.google.com/localservices/answer/7652468" target="_blank" rel="noopener noreferrer">Google Local Services account access <ExternalLink className="h-3 w-3" /></a>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">6. Send the Google Ads Customer ID to the agency</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Provide the 10-digit Google Ads Customer ID associated with the Local Services account. If the agency uses a manager account, the agency will also configure its MCC / Login Customer ID. The client does not enter API credentials or developer tokens.</p>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">7. Agency performs the first manual sync and CRM test</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">RRS verifies that Local Services leads, charge status and conversations import correctly, confirms a lead lands in the normal CRM Inbox, and checks lead-to-job attribution before automatic hourly sync is enabled.</p>
          </li>

          <li className="rounded-lg border border-slate-200 p-4">
            <div className="font-bold text-slate-900">8. Enable lead feedback and campaign optimization after validation</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">Once real leads are flowing correctly, the agency can enable Google lead-quality feedback, campaign management and AI optimization. Live Google changes require Agency Owner approval by default. Google—not the CRM—makes the final decision on lead credits.</p>
          </li>
        </ol>

        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
          <strong>Important:</strong> The Google Ads API can manage supported settings on an existing Local Services campaign, but the initial Local Services campaign, verification and underlying ad/profile must first be created in Google. Some business-detail changes can also require additional Google verification or support.
        </div>
      </section>

      <GoogleLocalLeadsOverview />
      <GoogleLocalServicesCampaignManager />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">What RRS manages after setup</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            'Lead import, CRM follow-up and lead-to-job attribution',
            'Response-time, booking-rate, cost and completed-job value reporting',
            'Lead-quality feedback and Google credit-decision tracking',
            'Budget, campaign status and supported bidding changes',
            'Ad schedule, service/job-type and location targeting changes',
            'AI optimization recommendations using real CRM outcomes',
            'Review/reputation signals through the Reputation Management add-on',
            'Agency approval and change control before live Google updates'
          ].map(x => <div key={x} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />{x}</div>)}
        </div>
      </section>
    </div>
  );
}
