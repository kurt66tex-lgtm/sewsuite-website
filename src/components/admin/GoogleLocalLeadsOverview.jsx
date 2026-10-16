import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const money = v => '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });

const SATISFIED_REASONS = [
  ['BOOKED_CUSTOMER','Booked customer'],
  ['LIKELY_BOOKED_CUSTOMER','Likely to book'],
  ['SERVICE_RELATED','Service matched'],
  ['HIGH_VALUE_SERVICE','High-value service'],
  ['OTHER_SATISFIED_REASON','Other satisfied reason']
];
const DISSATISFIED_REASONS = [
  ['GEO_MISMATCH','Outside service area'],
  ['JOB_TYPE_MISMATCH','Service not offered'],
  ['NOT_READY_TO_BOOK','Customer not ready to book'],
  ['SPAM','Spam / scam / silent call'],
  ['DUPLICATE','Duplicate lead'],
  ['SOLICITATION','Solicitation'],
  ['OTHER_DISSATISFIED_REASON','Other dissatisfied reason']
];

function Metric({ label, value }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-xl font-black text-slate-900 mt-0.5">{value}</div>
  </div>;
}

export default function GoogleLocalLeadsOverview() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [feedbackLead, setFeedbackLead] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ survey_answer:'', reason:'', comment:'' });

  const load = async () => {
    try {
      const res = await base44.functions.invoke('getGoogleLocalLeadsDashboard', { days:30 });
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e) {
      setError(e.message || 'Unable to load Google Local Services reporting.');
    }
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await base44.functions.invoke('syncGoogleLocalLeads', { days:30, manual:true });
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setNotice(d.skipped ? d.reason : `Google sync complete: ${d.leads_created || 0} new lead(s), ${d.leads_updated || 0} updated.`);
      await load();
    } catch (e) {
      setError(e.message || 'Google Local Services lead sync failed.');
    } finally {
      setBusy(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackLead) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const res = await base44.functions.invoke('provideGoogleLocalLeadFeedback', {
        google_local_lead_id:feedbackLead.id,
        ...feedbackForm
      });
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setNotice('Lead quality feedback sent to Google' + (d.credit_issuance_decision ? ` · Credit decision: ${String(d.credit_issuance_decision).replace(/_/g, ' ')}` : '') + '.');
      setFeedbackLead(null);
      setFeedbackForm({ survey_answer:'', reason:'', comment:'' });
      await load();
    } catch (e) {
      setError(e.message || 'Unable to submit lead feedback.');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <section className="bg-white border border-slate-200 rounded-xl p-5 mb-5">
    <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading Google Local Services leads…</div>
  </section>;

  const a = data.add_on || {};
  const m = data.metrics || {};
  const runtime = data.runtime || {};

  return <section className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
    <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <Search className="w-5 h-5 text-brand-accent mt-0.5" />
        <div>
          <h2 className="font-bold text-slate-900">Google Local Services Leads</h2>
          <p className="text-xs text-slate-500">Local Services lead-to-job attribution, lead quality, spend and ROI for the last 30 days.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {a.enabled && <button onClick={sync} disabled={busy || !runtime.ready} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync
        </button>}
        <span className={'text-xs font-bold rounded-full px-3 py-1 ' + (a.enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600')}>{a.enabled ? 'ADD-ON ACTIVE' : 'ADD-ON NOT ACTIVE'}</span>
      </div>
    </div>

    <div className="p-5 space-y-5">
      {!a.enabled && <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Google Local Services Management is not currently active for this account. Existing CRM leads are unaffected.</div>}
      {a.enabled && !runtime.ready && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2"><AlertTriangle className="w-4 h-4 mt-0.5" /> Google Ads API authorization is not complete. The Agency Owner manages the connection.</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Metric label="Google Leads" value={m.leads ?? 0} />
        <Metric label="Charged" value={m.charged_leads ?? 0} />
        <Metric label="Booked" value={m.booked_leads ?? 0} />
        <Metric label="Booking Rate" value={(m.booking_rate_percent ?? 0) + '%'} />
        <Metric label="Completed" value={m.completed_jobs ?? 0} />
        <Metric label="Avg Response" value={m.avg_first_response_minutes == null ? '—' : m.avg_first_response_minutes + ' min'} />
        <Metric label="Google Ad Spend" value={money(m.ad_spend)} />
        <Metric label="Cost / Lead" value={money(m.cost_per_lead)} />
        <Metric label="Cost / Booked Job" value={money(m.cost_per_booked_job)} />
        <Metric label="Completed Job Value" value={money(m.attributed_completed_job_value)} />
        <Metric label="Value / Spend" value={(m.value_to_spend_ratio ?? 0) + '×'} />
        <Metric label="Credited Leads" value={m.credited_leads ?? 0} />
      </div>

      {a.enabled && <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-slate-900">Recent Google Leads</h3>
          <Link to="/admin/inbox" className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1">Open CRM Inbox <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="text-left px-3 py-2">Lead</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Service</th><th className="text-left px-3 py-2">Google</th><th className="text-left px-3 py-2">CRM</th><th className="text-left px-3 py-2">Job</th><th className="text-left px-3 py-2">Feedback</th><th className="text-right px-3 py-2">Value</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.recent_leads || []).slice(0, 20).map(r => <tr key={r.id}>
                <td className="px-3 py-2"><div className="font-semibold text-slate-900">{r.consumer_name || 'Google Lead'}</div><div className="text-[11px] text-slate-500">{r.phone_number || 'No phone'}{r.phone_extension ? ' ext. ' + r.phone_extension : ''}</div></td>
                <td className="px-3 py-2 text-xs">{String(r.lead_type || '—').replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 text-xs">{String(r.service_id || '—').replace(/_/g, ' ')}</td>
                <td className="px-3 py-2 text-xs"><div>{r.charged ? 'Charged' : 'Not charged'}</div>{r.credited && <div className="text-green-700 font-semibold">Credited</div>}</td>
                <td className="px-3 py-2 text-xs">{r.crm_status || (r.crm_lead_id ? 'Imported' : '—')}</td>
                <td className="px-3 py-2 text-xs">{r.job_id ? <Link to={'/admin/jobs?job=' + r.job_id} className="text-blue-600 font-semibold">{r.job_number || r.job_status || 'Open Job'}</Link> : '—'}</td>
                <td className="px-3 py-2 text-xs">
                  {r.feedback_submitted ? (
                    <div><span className="font-semibold text-green-700">Submitted</span>{r.feedback_credit_decision && <div className="text-[10px] text-slate-500">{String(r.feedback_credit_decision).replace(/_/g, ' ')}</div>}</div>
                  ) : a.feedback_enabled ? (
                    <button
                      disabled={busy || !runtime.ready}
                      onClick={() => { setFeedbackLead(r); setFeedbackForm({ survey_answer:'', reason:'', comment:'' }); }}
                      className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold hover:border-brand-accent disabled:opacity-40"
                    >Lead Quality</button>
                  ) : <span className="text-slate-400">Off</span>}
                </td>
                <td className="px-3 py-2 text-xs text-right font-semibold">{r.attributed_value ? money(r.attributed_value) : '—'}</td>
              </tr>)}
              {(data.recent_leads || []).length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">No Google Local Services leads have been imported for this period.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">Completed Job Value uses the CRM job estimate amount when available. It is an attribution value, not confirmed collected revenue until accounting/payment integration is connected.</p>
      </div>}

      {feedbackLead && (() => {
        const answer = feedbackForm.survey_answer;
        const positive = ['VERY_SATISFIED','SATISFIED'].includes(answer);
        const negative = ['DISSATISFIED','VERY_DISSATISFIED'].includes(answer);
        const reasons = positive ? SATISFIED_REASONS : negative ? DISSATISFIED_REASONS : [];
        const otherReason = ['OTHER_SATISFIED_REASON','OTHER_DISSATISFIED_REASON'].includes(feedbackForm.reason);
        const invalid = !answer || ((positive || negative) && !feedbackForm.reason) || (otherReason && !feedbackForm.comment.trim());
        return <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !busy && setFeedbackLead(null)} />
          <div className="relative w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold text-slate-900">Send Lead Quality Feedback to Google</h3>
            <p className="mt-1 text-xs text-slate-500">{feedbackLead.consumer_name || 'Google lead'} · {String(feedbackLead.service_id || 'service').replace(/_/g, ' ')}</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Lead quality</span>
                <select value={answer} onChange={e => setFeedbackForm({ survey_answer:e.target.value, reason:'', comment:'' })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  <option value="VERY_SATISFIED">Very satisfied</option>
                  <option value="SATISFIED">Satisfied</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="DISSATISFIED">Dissatisfied</option>
                  <option value="VERY_DISSATISFIED">Very dissatisfied</option>
                </select>
              </label>
              {reasons.length > 0 && <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Reason</span>
                <select value={feedbackForm.reason} onChange={e => setFeedbackForm(v => ({ ...v, reason:e.target.value, comment:'' }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  {reasons.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>}
              {otherReason && <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Explanation</span>
                <textarea rows={3} value={feedbackForm.comment} onChange={e => setFeedbackForm(v => ({ ...v, comment:e.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </label>}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">This sends lead-quality feedback to Google. It does not guarantee a charge reversal or credit; Google returns its own credit decision when applicable.</div>
            </div>
            <div className="mt-4 flex gap-2">
              <button disabled={busy} onClick={() => setFeedbackLead(null)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button>
              <button disabled={busy || invalid} onClick={submitFeedback} className="flex-1 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-40">{busy ? 'Sending…' : 'Submit to Google'}</button>
            </div>
          </div>
        </div>;
      })()}
    </div>
  </section>;
}
