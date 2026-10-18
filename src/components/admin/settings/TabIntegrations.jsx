import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

function IntegrationRow({ name, status, detail }) {
  const connected = status === 'connected';
  const warning = status === 'warning';
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <div className="font-medium text-slate-900 text-sm">{name}</div>
        {detail && <div className="text-xs text-slate-500">{detail}</div>}
      </div>
      <div className="flex items-center gap-1.5">
        {connected ? (
          <><CheckCircle2 className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-600">Connected</span></>
        ) : warning ? (
          <><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-600">Partial</span></>
        ) : (
          <><XCircle className="w-4 h-4 text-slate-300" /><span className="text-xs text-slate-400">Not configured</span></>
        )}
      </div>
    </div>
  );
}

export default function TabIntegrations({ settings }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h2 className="font-bold text-brand-dark">Integrations</h2>
          <p className="text-xs text-slate-500">Connection status for external services.</p>
        </div>
        <IntegrationRow
          name="Website Lead Email"
          status={settings.lead_notification_email ? 'connected' : 'not_configured'}
          detail={settings.lead_notification_email ? `Built-in email delivery → ${settings.lead_notification_email}` : 'Set the lead notification email in the Chat Assistant tab'}
        />
        <IntegrationRow name="SMS Provider" status="not_configured" detail="Not enabled. Connect an SMS provider before turning on SMS notifications." />
        <IntegrationRow
          name="Google Analytics 4"
          status={settings.ga4_id ? 'connected' : 'not_configured'}
          detail={settings.ga4_id ? `ID: ${settings.ga4_id}` : 'Set GA4 ID in SEO & Analytics tab'}
        />
        <IntegrationRow
          name="Google Business Profile"
          status={settings.google_business_profile_url ? 'connected' : 'not_configured'}
          detail={settings.google_business_profile_url ? 'URL configured' : 'Set URL in SEO & Analytics tab'}
        />
        <IntegrationRow name="Google Calendar" status="not_configured" detail="Not connected" />
        <IntegrationRow name="Google Review URL" status={settings.google_review_url ? 'connected' : 'not_configured'} detail={settings.google_review_url ? 'Configured' : 'Set in Reviews tab'} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-dark mb-2">Need More Integrations?</h2>
        <p className="text-sm text-slate-500">Additional integrations (calendar sync, accounting, CRM sync) can be configured as your business grows. Contact your administrator to set up new connections.</p>
      </div>
    </div>
  );
}