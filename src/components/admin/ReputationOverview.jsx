import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, RefreshCw, Sparkles, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function Metric({ label, value }) {
  return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    <div className="text-xl font-black text-slate-900 mt-0.5">{value}</div>
  </div>;
}

function stars(rating) {
  const n = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));
  return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
}

export default function ReputationOverview() {
  const [data, setData] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await base44.functions.invoke('getReputationDashboard', {});
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setData(d);
      const next = {};
      for (const r of d.recent_reviews || []) next[r.id] = r.response_draft || r.response_text || '';
      setDrafts(next);
    } catch (e) {
      setError(e.message || 'Unable to load reputation dashboard.');
    }
  };

  useEffect(() => { load(); }, []);

  const syncGoogle = async () => {
    setSyncBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await base44.functions.invoke('syncGoogleReviews', {});
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      setNotice(d.skipped ? d.reason : `Google review sync complete: ${d.created || 0} new, ${d.updated || 0} updated.`);
      await load();
    } catch (e) {
      setError(e.message || 'Google review sync failed.');
    } finally {
      setSyncBusy(false);
    }
  };

  const action = async (reviewId, actionName, extra = {}) => {
    setBusyId(reviewId + ':' + actionName);
    setError('');
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageReputationReview', {
        action: actionName,
        review_id: reviewId,
        ...extra
      });
      const d = res?.data || res || {};
      if (d.error) throw new Error(d.error);
      if (d.draft) setDrafts(v => ({ ...v, [reviewId]: d.draft }));
      const autoPostNotice = d.auto_posted ? 'Approved reply posted to Google automatically.' : '';
      const autoPostWarning = d.auto_post_warning ? 'Reply approved, but auto-post did not complete: ' + d.auto_post_warning : '';
      await load();
      if (autoPostNotice) setNotice(autoPostNotice);
      else if (autoPostWarning) setError(autoPostWarning);
    } catch (e) {
      setError(e.message || 'Reputation action failed.');
    } finally {
      setBusyId('');
    }
  };

  if (!data) {
    return <section className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading reputation dashboard…</div>
    </section>;
  }

  const addOn = data.add_on || {};
  const m = data.metrics || {};

  return <section className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
    <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        <Star className="w-5 h-5 text-brand-accent mt-0.5" />
        <div>
          <h2 className="font-bold text-slate-900">Reputation Management</h2>
          <p className="text-xs text-slate-500">Review monitoring, request conversion, response workflow, and website review publishing.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {addOn.enabled && addOn.google_sync_enabled && (
          <button onClick={syncGoogle} disabled={syncBusy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40">
            {syncBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync Google Reviews
          </button>
        )}
        <div className={'text-xs font-bold rounded-full px-3 py-1 ' + (addOn.enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600')}>
          {addOn.enabled ? 'ADD-ON ACTIVE' : 'ADD-ON NOT ACTIVE'}
        </div>
      </div>
    </div>

    <div className="p-5 space-y-5">
      {!addOn.enabled && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Reputation Management is not currently active for this account. Existing review/request records remain available, but AI response workflow and managed reputation features are disabled.
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Metric label="Reviews" value={m.total_reviews ?? 0} />
        <Metric label="Avg Rating" value={Number(m.average_rating || 0).toFixed(2)} />
        <Metric label="New 30 Days" value={m.new_reviews_30d ?? 0} />
        <Metric label="Needs Attention" value={m.needs_attention ?? 0} />
        <Metric label="Pending Replies" value={m.pending_responses ?? 0} />
        <Metric label="Replies Posted" value={m.responses_posted ?? 0} />
        <Metric label="Requests Sent" value={m.requests_sent ?? 0} />
        <Metric label="Conversion" value={(m.conversion_percent ?? 0) + '%'} />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Reviews</h3>
            <p className="text-xs text-slate-500">Imported Google reviews will appear here once the Google Business Profile connection is enabled. Existing/manual reviews are shown now.</p>
          </div>
          <div className="text-xs text-slate-500">{m.website_reviews ?? 0} approved for website</div>
        </div>

        <div className="space-y-3">
          {(data.recent_reviews || []).map(r => {
            const draft = drafts[r.id] ?? '';
            const busy = busyId.startsWith(r.id + ':');
            return <div key={r.id} className={'rounded-lg border p-4 ' + (r.attention_required ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{r.customer_name || 'Customer'}</span>
                    <span className="text-amber-500 tracking-wide" aria-label={(r.rating || 0) + ' stars'}>{stars(r.rating)}</span>
                    <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{r.source || 'Google'}</span>
                    {r.attention_required && <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800"><AlertTriangle className="w-3.5 h-3.5" /> Needs attention</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{r.city || ''}{r.review_date ? (r.city ? ' · ' : '') + r.review_date : ''}</div>
                </div>
                <div className="flex items-center gap-2">
                  {r.external_review_url && <a href={r.external_review_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></a>}
                  <span className="text-xs font-semibold rounded-full bg-slate-100 px-2 py-1">{r.response_status || 'None'}</span>
                </div>
              </div>

              <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{r.body}</p>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Response Draft</label>
                <textarea
                  rows={4}
                  disabled={!addOn.enabled}
                  value={draft}
                  onChange={e => setDrafts(v => ({ ...v, [r.id]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
                  placeholder="Generate or write a response draft…"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    disabled={!addOn.enabled || !addOn.ai_reply_drafts_enabled || busy}
                    onClick={() => action(r.id, 'draft_response')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent text-brand-dark px-3 py-2 text-xs font-bold disabled:opacity-40"
                  >
                    {busyId === r.id + ':draft_response' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    AI Draft
                  </button>
                  <button disabled={!addOn.enabled || !draft.trim() || busy} onClick={() => action(r.id, 'save_draft', { response_draft:draft })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">Save Draft</button>
                  <button disabled={!addOn.enabled || !draft.trim() || busy} onClick={() => action(r.id, 'submit_for_approval', { response_draft:draft })} className="rounded-lg border border-blue-300 bg-blue-50 text-blue-700 px-3 py-2 text-xs font-semibold disabled:opacity-40">Submit / Approve</button>
                  {['Pending Agency Approval','Pending Client Approval','Draft'].includes(r.response_status) && (
                    <button disabled={!addOn.enabled || busy} onClick={() => action(r.id, 'approve_response')} className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 text-green-700 px-3 py-2 text-xs font-semibold disabled:opacity-40"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                  )}
                  {r.response_status !== 'Posted' && r.external_review_id && addOn.google_sync_enabled && (
                    <button disabled={!addOn.enabled || !draft.trim() || busy} onClick={() => action(r.id, 'post_google_reply', { response_text:draft })} className="rounded-lg border border-green-300 bg-green-50 text-green-700 px-3 py-2 text-xs font-semibold disabled:opacity-40">Post to Google</button>
                  )}
                  {r.response_status !== 'Posted' && (
                    <button disabled={!addOn.enabled || !draft.trim() || busy} onClick={() => action(r.id, 'mark_posted', { response_text:draft })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">Mark Posted</button>
                  )}
                  <button
                    disabled={busy}
                    onClick={() => action(r.id, 'set_website_approval', { approved_for_website:!r.approved_for_website })}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold"
                  >
                    {r.approved_for_website ? 'Remove from Website' : 'Approve for Website'}
                  </button>
                </div>
              </div>
            </div>;
          })}
          {(data.recent_reviews || []).length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No reviews are stored yet.</div>}
        </div>
      </div>
    </div>
  </section>;
}
