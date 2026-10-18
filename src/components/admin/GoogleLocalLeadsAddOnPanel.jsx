import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, Loader2, RefreshCw, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function Toggle({ label, checked, onChange, hint }) {
  return <label className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
    <input type="checkbox" className="mt-1" checked={!!checked} onChange={e => onChange(e.target.checked)} />
    <span>
      <span className="block text-sm font-semibold text-slate-800">{label}</span>
      {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
    </span>
  </label>;
}

function Field({ label, value, onChange, type='text', hint, placeholder }) {
  return <label className="block">
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      placeholder={placeholder}
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
    />
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>;
}

function StatusCard({ label, ready, detail }) {
  return <div className={'rounded-lg border p-3 ' + (ready ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
    <div className="flex items-center gap-2">
      {ready ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <AlertTriangle className="w-4 h-4 text-amber-700" />}
      <span className={'text-sm font-bold ' + (ready ? 'text-green-800' : 'text-amber-800')}>{label}</span>
    </div>
    <div className="text-xs text-slate-600 mt-1">{detail}</div>
  </div>;
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-lg font-black text-slate-900 mt-0.5">{value}</div>
  </div>;
}

const money = v => '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });

export default function GoogleLocalLeadsAddOnPanel({ control, update }) {
  const [dashboard, setDashboard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const enabled = control.google_local_leads_enabled === true;
  const billing = control.google_local_leads_billing_enabled !== false;
  const fee = Math.max(0, Number(control.google_local_leads_monthly_fee || 0));

  const load = async () => {
    try {
      const res = await base44.functions.invoke('getGoogleLocalLeadsDashboard', { days:30 });
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setDashboard(d);
    } catch (e) {
      setError(e.message || 'Unable to load Google Local Services status.');
    }
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await base44.functions.invoke('syncGoogleLocalLeads', { days:30, manual:true });
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setNotice(d.skipped ? d.reason : `Sync complete: ${d.leads_created || 0} new Google lead(s), ${d.leads_updated || 0} updated, ${d.crm_leads_created || 0} new CRM lead(s).`);
      await load();
    } catch (e) {
      setError(e.message || 'Google Local Services lead sync failed.');
    } finally {
      setBusy(false);
    }
  };

  const runtime = dashboard?.runtime || {};
  const metrics = dashboard?.metrics || {};

  return <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <Search className="w-5 h-5 text-brand-accent mt-0.5" />
        <div>
          <h2 className="font-bold text-slate-900">Google Local Services Management Add-On</h2>
          <p className="text-xs text-slate-500">Agency-managed Local Services leads, ROI attribution, lead feedback, campaign controls, and AI optimization.</p>
        </div>
      </div>
      <button onClick={sync} disabled={busy || !enabled} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync Now
      </button>
    </div>

    <div className="p-5 space-y-6">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

      <div>
        <h3 className="font-bold text-sm text-slate-900 mb-3">Service & Billing</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Toggle label="Google Local Services Management Enabled" checked={enabled} onChange={v => update('google_local_leads_enabled', v)} hint="Master service switch. Existing imported lead and performance history is preserved when disabled." />
          <Toggle label="Bill Client Monthly" checked={billing} onChange={v => update('google_local_leads_billing_enabled', v)} hint="Turn OFF for a trial or promotion while keeping the service active." />
          <Field label="Monthly Management Fee" type="number" value={fee} onChange={v => update('google_local_leads_monthly_fee', v)} hint="Added as a separate agency invoice line item when enabled and billable." />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Next Monthly Charge</div>
            <div className="text-xl font-black text-slate-900">{enabled && billing ? money(fee) : '$0.00'}</div>
            <div className="text-[11px] text-slate-500 mt-1">{enabled ? (billing ? 'Billable management service' : 'Service active — promotional/no charge') : 'Service disabled'}</div>
          </div>
        </div>
        <label className="block mt-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1">Client-Facing Add-On Description</span>
          <textarea
            rows={3}
            value={control.google_local_services_offer_summary || 'Manage Google Local Services leads from the CRM, measure lead-to-job ROI, submit lead-quality feedback, monitor credits, manage supported campaign settings, and use AI recommendations to improve performance.'}
            onChange={e => update('google_local_services_offer_summary', e.target.value)}
            placeholder="Explain the value of the Google Local Services Management add-on."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <span className="block mt-1 text-[11px] text-slate-400">Shown in the client's Business Settings tab when the add-on is not active.</span>
        </label>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Management Features</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Toggle
            label="Campaign Management"
            checked={control.google_local_services_campaign_management_enabled !== false}
            onChange={v => update('google_local_services_campaign_management_enabled', v)}
            hint="Allow supported budget, status, bidding, schedule, location and service targeting controls."
          />
          <Toggle
            label="AI Optimization"
            checked={control.google_local_services_ai_optimization_enabled !== false}
            onChange={v => update('google_local_services_ai_optimization_enabled', v)}
            hint="Generate recommendations from real Local Services and CRM outcomes."
          />
          <Toggle
            label="Agency Approval Required"
            checked={control.google_local_services_agency_approval_required !== false}
            onChange={v => update('google_local_services_agency_approval_required', v)}
            hint="Recommended ON. Client users can review recommendations, but live Google changes require Agency Owner approval."
          />
        </div>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Google Ads / Local Services Connection</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Google Ads Customer ID" value={control.google_ads_customer_id || ''} onChange={v => update('google_ads_customer_id', v)} placeholder="1234567890" hint="Digits only. The client Google Ads account that owns the Local Services leads." />
          <Field label="Manager / Login Customer ID" value={control.google_ads_login_customer_id || ''} onChange={v => update('google_ads_login_customer_id', v)} placeholder="Optional MCC ID" hint="Use when the API connection authenticates through an agency manager account." />
          <Toggle label="Automatic Local Services Lead Sync" checked={control.google_local_leads_auto_sync_enabled === true} onChange={v => update('google_local_leads_auto_sync_enabled', v)} hint="Scheduled workflow checks hourly; it safely does nothing when disabled." />
          <Toggle label="New Lead Alerts" checked={control.google_local_leads_alerts_enabled !== false} onChange={v => update('google_local_leads_alerts_enabled', v)} hint="Imported leads flow to the CRM and normal lead follow-up process." />
          <Toggle label="Manual Sync Allowed" checked={control.google_local_leads_manual_sync_allowed !== false} onChange={v => update('google_local_leads_manual_sync_allowed', v)} />
          <Toggle label="Google Lead-Quality Feedback" checked={control.google_local_leads_feedback_enabled === true} onChange={v => update('google_local_leads_feedback_enabled', v)} hint="Send qualified lead outcomes back to Google after live validation. Google makes the final credit decision." />
        </div>

        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <StatusCard
            ready={runtime.ready && runtime.customer_id_configured}
            label={runtime.ready && runtime.customer_id_configured ? 'Google Ads Runtime — Ready' : 'Google Ads Runtime — Connection Required'}
            detail={runtime.ready && runtime.customer_id_configured
              ? `OAuth, developer token, and customer account are configured. API ${runtime.api_version || ''}.`
              : 'Requires GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN, GOOGLE_ADS_DEVELOPER_TOKEN, and a client Customer ID.'}
          />
          <StatusCard
            ready={enabled && control.google_local_leads_auto_sync_enabled === true && runtime.ready && runtime.customer_id_configured}
            label={control.google_local_leads_auto_sync_enabled ? 'Automated Local Services Import — Configured' : 'Automated Local Services Import — Off'}
            detail={dashboard?.add_on?.last_sync_at ? 'Last successful sync: ' + new Date(dashboard.add_on.last_sync_at).toLocaleString() : 'No Google Local Services lead sync has completed yet.'}
          />
        </div>
      </div>

      <div className="border-t pt-5">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-slate-700" />
          <h3 className="font-bold text-sm text-slate-900">Last 30 Days — Attribution Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Metric label="Google Leads" value={metrics.leads ?? 0} />
          <Metric label="Charged Leads" value={metrics.charged_leads ?? 0} />
          <Metric label="Booked" value={metrics.booked_leads ?? 0} />
          <Metric label="Completed" value={metrics.completed_jobs ?? 0} />
          <Metric label="Ad Spend" value={money(metrics.ad_spend)} />
          <Metric label="Cost / Lead" value={money(metrics.cost_per_lead)} />
          <Metric label="Completed Job Value" value={money(metrics.attributed_completed_job_value)} />
          <Metric label="Value / Spend" value={(metrics.value_to_spend_ratio ?? 0) + '×'} />
        </div>
        <p className="text-[11px] text-slate-500 mt-3">Advertising charges remain between Google and the client. RRS billing is the separate management add-on above. Completed Job Value currently uses the CRM job estimate amount when available; actual collected revenue can replace it when client accounting/payment integration is added.</p>
      </div>

      <div className="border-t pt-5">
        <label className="block">
          <span className="block text-xs font-semibold text-slate-600 mb-1">Agency Management Notes</span>
          <textarea rows={3} value={control.google_local_leads_management_notes || ''} onChange={e => update('google_local_leads_management_notes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </label>
      </div>
    </div>
  </section>;
}
