import { useEffect, useState } from 'react';
import { Mail, MessageSquare, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReputationOverview from '@/components/admin/ReputationOverview';
import {
  isJobReviewEligible,
  calculateReviewDueDate,
  calculateReminderDueDate,
  isReviewAutomationReady,
  getReviewStatusColor,
} from '@/lib/reviewUtils';

export default function ReviewQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState({});
  const [customers, setCustomers] = useState({});
  const [settings, setSettings] = useState({});
  const [includeTest, setIncludeTest] = useState(false);
  const [selected, setSelected] = useState(null);
  const [doNotAskReason, setDoNotAskReason] = useState('');
  const [confirmDoNotAsk, setConfirmDoNotAsk] = useState(null);
  const [confirmSendEarly, setConfirmSendEarly] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [reqList, jobList, custList, visitList, partsList, settingList] = await Promise.all([
        base44.entities.ReviewRequest.list('-created_date', 200),
        base44.entities.Job.list('-created_date', 500),
        base44.entities.Customer.list('-created_date', 500),
        base44.entities.Appointment.list('-created_date', 500),
        base44.entities.JobPart.list('-created_date', 500),
        base44.functions.invoke('getReviewAdminSettings', {}),
      ]);

      const s = settingList?.data || settingList || {};
      setSettings(s);

      const ft = (arr) => (includeTest ? arr || [] : (arr || []).filter((r) => !r.is_test_data));
      const fJobs = ft(jobList);
      const fReqs = ft(reqList);

      const jMap = {};
      fJobs.forEach((j) => { jMap[j.id] = j; });
      const cMap = {};
      custList.forEach((c) => { cMap[c.id] = c; });
      setJobs(jMap);
      setCustomers(cMap);

      const visitsByJob = {};
      visitList.forEach((v) => { if (!visitsByJob[v.job_id]) visitsByJob[v.job_id] = []; visitsByJob[v.job_id].push(v); });
      const partsByJob = {};
      partsList.forEach((p) => { if (!partsByJob[p.job_id]) partsByJob[p.job_id] = []; partsByJob[p.job_id].push(p); });

      // Find completed jobs that are review-eligible but have no ReviewRequest
      const existingJobIds = new Set(fReqs.map((r) => r.job_id));
      const virtualItems = s.reputation_management_enabled ? fJobs
        .filter((j) => j.status === 'Completed' && !existingJobIds.has(j.id) && isJobReviewEligible(j, visitsByJob[j.id] || [], partsByJob[j.id] || []))
        .map((j) => ({
          id: `virtual-${j.id}`,
          job_id: j.id,
          customer_id: j.customer_id,
          status: 'Eligible',
          eligible_date: j.completed_at ? new Date(j.completed_at).toISOString().slice(0, 10) : null,
          request_due_date: calculateReviewDueDate(j.completed_at, s.review_initial_delay_days || 1),
          is_virtual: true,
          is_test_data: j.is_test_data || false,
        })) : [];

      const all = [...fReqs, ...virtualItems];
      const priority = { 'Request Due': 0, 'Reminder Due': 1, Eligible: 2, 'Request Sent': 3, 'Reminder Sent': 4, 'Review Received': 5, 'Do Not Ask': 6 };
      all.sort((a, b) => (priority[a.status] ?? 9) - (priority[b.status] ?? 9));
      setItems(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [includeTest]);

  const automationReady = isReviewAutomationReady(settings);

  const persistRequest = async (item, status, extra = {}) => {
    const j = jobs[item.job_id];
    const res = await base44.functions.invoke('updateReviewWorkflow', {
      request_id: item.is_virtual ? null : item.id,
      job_id: item.job_id,
      customer_id: item.customer_id || j?.customer_id,
      status,
      eligible_date: item.eligible_date || null,
      request_due_date: item.request_due_date || null,
      channel: item.channel || 'Email',
      is_test_data: !!(item.is_test_data || j?.is_test_data),
      ...extra,
    });
    const data = res?.data || res || {};
    if (data.error) throw new Error(data.error);
    load();
    setSelected(null);
  };

  const sendReviewRequest = (item) => {
    const today = new Date().toISOString().slice(0, 10);
    persistRequest(item, 'Request Sent', {
      action: 'send_request',
      request_sent_date: today,
      reminder_due_date: settings.review_reminders_enabled ? calculateReminderDueDate(today, settings.review_reminder_delay_days || 3) : null,
    });
  };

  const sendReviewReminder = (item) => {
    const today = new Date().toISOString().slice(0, 10);
    persistRequest(item, 'Reminder Sent', { action: 'send_reminder', reminder_sent_date: today });
  };

  const markReviewReceived = (item) => {
    const today = new Date().toISOString().slice(0, 10);
    persistRequest(item, 'Review Received', { review_received_date: today });
  };

  const handleDoNotAsk = async () => {
    if (!confirmDoNotAsk) return;
    const item = confirmDoNotAsk;
    await persistRequest(item, 'Do Not Ask', { do_not_ask_reason: doNotAskReason || 'Administrative reason' });
    setConfirmDoNotAsk(null);
    setDoNotAskReason('');
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const getEffectiveStatus = (item) => {
    if ((item.status === 'Eligible') && item.request_due_date && todayStr < item.request_due_date) return 'Scheduled';
    if ((item.status === 'Eligible') && item.request_due_date && todayStr >= item.request_due_date) return 'Request Due';
    if (item.status === 'Request Sent' && item.reminder_due_date && todayStr < item.reminder_due_date) return 'Awaiting Reminder';
    if (item.status === 'Request Sent' && item.reminder_due_date && todayStr >= item.reminder_due_date) return 'Reminder Due';
    return item.status;
  };

  const getActionButtons = (item) => {
    if (!settings.reputation_management_enabled) return [];
    const eff = getEffectiveStatus(item);
    const buttons = [];
    // Before Request Due: no SEND — only Send Early behind confirmation
    if (eff === 'Scheduled') {
      buttons.push({ label: 'Send Early', icon: Mail, onClick: () => setConfirmSendEarly({ item, action: 'request' }), cls: 'bg-white border border-slate-300 text-slate-500' });
    }
    // On/after Request Due: enable SEND REQUEST
    if (eff === 'Request Due') {
      buttons.push({ label: 'Send Review Request', icon: Mail, onClick: () => sendReviewRequest(item), cls: 'bg-brand-accent text-brand-dark' });
    }
    // After Request Sent, before Reminder Due: no SEND REMINDER — only Send Early
    if (settings.review_reminders_enabled && eff === 'Awaiting Reminder') {
      buttons.push({ label: 'Send Early', icon: MessageSquare, onClick: () => setConfirmSendEarly({ item, action: 'reminder' }), cls: 'bg-white border border-slate-300 text-slate-500' });
    }
    // On/after Reminder Due: enable SEND REMINDER
    if (settings.review_reminders_enabled && eff === 'Reminder Due') {
      buttons.push({ label: 'Send Reminder', icon: MessageSquare, onClick: () => sendReviewReminder(item), cls: 'bg-white border border-slate-300 text-slate-700' });
    }
    // REVIEW RECEIVED available after Request Sent (and not yet received)
    if (item.status === 'Request Sent' || item.status === 'Reminder Sent' || eff === 'Reminder Due' || eff === 'Awaiting Reminder') {
      buttons.push({ label: 'Review Received', icon: CheckCircle2, onClick: () => markReviewReceived(item), cls: 'bg-green-600 text-white' });
    }
    // DO NOT ASK remains available with confirmation + reason
    if (item.status !== 'Review Received' && item.status !== 'Do Not Ask' && item.status !== 'Reminder Sent') {
      buttons.push({ label: 'Do Not Ask', icon: Ban, onClick: () => setConfirmDoNotAsk(item), cls: 'bg-white border border-red-200 text-red-600' });
    }
    return buttons;
  };

  const handleSendEarly = () => {
    if (!confirmSendEarly) return;
    if (confirmSendEarly.action === 'request') sendReviewRequest(confirmSendEarly.item);
    else if (confirmSendEarly.action === 'reminder') sendReviewReminder(confirmSendEarly.item);
    setConfirmSendEarly(null);
  };

  return (
    <div className="p-6 max-w-7xl">
      <ReputationOverview />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Review Queue</h1>
          <p className="text-sm text-slate-500">Neutral Google review requests — no review-gating.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
          <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} className="rounded" />
          Include Test Data
        </label>
      </div>

      {/* Automation status banner */}
      <div className={`rounded-lg px-4 py-3 mb-4 text-sm flex items-center gap-2 ${automationReady ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-slate-100 border border-slate-300 text-slate-600'}`}>
        <AlertTriangle className="w-4 h-4" />
        {!settings.reputation_management_enabled
          ? 'REPUTATION MANAGEMENT OFF — completed work will not enter the review-request queue until the add-on is enabled.'
          : automationReady
            ? 'AUTOMATION READY — email review requests can be processed from the protected review workflow.'
            : 'AUTOMATION NOT READY — configure the Google Review URL and Email channel before enabling automated sending.'}
      </div>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          {settings.reputation_management_enabled
            ? `No review requests are currently due. Completed ${settings.business_model === 'project_quote' ? 'projects' : 'jobs'} become eligible after the configured delay.`
            : 'Reputation Management is not active, so completed work is not being added to the review-request queue.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">{settings.business_model === 'project_quote' ? 'Project #' : 'Job #'}</th>
                <th className="text-left px-4 py-3">Completed</th>
                <th className="text-left px-4 py-3">Request Due</th>
                <th className="text-left px-4 py-3">Sent</th>
                <th className="text-left px-4 py-3">Reminder Due</th>
                <th className="text-left px-4 py-3">Channel</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => {
                const j = jobs[r.job_id];
                const c = customers[r.customer_id];
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex items-center gap-1">
                        {c ? `${c.first_name} ${c.last_name}` : '—'}
                        {r.is_test_data && <span className="text-[9px] bg-slate-200 text-slate-500 px-1 py-0.5 rounded font-sans">TEST</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{j?.job_number || '—'}</td>
                    <td className="px-4 py-3 text-xs">{j?.completed_at ? new Date(j.completed_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.request_due_date || '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.request_sent_date || '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.reminder_due_date || '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.channel || 'Email'}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const eff = getEffectiveStatus(r);
                        const label = eff === 'Scheduled' ? `Scheduled for ${r.request_due_date || '—'}` :
                                      eff === 'Request Due' ? 'Request Due' :
                                      eff === 'Awaiting Reminder' ? `Reminder due ${r.reminder_due_date || '—'}` :
                                      eff === 'Reminder Due' ? 'Reminder Due' :
                                      r.status;
                        return <span className={`text-xs font-medium px-2 py-0.5 rounded ${getReviewStatusColor(r.status)}`}>{label}</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {getActionButtons(r).map((btn, i) => (
                          <button key={i} onClick={btn.onClick} className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg ${btn.cls}`}>
                            <btn.icon className="w-3 h-3" /> {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Do Not Ask confirmation */}
      {confirmDoNotAsk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDoNotAsk(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-md w-full">
            <h3 className="font-bold text-slate-900 mb-2">Mark as Do Not Ask</h3>
            <p className="text-sm text-slate-600 mb-3">This will suppress the review request for this job. Customer dissatisfaction alone is not a valid reason.</p>
            <input value={doNotAskReason} onChange={(e) => setDoNotAskReason(e.target.value)} placeholder="Reason (e.g. Customer requested no review request)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3" />
            <div className="flex gap-2">
              <button onClick={() => setConfirmDoNotAsk(null)} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button onClick={handleDoNotAsk} className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-bold">Confirm Do Not Ask</button>
            </div>
          </div>
        </div>
      )}

      {/* Send Early confirmation */}
      {confirmSendEarly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmSendEarly(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-md w-full">
            <h3 className="font-bold text-slate-900 mb-2">Send Before Scheduled Date</h3>
            <p className="text-sm text-slate-600 mb-3">
              {confirmSendEarly.action === 'request'
                ? `This request is scheduled for ${confirmSendEarly.item.request_due_date}. Send it now anyway?`
                : `The reminder is scheduled for ${confirmSendEarly.item.reminder_due_date}. Send it now anyway?`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmSendEarly(null)} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
              <button onClick={handleSendEarly} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Send Early</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}