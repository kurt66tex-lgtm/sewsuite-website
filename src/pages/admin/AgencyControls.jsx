import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, DollarSign, Download, ExternalLink, Eye, Globe2, Loader2, Mail, Plus, ReceiptText, Save, Send, Trash2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { viewAgencyInvoicePdf, downloadAgencyInvoicePdf } from '@/lib/agencyInvoicePdf';
import ProvisioningPanel from '@/components/admin/ProvisioningPanel';
import VoiceAIAddOnPanel from '@/components/admin/VoiceAIAddOnPanel';
import ReputationManagementAddOnPanel from '@/components/admin/ReputationManagementAddOnPanel';
import GoogleLocalLeadsAddOnPanel from '@/components/admin/GoogleLocalLeadsAddOnPanel';
import SeoLaunchPackPanel from '@/components/admin/SeoLaunchPackPanel';
import LivePilotReadinessPanel from '@/components/admin/LivePilotReadinessPanel';
import SeoPilotBaselinePanel from '@/components/admin/SeoPilotBaselinePanel';

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function Field({ label, value, onChange, type = 'text', placeholder, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
      />
      {hint && <span className="block mt-1 text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Select({ label, value, onChange, options, hint }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <span className="block mt-1 text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
      <input type="checkbox" className="mt-1" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

export default function AgencyControls() {
  const [control, setControl] = useState(null);
  const [savedControl, setSavedControl] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [voiceUsage, setVoiceUsage] = useState(null);
  const [voiceRuntimeStatus, setVoiceRuntimeStatus] = useState(null);
  const [reputationSummary, setReputationSummary] = useState(null);
  const [reputationRuntimeStatus, setReputationRuntimeStatus] = useState(null);
  const [livePilotReadiness, setLivePilotReadiness] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [noticeForm, setNoticeForm] = useState({ subject: '', message: '' });
  const [activeSection, setActiveSection] = useState('overview');

  const agencySections = [
    ['overview', 'Launch & Readiness'],
    ['seo', 'SEO'],
    ['website', 'Website'],
    ['reputation', 'Reputation'],
    ['google', 'Google Local Services'],
    ['voice', 'AI Phone & Chat'],
    ['billing', 'Billing & Invoices']
  ];

  const call = async (action, payload = {}) => {
    const res = await base44.functions.invoke('manageAgencyAccount', { action, ...payload });
    const data = res?.data || res || {};
    if (data.error) throw new Error(data.error);
    return data;
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await call('get');
      setControl(data.control || {});
      setSavedControl(data.control || {});
      setInvoices(data.invoices || []);
      setNotifications(data.notifications || []);
      setVoiceUsage(data.voice_usage_summary || null);
      setVoiceRuntimeStatus(data.voice_runtime_status || null);
      setReputationSummary(data.reputation_summary || null);
      setReputationRuntimeStatus(data.reputation_runtime_status || null);
      setLivePilotReadiness(data.live_pilot_readiness || null);
      setNoticeForm(f => ({ ...f, recipient_email: data.control?.billing_email || '' }));
    } catch (e) {
      setError(e.message || 'Unable to load agency controls.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const dirty = useMemo(() => control && savedControl && JSON.stringify(control) !== JSON.stringify(savedControl), [control, savedControl]);
  const update = (key, value) => setControl(c => ({ ...c, [key]: value }));

  const saveControl = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await call('update_control', { control });
      setControl(data.control);
      setSavedControl(data.control);
      setNotice('Agency controls saved.');
    } catch (e) {
      setError(e.message || 'Unable to save agency controls.');
    } finally {
      setBusy(false);
    }
  };

  const setSiteStatus = async (status) => {
    if (status !== 'Active' && !window.confirm(`Set the public website to ${status}? The CRM will remain available.`)) return;
    setBusy(true);
    setError('');
    try {
      const data = await call('update_control', { control: { ...control, site_status: status } });
      setControl(data.control);
      setSavedControl(data.control);
      setNotice(status === 'Active' ? 'Public website reactivated.' : `Public website set to ${status}.`);
    } catch (e) {
      setError(e.message || 'Unable to change website status.');
    } finally {
      setBusy(false);
    }
  };

  const addAddon = () => {
    const add_ons = [...(control.add_ons || []), {
      id: 'addon-' + Date.now(),
      name: '',
      description: '',
      unit_price: 0,
      quantity: 1,
      billing_frequency: 'Monthly',
      active: true
    }];
    update('add_ons', add_ons);
  };

  const updateAddon = (idx, patch) => {
    const add_ons = [...(control.add_ons || [])];
    add_ons[idx] = { ...add_ons[idx], ...patch };
    update('add_ons', add_ons);
  };

  const removeAddon = (idx) => update('add_ons', (control.add_ons || []).filter((_, i) => i !== idx));

  const createInvoice = async (scheduled = false) => {
    setBusy(true);
    setError('');
    try {
      if (dirty) await saveControl();
      if (scheduled) {
        await call('generate_scheduled_invoice');
        setNotice('Scheduled invoice generated and the next invoice date advanced.');
      } else {
        await call('create_invoice', { invoice: {} });
        setNotice('Draft invoice created.');
      }
      await load();
    } catch (e) {
      setError(e.message || 'Unable to create invoice.');
    } finally {
      setBusy(false);
    }
  };

  const invoiceAction = async (action, invoiceId) => {
    setBusy(true);
    setError('');
    try {
      await call(action, { invoice_id: invoiceId });
      setNotice(action === 'send_invoice' ? 'Invoice sent.' : action === 'mark_paid' ? 'Invoice marked paid.' : 'Invoice voided.');
      await load();
    } catch (e) {
      setError(e.message || 'Invoice action failed.');
    } finally {
      setBusy(false);
    }
  };

  const sendNotice = async () => {
    setBusy(true);
    setError('');
    try {
      await call('send_billing_notice', {
        recipient_email: noticeForm.recipient_email || control.billing_email,
        subject: noticeForm.subject,
        message: noticeForm.message
      });
      setNotice('Billing notification sent.');
      setNoticeForm(f => ({ ...f, subject: '', message: '' }));
      await load();
    } catch (e) {
      setError(e.message || 'Unable to send billing notification.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading agency controls…</div>;
  if (!control) return <div className="p-8 text-red-600">Agency controls are unavailable.</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Agency Controls</h1>
          <p className="text-sm text-slate-500 mt-1">Agency Owner controls for client access, website availability, pricing, billing, and invoices.</p>
        </div>
        <button onClick={saveControl} disabled={busy || !dirty} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Agency Controls
        </button>
      </div>

      {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {notice && <div className="border border-green-200 bg-green-50 text-green-800 rounded-lg px-4 py-3 text-sm">{notice}</div>}

      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-slate-50/95 backdrop-blur border-y border-slate-200 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {agencySections.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={'whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ' + (activeSection === id
                ? 'border-brand-accent bg-brand-accent text-brand-dark shadow-sm'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100')}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
          <span className="rounded-full bg-white border border-slate-200 px-2 py-1">Site: <strong className="text-slate-700">{control.site_status || 'Setup'}</strong></span>
          <span className="rounded-full bg-white border border-slate-200 px-2 py-1">Google OAuth: <strong className={reputationRuntimeStatus?.google_client_id_configured && reputationRuntimeStatus?.google_client_secret_configured && reputationRuntimeStatus?.google_refresh_token_configured ? 'text-green-700' : 'text-amber-700'}>{reputationRuntimeStatus?.google_client_id_configured && reputationRuntimeStatus?.google_client_secret_configured && reputationRuntimeStatus?.google_refresh_token_configured ? 'Ready' : 'Setup required'}</strong></span>
          <span className="rounded-full bg-white border border-slate-200 px-2 py-1">Reputation sync: <strong className={control.reputation_google_sync_enabled ? 'text-green-700' : 'text-slate-700'}>{control.reputation_google_sync_enabled ? 'On' : 'Off'}</strong></span>
          <span className="rounded-full bg-white border border-slate-200 px-2 py-1">Voice: <strong className={control.voice_ai_enabled ? 'text-green-700' : 'text-slate-700'}>{control.voice_ai_enabled ? 'On' : 'Off'}</strong></span>
        </div>
      </div>

      {activeSection === 'overview' && <>
        <ProvisioningPanel onChanged={load} />
        <LivePilotReadinessPanel readiness={livePilotReadiness} />
      </>}

      {activeSection === 'seo' && <>
        <SeoPilotBaselinePanel />
        <SeoLaunchPackPanel control={control} update={update} />
      </>}

      {activeSection === 'website' && <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Globe2 className="w-5 h-5 text-brand-accent" />
          <div>
            <h2 className="font-bold text-slate-900">Client & Website Control</h2>
            <p className="text-xs text-slate-500">The site switch changes what the domain serves. DNS stays connected, and the CRM remains available.</p>
          </div>
        </div>
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <Field label="Client Name" value={control.client_name} onChange={v => update('client_name', v)} />
          <Field label="Primary Domain" value={control.primary_domain} onChange={v => update('primary_domain', v)} />
          <Select label="Website Status" value={control.site_status} onChange={setSiteStatus} options={['Setup','Active','Maintenance','Suspended']} />
          <div className="flex items-end gap-2">
            <button onClick={() => setSiteStatus('Active')} disabled={busy || control.site_status === 'Active'} className="flex-1 inline-flex justify-center items-center gap-2 border border-green-300 bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40"><CheckCircle2 className="w-4 h-4" /> Activate</button>
            <button onClick={() => setSiteStatus('Suspended')} disabled={busy || control.site_status === 'Suspended'} className="flex-1 inline-flex justify-center items-center gap-2 border border-red-300 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-40"><XCircle className="w-4 h-4" /> Suspend</button>
          </div>
          <Field label="Public Status Heading" value={control.public_status_heading} onChange={v => update('public_status_heading', v)} />
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Public Status Message</span>
            <textarea value={control.public_status_message || ''} onChange={e => update('public_status_message', e.target.value)} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Internal Suspension / Account Notes</span>
            <textarea value={control.suspension_reason_internal || ''} onChange={e => update('suspension_reason_internal', e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>
      </section>}

      {activeSection === 'reputation' && <ReputationManagementAddOnPanel control={control} update={update} summary={reputationSummary} runtimeStatus={reputationRuntimeStatus} />}

      {activeSection === 'google' && <GoogleLocalLeadsAddOnPanel control={control} update={update} />}

      {activeSection === 'voice' && <VoiceAIAddOnPanel control={control} update={update} usageSummary={voiceUsage} runtimeStatus={voiceRuntimeStatus} />}

      {activeSection === 'billing' && <>
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-accent" />
          <div>
            <h2 className="font-bold text-slate-900">Billing Account & Pricing</h2>
            <p className="text-xs text-slate-500">Provider-neutral fields now; later your agency website can connect these records to Stripe, QuickBooks, or another billing provider.</p>
          </div>
        </div>

        <div className="p-5 border-b border-slate-100">
          <div className="mb-3">
            <h3 className="font-bold text-sm text-slate-900">Agency Billing Identity</h3>
            <p className="text-xs text-slate-500">This is the “From” information printed on agency invoices.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Agency Name" value={control.agency_name} onChange={v => update('agency_name', v)} placeholder="Your agency name" />
            <Field label="Agency Billing Email" value={control.agency_email} onChange={v => update('agency_email', v)} type="email" />
            <Field label="Agency Phone" value={control.agency_phone} onChange={v => update('agency_phone', v)} />
            <Field label="Address Line 1" value={control.agency_address_line_1} onChange={v => update('agency_address_line_1', v)} />
            <Field label="Address Line 2" value={control.agency_address_line_2} onChange={v => update('agency_address_line_2', v)} />
            <Field label="Agency Website" value={control.agency_website} onChange={v => update('agency_website', v)} placeholder="https://…" />
            <Field label="City" value={control.agency_city} onChange={v => update('agency_city', v)} />
            <Field label="State" value={control.agency_state} onChange={v => update('agency_state', v)} />
            <Field label="ZIP" value={control.agency_zip} onChange={v => update('agency_zip', v)} />
            <div className="md:col-span-3">
              <Field label="Invoice Footer" value={control.invoice_footer} onChange={v => update('invoice_footer', v)} placeholder="Thank you for your business." />
            </div>
          </div>
        </div>

        <div className="p-5 grid md:grid-cols-3 gap-4">
          <Select label="Billing Status" value={control.billing_status} onChange={v => update('billing_status', v)} options={['Trial','Active','Past Due','Suspended','Canceled']} />
          <Field label="Billing Provider" value={control.billing_provider} onChange={v => update('billing_provider', v)} placeholder="Stripe, QuickBooks, etc." />
          <Field label="External Customer / Account ID" value={control.billing_customer_id} onChange={v => update('billing_customer_id', v)} />
          <div>
            <Field label="Billing / Payment Portal URL" value={control.billing_portal_url} onChange={v => update('billing_portal_url', v)} placeholder="https://…" />
            {control.billing_portal_url && (
              <a
                href={control.billing_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open billing portal
              </a>
            )}
          </div>
          <Field label="Agency Portal Client Key" value={control.agency_portal_client_key} onChange={v => update('agency_portal_client_key', v)} hint="Stable client identifier for your future agency website. This is not a password or API secret." />
          <Field label="Billing Email" value={control.billing_email} onChange={v => update('billing_email', v)} type="email" />
          <Field label="Plan Name" value={control.plan_name} onChange={v => update('plan_name', v)} />
          <Field label="Base Price" value={control.base_price} onChange={v => update('base_price', v)} type="number" />
          <Select label="Billing Frequency" value={control.billing_frequency} onChange={v => update('billing_frequency', v)} options={['Monthly','Quarterly','Annual']} />
          <Field label="Invoice Day" value={control.invoice_day} onChange={v => update('invoice_day', v)} type="number" hint="1–28" />
          <Field label="Next Invoice Date" value={control.next_invoice_date} onChange={v => update('next_invoice_date', v)} type="date" />
          <Field label="Payment Terms (days)" value={control.payment_terms_days} onChange={v => update('payment_terms_days', v)} type="number" />
          <Toggle label="Auto-send generated invoices" checked={control.auto_send_invoices} onChange={v => update('auto_send_invoices', v)} hint="Used when generating the scheduled invoice from this panel." />
          <Toggle label="Billing notification log" checked={control.billing_notifications_enabled} onChange={v => update('billing_notifications_enabled', v)} hint="Records invoice/payment billing events for the future agency portal." />
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            Automatic payment collection is not connected yet. Keep provider credentials out of this app until the agency billing integration is selected.
          </div>
          <label className="block md:col-span-3">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Pricing / Billing Notes</span>
            <textarea value={control.pricing_notes || ''} onChange={e => update('pricing_notes', e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Add-on Pricing</h3>
              <p className="text-xs text-slate-500">Recurring or one-time client add-ons.</p>
            </div>
            <button onClick={addAddon} className="inline-flex items-center gap-1 bg-brand-accent text-brand-dark text-sm font-bold px-3 py-1.5 rounded-lg"><Plus className="w-4 h-4" /> Add Add-on</button>
          </div>
          <div className="space-y-2">
            {(control.add_ons || []).map((a, idx) => (
              <div key={a.id || idx} className="grid lg:grid-cols-[1.2fr_1.6fr_.7fr_.5fr_.9fr_auto] gap-2 items-center rounded-lg border border-slate-200 p-2">
                <input value={a.name || ''} onChange={e => updateAddon(idx, { name: e.target.value })} placeholder="Add-on name" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                <input value={a.description || ''} onChange={e => updateAddon(idx, { description: e.target.value })} placeholder="Description" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                <input type="number" value={a.unit_price ?? 0} onChange={e => updateAddon(idx, { unit_price: Number(e.target.value) })} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                <input type="number" min="1" value={a.quantity ?? 1} onChange={e => updateAddon(idx, { quantity: Number(e.target.value) })} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                <select value={a.billing_frequency || 'Monthly'} onChange={e => updateAddon(idx, { billing_frequency: e.target.value })} className="border border-slate-300 rounded px-2 py-1.5 text-sm">
                  {['Monthly','Quarterly','Annual','One-Time'].map(v => <option key={v}>{v}</option>)}
                </select>
                <button onClick={() => removeAddon(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {(control.add_ons || []).length === 0 && <div className="text-sm text-slate-400">No add-ons configured.</div>}
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-brand-accent" />
            <div>
              <h2 className="font-bold text-slate-900">Invoices</h2>
              <p className="text-xs text-slate-500">Draft, schedule, email, mark paid, or void agency invoices.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button disabled={busy} onClick={() => createInvoice(false)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold">Create Draft</button>
            <button disabled={busy || !control.next_invoice_date} onClick={() => createInvoice(true)} className="bg-brand-accent text-brand-dark rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-40">Generate Scheduled Invoice</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="text-left px-4 py-3">Invoice</th><th className="text-left px-4 py-3">Issue / Due</th><th className="text-left px-4 py-3">Total</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{inv.issue_date || '—'} / {inv.due_date || '—'}</td>
                  <td className="px-4 py-3 font-semibold">{money(inv.total)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">{inv.status}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button disabled={busy} onClick={() => viewAgencyInvoicePdf(control, inv)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-black"><Eye className="w-3.5 h-3.5" /> View PDF</button>
                      <button disabled={busy} onClick={() => downloadAgencyInvoicePdf(control, inv)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-black"><Download className="w-3.5 h-3.5" /> Download</button>
                      {!['Paid','Void'].includes(inv.status) && <button disabled={busy} onClick={() => invoiceAction('send_invoice', inv.id)} className="text-xs font-semibold text-blue-600">Send</button>}
                      {!['Paid','Void'].includes(inv.status) && <button disabled={busy} onClick={() => invoiceAction('mark_paid', inv.id)} className="text-xs font-semibold text-green-700">Paid</button>}
                      {!['Paid','Void'].includes(inv.status) && <button disabled={busy} onClick={() => invoiceAction('void_invoice', inv.id)} className="text-xs font-semibold text-red-600">Void</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No invoices yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><Mail className="w-5 h-5 text-brand-accent" /><h2 className="font-bold text-slate-900">Send Billing Notification</h2></div>
          <div className="space-y-3">
            <Field label="Recipient" value={noticeForm.recipient_email || control.billing_email || ''} onChange={v => setNoticeForm(f => ({ ...f, recipient_email: v }))} type="email" />
            <Field label="Subject" value={noticeForm.subject} onChange={v => setNoticeForm(f => ({ ...f, subject: v }))} />
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Message</span>
              <textarea value={noticeForm.message} onChange={e => setNoticeForm(f => ({ ...f, message: e.target.value }))} rows={5} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </label>
            <button disabled={busy || !noticeForm.subject || !noticeForm.message} onClick={sendNotice} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2 rounded-lg disabled:opacity-40"><Send className="w-4 h-4" /> Send Notification</button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="font-bold text-slate-900 mb-4">Recent Billing Events</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {notifications.slice(0, 15).map(n => (
              <div key={n.id} className="border-b border-slate-100 pb-2 text-sm">
                <div className="font-semibold text-slate-800">{n.notification_type}</div>
                <div className="text-xs text-slate-500">{n.recipient_email || 'No recipient'} · {n.status}</div>
                {n.subject && <div className="text-xs text-slate-600 mt-1">{n.subject}</div>}
              </div>
            ))}
            {notifications.length === 0 && <div className="text-sm text-slate-400">No billing events yet.</div>}
          </div>
        </div>
      </section>
      </>}
    </div>
  );
}
