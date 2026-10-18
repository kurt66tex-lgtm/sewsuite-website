import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Star, ShieldCheck } from 'lucide-react';
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

function Field({ label, value, onChange, type='text', step, hint, placeholder }) {
  return <label className="block">
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    <input
      type={type}
      step={step}
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

function GoogleBusinessConnectionWizard({ control, update, runtimeStatus }) {
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [accountId, setAccountId] = useState(control.reputation_google_account_id || '');
  const [locationId, setLocationId] = useState(control.reputation_google_location_id || '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const call = async (action, payload={}) => {
    const res = await base44.functions.invoke('manageGoogleBusinessProfileConnection', { action, ...payload });
    const data = res?.data || res || {};
    if (data.error) {
      const err = new Error(data.error);
      err.code = data.code;
      err.runtime = data.runtime;
      throw err;
    }
    return data;
  };

  const refreshStatus = async () => {
    try {
      const data = await call('status');
      setStatus(data);
      if (data.selected?.account_id) setAccountId(data.selected.account_id);
      if (data.selected?.location_id) setLocationId(data.selected.location_id);
    } catch (e) {
      setError(e.message || 'Unable to load Google Business Profile connection status.');
    }
  };

  useEffect(() => { refreshStatus(); }, []);

  const selectedAccount = useMemo(
    () => accounts.find(a => a.account_id === accountId) || null,
    [accounts, accountId]
  );
  const selectedLocation = useMemo(
    () => locations.find(l => l.location_id === locationId) || null,
    [locations, locationId]
  );

  const discoverAccounts = async () => {
    setBusy('accounts'); setError(''); setNotice('');
    try {
      const data = await call('discover_accounts');
      setAccounts(data.accounts || []);
      if ((data.accounts || []).length === 1) {
        const id = data.accounts[0].account_id;
        setAccountId(id);
        await discoverLocations(id);
      } else if (accountId) {
        await discoverLocations(accountId);
      }
      if (!(data.accounts || []).length) setNotice('No Business Profile accounts were returned for the authorized Google account.');
    } catch (e) {
      setError(e.code === 'GBP_OAUTH_NOT_CONFIGURED'
        ? 'Agency Google Business Profile OAuth is not configured yet. Complete the server-side Google setup shown below first.'
        : String(e.message || '').includes('429')
          ? 'Google Business Profile API access is still pending Google approval. This Cloud project currently has a 0 requests-per-minute quota, so account discovery is temporarily blocked. Retry after Google approves the Business Profile API access request.'
          : (e.message || 'Unable to discover Google Business Profile accounts.'));
    } finally { setBusy(''); }
  };

  const discoverLocations = async (id) => {
    const target = id || accountId;
    if (!target) return;
    setBusy('locations'); setError(''); setNotice('');
    try {
      const data = await call('discover_locations', { account_id:target });
      setLocations(data.locations || []);
      if ((data.locations || []).length === 1) setLocationId(data.locations[0].location_id);
      if (!(data.locations || []).length) setNotice('No Business Profile locations were returned for this account.');
    } catch (e) {
      setError(e.message || 'Unable to load Google Business Profile locations.');
    } finally { setBusy(''); }
  };

  const saveSelection = async () => {
    if (!accountId || !locationId) return;
    setBusy('save'); setError(''); setNotice('');
    try {
      const a = selectedAccount || {};
      const l = selectedLocation || {};
      await call('save_selection', {
        account_id:accountId,
        account_name:a.account_name || control.reputation_google_account_name || '',
        location_id:locationId,
        location_name:l.title || control.reputation_google_location_name || '',
        location_address:l.address || control.reputation_google_location_address || ''
      });
      update('reputation_google_account_id', accountId);
      update('reputation_google_account_name', a.account_name || control.reputation_google_account_name || '');
      update('reputation_google_location_id', locationId);
      update('reputation_google_location_name', l.title || control.reputation_google_location_name || '');
      update('reputation_google_location_address', l.address || control.reputation_google_location_address || '');
      update('reputation_google_connection_verified_at', null);
      update('reputation_google_sync_enabled', false);
      setNotice('Google Business Profile selection saved. Run Test & Enable Sync next.');
      await refreshStatus();
    } catch (e) {
      setError(e.message || 'Unable to save Google Business Profile selection.');
    } finally { setBusy(''); }
  };

  const testEnable = async () => {
    setBusy('test'); setError(''); setNotice('');
    try {
      const data = await call('test_and_enable', { account_id:accountId, location_id:locationId });
      update('reputation_google_sync_enabled', true);
      update('reputation_google_connection_verified_at', data.verified_at || new Date().toISOString());
      setNotice(`Google Business Profile verified. Sync enabled. Google returned ${data.total_from_google ?? 0} review(s)${data.total_review_count != null ? `; profile total ${data.total_review_count}` : ''}.`);
      await refreshStatus();
    } catch (e) {
      setError(e.message || 'Google Business Profile review test failed.');
    } finally { setBusy(''); }
  };

  const oauthReady = status?.runtime?.oauth_ready ?? (
    runtimeStatus?.google_client_id_configured &&
    runtimeStatus?.google_client_secret_configured &&
    runtimeStatus?.google_refresh_token_configured
  );
  const verified = !!(status?.selected?.verified_at || control.reputation_google_connection_verified_at);
  const selectionReady = !!accountId && !!locationId;

  return <div className="space-y-4">
    <div className="grid md:grid-cols-3 gap-3">
      <StatusCard
        label={oauthReady ? 'Agency Google OAuth — Ready' : 'Agency Google OAuth — Setup Required'}
        ready={oauthReady}
        detail={oauthReady
          ? 'Server-side Business Profile OAuth credentials and refresh token are configured.'
          : 'Configure GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN as server-side secrets. Never store them in Business Settings.'}
      />
      <StatusCard
        label={selectionReady ? 'Business Profile — Selected' : 'Business Profile — Not Selected'}
        ready={selectionReady}
        detail={selectionReady
          ? `${control.reputation_google_location_name || selectedLocation?.title || locationId}${control.reputation_google_location_address ? ' · ' + control.reputation_google_location_address : ''}`
          : 'Discover the agency-accessible Google accounts and choose this client’s location.'}
      />
      <StatusCard
        label={verified ? 'Review API — Verified' : 'Review API — Not Verified'}
        ready={verified}
        detail={verified
          ? 'A live Google review-list request has succeeded for the selected location.'
          : 'Save the location, then run Test & Enable Sync before treating the connection as live.'}
      />
    </div>

    {!oauthReady && (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="font-bold">One-time agency setup still required</div>
        <div className="mt-1 leading-6">
          The agency Google Cloud project must have Google Business Profile API access, OAuth consent configured, and the
          <code className="mx-1 rounded bg-white/70 px-1">business.manage</code> scope authorized. The resulting client ID,
          client secret and refresh token stay in server-side secrets. After that, use Discover Accounts below.
        </div>
      </div>
    )}

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={discoverAccounts}
        disabled={!!busy}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
      >
        {busy === 'accounts' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Discover Accounts
      </button>
      {accountId && (
        <button
          type="button"
          onClick={() => discoverLocations(accountId)}
          disabled={!!busy}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {busy === 'locations' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Locations
        </button>
      )}
    </div>

    {(accounts.length > 0 || accountId) && (
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Google Business Profile Account</span>
          <select
            value={accountId}
            onChange={e => { setAccountId(e.target.value); setLocationId(''); setLocations([]); if (e.target.value) discoverLocations(e.target.value); }}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Select account…</option>
            {accounts.map(a => <option key={a.account_id} value={a.account_id}>{a.account_name || a.account_id}{a.type ? ' · ' + a.type : ''}</option>)}
            {accountId && !accounts.some(a => a.account_id === accountId) && <option value={accountId}>{control.reputation_google_account_name || accountId}</option>}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Business Location</span>
          <select
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            disabled={!accountId}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-50"
          >
            <option value="">Select location…</option>
            {locations.map(l => <option key={l.location_id} value={l.location_id}>{l.title || l.location_id}{l.address ? ' · ' + l.address : ''}</option>)}
            {locationId && !locations.some(l => l.location_id === locationId) && <option value={locationId}>{control.reputation_google_location_name || locationId}</option>}
          </select>
        </label>
      </div>
    )}

    {selectionReady && (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={saveSelection}
          disabled={!!busy}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {busy === 'save' ? 'Saving…' : 'Save Profile Selection'}
        </button>
        <button
          type="button"
          onClick={testEnable}
          disabled={!!busy || !oauthReady}
          className="rounded-lg bg-brand-accent px-3 py-2 text-sm font-bold text-brand-dark disabled:opacity-40"
        >
          {busy === 'test' ? 'Testing Google…' : 'Test & Enable Sync'}
        </button>
      </div>
    )}

    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}
  </div>;
}

export default function ReputationManagementAddOnPanel({ control, update, summary, runtimeStatus }) {
  const fee = Math.max(0, Number(control.reputation_management_monthly_fee || 0));
  const enabled = control.reputation_management_enabled === true;
  const billing = control.reputation_management_billing_enabled !== false;

  return <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-2">
      <Star className="w-5 h-5 text-brand-accent mt-0.5" />
      <div>
        <h2 className="font-bold text-slate-900">Reputation Management Add-On</h2>
        <p className="text-xs text-slate-500">Agency Owner controls for review automation, Google review monitoring, response workflow, and client billing.</p>
      </div>
    </div>

    <div className="p-5 space-y-6">
      <div>
        <h3 className="font-bold text-sm text-slate-900 mb-3">Service & Billing</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Toggle
            label="Reputation Management Enabled"
            checked={enabled}
            onChange={v => update('reputation_management_enabled', v)}
            hint="Master service switch. Review-request history remains intact when disabled."
          />
          <Toggle
            label="Bill Client Monthly"
            checked={billing}
            onChange={v => update('reputation_management_billing_enabled', v)}
            hint="Turn OFF for a trial or promotion while leaving the service active."
          />
          <Field
            label="Monthly Add-On Fee"
            type="number"
            step="0.01"
            value={fee}
            onChange={v => update('reputation_management_monthly_fee', v)}
            hint="Automatically itemized on scheduled agency invoices when service and billing are both enabled."
          />
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-slate-500">Next Monthly Charge</div>
            <div className="text-xl font-black text-slate-900">{enabled && billing ? '$' + fee.toFixed(2) : '$0.00'}</div>
            <div className="text-[11px] text-slate-500 mt-1">{enabled ? (billing ? 'Billable' : 'Service active — promotional/no charge') : 'Service disabled'}</div>
          </div>
        </div>
        <label className="block mt-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1">Client-Facing Add-On Description</span>
          <textarea
            rows={3}
            value={control.reputation_management_offer_summary || 'Automatically request Google reviews after completed jobs, monitor new reviews, draft professional replies with AI, route approvals, publish approved reviews to the website, and track results in the CRM.'}
            onChange={e => update('reputation_management_offer_summary', e.target.value)}
            placeholder="Explain the value of the Reputation Management service shown when the add-on is off."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <span className="block mt-1 text-[11px] text-slate-400">Shown in the client's Business Settings tab when Reputation Management is not active.</span>
        </label>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Google Business Profile Connection</h3>
        <GoogleBusinessConnectionWizard control={control} update={update} runtimeStatus={runtimeStatus} />
        <div className="mt-4 max-w-sm">
          <Field
            label="Negative Review Threshold"
            type="number"
            value={control.reputation_negative_review_threshold ?? 3}
            onChange={v => update('reputation_negative_review_threshold', v)}
            hint="1–5 stars. Reviews at or below this rating are flagged for attention."
          />
        </div>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Monitoring & Response Workflow</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Toggle label="Review Monitoring" checked={control.reputation_monitoring_enabled !== false} onChange={v => update('reputation_monitoring_enabled', v)} />
          <Toggle label="AI Reply Drafts" checked={control.reputation_ai_reply_drafts_enabled !== false} onChange={v => update('reputation_ai_reply_drafts_enabled', v)} hint="Generates a suggested reply; does not post automatically." />
          <Toggle label="Agency Approval Required" checked={control.reputation_agency_approval_required !== false} onChange={v => update('reputation_agency_approval_required', v)} />
          <Toggle label="Allow Client Approval Step" checked={control.reputation_client_approval_enabled === true} onChange={v => update('reputation_client_approval_enabled', v)} hint="Client can approve/edit replies when enabled; agency still controls the integration." />
          <Toggle label="Auto-Post Approved Replies" checked={control.reputation_auto_post_replies === true} onChange={v => update('reputation_auto_post_replies', v)} hint="When a reply reaches final Approved status and the Google connection is ready, post it automatically. Defaults OFF." />
          <Toggle label="New/Low Review Alerts" checked={control.reputation_alerts_enabled !== false} onChange={v => update('reputation_alerts_enabled', v)} />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Field label="AI Response Tone" value={control.reputation_response_tone || 'Professional, warm, concise'} onChange={v => update('reputation_response_tone', v)} />
          <label className="block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Agency Provider / Setup Notes</span>
            <textarea rows={3} value={control.reputation_provider_notes || ''} onChange={e => update('reputation_provider_notes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </label>
        </div>
      </div>

      <div className="border-t pt-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <h3 className="font-bold text-sm text-slate-900">Current Reputation Snapshot</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            ['Reviews', summary?.total_reviews ?? 0],
            ['Avg Rating', Number(summary?.average_rating || 0).toFixed(2)],
            ['New 30 Days', summary?.new_reviews_30d ?? 0],
            ['Needs Attention', summary?.needs_attention ?? 0],
            ['Pending Replies', summary?.pending_responses ?? 0],
            ['Replies Posted', summary?.posted_responses ?? 0],
            ['Requests Sent', summary?.requests_sent ?? 0],
            ['Conversion', (summary?.request_conversion_percent ?? 0) + '%']
          ].map(([label,value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{value}</div>
          </div>)}
        </div>
      </div>

      <div className="border-t pt-4 text-xs text-slate-500">
        Review solicitation remains neutral: eligibility is based on completed-workflow rules, not predicted customer sentiment or star rating. The add-on controls monitoring and response management; it does not gate who receives a review request.
      </div>
    </div>
  </section>;
}
