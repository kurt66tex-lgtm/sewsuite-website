import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Loader2, MapPin, Pause, Play, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const MINUTES = ['ZERO','FIFTEEN','THIRTY','FORTY_FIVE'];
const money = v => '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
const pretty = v => String(v || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function StatusPill({ ok, children }) {
  return <span className={'rounded-full px-2.5 py-1 text-[11px] font-bold ' + (ok ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600')}>{children}</span>;
}
function Field({ label, value, onChange, type='text', placeholder, disabled }) {
  return <label className="block">
    <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
    <input type={type} value={value ?? ''} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500" />
  </label>;
}
function Select({ label, value, onChange, options, disabled }) {
  return <label className="block">
    <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
    <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={disabled} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100">
      {options.map(o => <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>{typeof o === 'string' ? pretty(o) : o.label}</option>)}
    </select>
  </label>;
}

export default function GoogleLocalServicesCampaignManager() {
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [budget, setBudget] = useState('');
  const [bidding, setBidding] = useState('MAXIMIZE_CONVERSIONS');
  const [schedule, setSchedule] = useState({ day_of_week:'MONDAY', start_hour:8, start_minute:'ZERO', end_hour:17, end_minute:'ZERO' });
  const [serviceId, setServiceId] = useState('');
  const [geoQuery, setGeoQuery] = useState('');
  const [geoResults, setGeoResults] = useState([]);

  const call = async (action, payload={}) => {
    const res = await base44.functions.invoke('manageGoogleLocalServicesCampaign', { action, ...payload });
    const d = res?.data || res || {};
    if (d.error) throw new Error(d.error);
    return d;
  };

  const load = async () => {
    setError('');
    try {
      const d = await call('get');
      setData(d);
      const first = selectedId || d.campaigns?.[0]?.id || '';
      setSelectedId(first);
    } catch (e) {
      setError(e.message || 'Unable to load Google Local Services campaign management.');
    }
  };

  useEffect(() => { load(); }, []);

  const campaign = useMemo(() => {
    if (!data?.campaigns?.length) return null;
    return data.campaigns.find(c => c.id === selectedId) || data.campaigns[0];
  }, [data, selectedId]);

  useEffect(() => {
    if (!campaign) return;
    setBudget(campaign.budget_amount || '');
    setBidding(campaign.bidding_strategy_type === 'MANUAL_CPA' ? 'MANUAL_CPA' : 'MAXIMIZE_CONVERSIONS');
  }, [campaign?.id, campaign?.budget_amount, campaign?.bidding_strategy_type]);

  const mutate = async (action, payload, message) => {
    if (!window.confirm('Apply this change to the live Google Local Services campaign?')) return;
    setBusy(action); setError(''); setNotice('');
    try {
      const d = await call(action, payload);
      setNotice(message || 'Google Local Services campaign updated.');
      if (d.snapshot) {
        setData(prev => ({ ...prev, ...d.snapshot }));
      } else {
        await load();
      }
    } catch (e) {
      setError(e.message || 'Google Local Services update failed.');
    } finally {
      setBusy('');
    }
  };

  const searchGeo = async () => {
    if (!geoQuery.trim()) return;
    setBusy('geo'); setError('');
    try {
      const d = await call('search_geo', { query:geoQuery });
      setGeoResults(d.results || []);
    } catch (e) {
      setError(e.message || 'Location search failed.');
    } finally {
      setBusy('');
    }
  };

  const generateRecommendations = async () => {
    setBusy('ai'); setError(''); setNotice('');
    try {
      await call('generate_recommendations', { days:30 });
      setNotice('AI optimization review generated. Recommendations are waiting for review below.');
      await load();
    } catch (e) {
      setError(e.message || 'Unable to generate optimization recommendations.');
    } finally {
      setBusy('');
    }
  };

  const recommendationAction = async (action, rec) => {
    if (action === 'apply_recommendation' && !window.confirm('Apply this recommendation to the live Google Local Services campaign?')) return;
    setBusy(action + ':' + rec.id); setError(''); setNotice('');
    try {
      await call(action, { recommendation_id:rec.id });
      setNotice(action === 'apply_recommendation' ? 'Recommendation applied to Google.' : action === 'dismiss_recommendation' ? 'Recommendation dismissed.' : 'Recommendation approved.');
      await load();
    } catch (e) {
      setError(e.message || 'Recommendation action failed.');
    } finally {
      setBusy('');
    }
  };

  if (!data) return <section className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading campaign management…</div></section>;

  const addOn = data.add_on || {};
  const viewer = data.viewer || {};
  const runtime = data.runtime || {};
  const canApply = viewer.can_apply_changes === true;
  const recs = data.recommendations || [];
  const profile = data.profile || { score:0, checks:[], facts:{}, highlight_candidates:[] };
  const verification = data.verification || { ready:false, artifacts:[], summary:{ total:0, approved:0, pending:0, rejected:0 } };

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Profile & Verification Optimizer</h2>
            <p className="mt-1 text-xs text-slate-500">Compares CRM business facts with the information that matters to a strong Local Services profile and surfaces Google verification status when available.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
            <div className="text-[10px] uppercase tracking-wide text-slate-500">Profile readiness</div>
            <div className="text-2xl font-black text-slate-900">{profile.score || 0}%</div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase text-slate-500">Verification records</div>
              <div className="mt-1 text-xl font-black text-slate-900">{verification.summary?.total ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase text-slate-500">Approved / verified</div>
              <div className="mt-1 text-xl font-black text-green-700">{verification.summary?.approved ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase text-slate-500">Pending</div>
              <div className="mt-1 text-xl font-black text-amber-700">{verification.summary?.pending ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase text-slate-500">Rejected / failed</div>
              <div className="mt-1 text-xl font-black text-red-700">{verification.summary?.rejected ?? 0}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-[10px] uppercase text-slate-500">CRM reviews</div>
              <div className="mt-1 text-xl font-black text-slate-900">{profile.facts?.review_count ?? 0}</div>
              <div className="text-[10px] text-slate-500">{profile.facts?.average_review_rating ? profile.facts.average_review_rating + ' avg rating' : 'No average yet'}</div>
            </div>
          </div>

          {!verification.ready && <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">Google verification reporting will appear here after the Local Services Google Ads connection is authorized and the client Customer ID is configured.</div>}

          {verification.artifacts?.length > 0 && <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Google verification activity</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {verification.artifacts.slice(0,12).map((a,i) => <div key={a.id || i} className="rounded-lg border border-slate-200 p-3">
                <div className="font-semibold text-sm text-slate-900">{pretty(a.artifact_type || 'Verification')}</div>
                <div className="mt-1 text-xs text-slate-500">{pretty(a.status || 'Unknown status')}</div>
                {a.creation_date_time && <div className="mt-1 text-[10px] text-slate-400">{new Date(a.creation_date_time).toLocaleString()}</div>}
              </div>)}
            </div>
          </div>}

          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Profile-quality checklist</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {(profile.checks || []).map(item => <div key={item.key} className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
                {item.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="mt-0.5 text-xs leading-5 text-slate-500">{item.detail}</div>
                </div>
              </div>)}
            </div>
          </div>

          {profile.highlight_candidates?.length > 0 && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="font-bold text-sm text-blue-900">Business Bio / highlight facts to review in Google</div>
            <p className="mt-1 text-xs leading-5 text-blue-800">Google’s Local Services “Business Bio” uses predefined highlights whose options vary by business category. These are CRM facts that may support an available highlight; verify the exact Google option and truth of the claim before selecting it.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.highlight_candidates.map(x => <span key={x} className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-800">{x}</span>)}
            </div>
          </div>}

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800">
            Local Services photos should be authentic, policy-compliant business/work photos. This optimizer can flag missing source imagery and recommend photo categories, but it does not generate or automatically upload Local Services photos.
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Campaign Management</h2>
            <p className="mt-1 text-xs text-slate-500">Budget, status, bidding, ad schedule, location targeting and Local Services job-type targeting.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill ok={runtime.ready && runtime.customer_id_configured}>{runtime.ready && runtime.customer_id_configured ? 'GOOGLE CONNECTED' : 'CONNECTION REQUIRED'}</StatusPill>
            <button onClick={load} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

          {!runtime.ready && <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> The Google Ads API connection is not ready yet. The client setup guide above explains what must be completed first.</div>}

          {addOn.agency_approval_required && !viewer.agency_owner && <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Campaign changes require Agency Owner approval. You can view performance and recommendations here, but live Google settings cannot be changed from this account.</div>}

          {data.campaigns?.length > 1 && <Select label="Local Services campaign" value={campaign?.id || ''} onChange={setSelectedId} options={data.campaigns.map(c => ({value:c.id,label:c.name + ' · ' + c.status}))} />}

          {!campaign && runtime.ready && <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
            <div className="font-semibold text-slate-800">No Local Services campaign found</div>
            <p className="mt-2 text-sm text-slate-500">The initial Local Services campaign must be created and verified in Google. The Google Ads API can manage supported settings after the campaign exists, but it cannot create or delete the underlying Local Services campaign or ad.</p>
          </div>}

          {campaign && <>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-500">Campaign</div><div className="mt-1 font-bold text-slate-900">{campaign.name}</div><div className="text-xs text-slate-500">{campaign.channel_type}</div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-500">Status</div><div className="mt-1 font-bold text-slate-900">{pretty(campaign.status)}</div><div className="text-xs text-slate-500">{pretty(campaign.serving_status)}</div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-500">Budget</div><div className="mt-1 font-bold text-slate-900">{money(campaign.budget_amount)}</div><div className="text-xs text-slate-500">{pretty(campaign.budget_period || campaign.budget_type)}</div></div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-500">Bidding</div><div className="mt-1 font-bold text-slate-900">{pretty(campaign.bidding_strategy_type)}</div></div>
            </div>

            {addOn.campaign_management_enabled && <div className="grid gap-4 border-t border-slate-100 pt-5 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">Campaign status</div>
                <p className="mt-1 text-xs text-slate-500">Pause or enable the existing Local Services campaign.</p>
                <div className="mt-4 flex gap-2">
                  <button disabled={!canApply || busy} onClick={() => mutate('update_status',{campaign_resource_name:campaign.resource_name,status:'ENABLED'},'Campaign enabled.')} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 disabled:opacity-40"><Play className="h-3.5 w-3.5" /> Enable</button>
                  <button disabled={!canApply || busy} onClick={() => mutate('update_status',{campaign_resource_name:campaign.resource_name,status:'PAUSED'},'Campaign paused.')} className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 disabled:opacity-40"><Pause className="h-3.5 w-3.5" /> Pause</button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">Budget</div>
                <p className="mt-1 text-xs text-slate-500">Updates the campaign budget amount supported by Google Ads API.</p>
                <div className="mt-3">
                  <Field label="Budget amount" type="number" value={budget} onChange={setBudget} disabled={!canApply} />
                  <button disabled={!canApply || busy || !Number(budget)} onClick={() => mutate('update_budget',{budget_resource_name:campaign.budget_resource_name,amount_dollars:Number(budget)},'Campaign budget updated.')} className="mt-2 w-full rounded-lg bg-brand-accent px-3 py-2 text-xs font-bold text-brand-dark disabled:opacity-40">Update Budget</button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">Bidding strategy</div>
                <p className="mt-1 text-xs text-slate-500">Local Services supports Maximize Conversions and Manual CPA. Category-level Manual CPA bids remain managed through Google when needed.</p>
                <div className="mt-3">
                  <Select label="Strategy" value={bidding} onChange={setBidding} disabled={!canApply} options={[{value:'MAXIMIZE_CONVERSIONS',label:'Maximize Conversions'},{value:'MANUAL_CPA',label:'Manual CPA'}]} />
                  <button disabled={!canApply || busy} onClick={() => mutate('update_bidding',{campaign_resource_name:campaign.resource_name,strategy:bidding},'Bidding strategy updated.')} className="mt-2 w-full rounded-lg bg-brand-accent px-3 py-2 text-xs font-bold text-brand-dark disabled:opacity-40">Update Bidding</button>
                </div>
              </div>
            </div>}

            <div className="grid gap-5 border-t border-slate-100 pt-5 xl:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">Ad schedule</div>
                <p className="mt-1 text-xs text-slate-500">Google can target up to six schedule periods per day.</p>
                <div className="mt-3 space-y-2">
                  {(campaign.schedules || []).map(s => <div key={s.resource_name} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs"><span>{pretty(s.day_of_week)} · {s.start_hour}:{s.start_minute === 'ZERO' ? '00' : s.start_minute === 'FIFTEEN' ? '15' : s.start_minute === 'THIRTY' ? '30' : '45'}–{s.end_hour}:{s.end_minute === 'ZERO' ? '00' : s.end_minute === 'FIFTEEN' ? '15' : s.end_minute === 'THIRTY' ? '30' : '45'}</span><button disabled={!canApply || busy} onClick={() => mutate('remove_criterion',{criterion_resource_name:s.resource_name},'Ad schedule removed.')} className="text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
                  {(campaign.schedules || []).length === 0 && <div className="text-xs text-slate-400">No API ad-schedule criteria returned.</div>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Select label="Day" value={schedule.day_of_week} onChange={v => setSchedule(s => ({...s,day_of_week:v}))} options={DAYS} disabled={!canApply} />
                  <Field label="Start hour" type="number" value={schedule.start_hour} onChange={v => setSchedule(s => ({...s,start_hour:v}))} disabled={!canApply} />
                  <Select label="Start minute" value={schedule.start_minute} onChange={v => setSchedule(s => ({...s,start_minute:v}))} options={MINUTES} disabled={!canApply} />
                  <Field label="End hour" type="number" value={schedule.end_hour} onChange={v => setSchedule(s => ({...s,end_hour:v}))} disabled={!canApply} />
                  <Select label="End minute" value={schedule.end_minute} onChange={v => setSchedule(s => ({...s,end_minute:v}))} options={MINUTES} disabled={!canApply} />
                </div>
                <button disabled={!canApply || busy} onClick={() => mutate('add_schedule',{campaign_resource_name:campaign.resource_name,...schedule},'Ad schedule added.')} className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">Add Schedule</button>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><div className="font-bold text-slate-900">Location targeting</div></div>
                <div className="mt-3 space-y-2">
                  {(campaign.locations || []).map(loc => <div key={loc.resource_name} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs"><span>{loc.canonical_name || loc.name}</span><button disabled={!canApply || busy} onClick={() => mutate('remove_criterion',{criterion_resource_name:loc.resource_name},'Location target removed.')} className="text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
                  {(campaign.locations || []).length === 0 && <div className="text-xs text-slate-400">No location criteria returned.</div>}
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={geoQuery} onChange={e => setGeoQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchGeo()} placeholder="Search city, ZIP or area" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                  <button onClick={searchGeo} disabled={busy === 'geo' || !geoQuery.trim()} className="rounded-lg border border-slate-300 px-3 py-2 disabled:opacity-40">{busy === 'geo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</button>
                </div>
                {geoResults.length > 0 && <div className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-200 divide-y divide-slate-100">{geoResults.map(g => <div key={g.resource_name} className="flex items-center justify-between gap-2 p-2"><div><div className="text-xs font-semibold text-slate-800">{g.canonical_name || g.name}</div><div className="text-[10px] text-slate-400">{g.target_type} · ID {g.id}</div></div><button disabled={!canApply || busy} onClick={() => mutate('add_location',{campaign_resource_name:campaign.resource_name,geo_target_id:g.id},'Location target added.')} className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold disabled:opacity-40">Add</button></div>)}</div>}
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="font-bold text-slate-900">Service / job-type targeting</div>
                <p className="mt-1 text-xs text-slate-500">Google Local Services uses service IDs that must match the business category and target area.</p>
                <div className="mt-3 space-y-2">
                  {(campaign.services || []).map(s => <div key={s.resource_name} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs"><span>{s.service_id}</span><button disabled={!canApply || busy} onClick={() => mutate('remove_criterion',{criterion_resource_name:s.resource_name},'Service target removed.')} className="text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button></div>)}
                  {(campaign.services || []).length === 0 && <div className="text-xs text-slate-400">No Local Services job-type criteria returned.</div>}
                </div>
                <div className="mt-4">
                  <Field label="Google Local Services service ID" value={serviceId} onChange={setServiceId} placeholder="Example: service identifier from Google" disabled={!canApply} />
                  <button disabled={!canApply || busy || !serviceId.trim()} onClick={() => mutate('add_service',{campaign_resource_name:campaign.resource_name,service_id:serviceId},'Service target added.')} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">Add Service Type</button>
                  {data.recent_service_ids?.length > 0 && <div className="mt-3"><div className="text-[10px] font-bold uppercase text-slate-400">Service IDs seen in recent leads</div><div className="mt-1 flex flex-wrap gap-1">{data.recent_service_ids.slice(0,12).map(id => <button key={id} type="button" onClick={() => setServiceId(id)} className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{id}</button>)}</div></div>}
                </div>
              </div>
            </div>
          </>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-5 w-5 text-brand-accent" />
            <div>
              <h2 className="font-bold text-slate-900">AI Optimization</h2>
              <p className="mt-1 text-xs text-slate-500">Uses Local Services spend, lead quality, booking, completed-job value, response time and review data to recommend improvements.</p>
            </div>
          </div>
          <button disabled={!addOn.ai_optimization_enabled || busy === 'ai'} onClick={generateRecommendations} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-2 text-xs font-bold text-brand-dark disabled:opacity-40">{busy === 'ai' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Generate 30-Day Review</button>
        </div>
        <div className="p-5">
          {!addOn.ai_optimization_enabled && <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">AI optimization is disabled by the Agency Owner.</div>}
          {addOn.ai_optimization_enabled && recs.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400">No optimization recommendations have been generated yet.</div>}
          <div className="space-y-3">
            {recs.map(rec => <div key={rec.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-brand-dark">{rec.category}</span>
                    <StatusPill ok={rec.status === 'Applied'}>{rec.status}</StatusPill>
                    <span className="text-[10px] text-slate-400">{rec.impact} impact · {rec.confidence} confidence</span>
                  </div>
                  <div className="mt-1 font-bold text-slate-900">{rec.title}</div>
                </div>
                {rec.requires_google_change && <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">GOOGLE CHANGE</span>}
              </div>
              <p className="mt-2 text-sm text-slate-700">{rec.summary}</p>
              {rec.rationale && <p className="mt-2 text-xs leading-5 text-slate-500">{rec.rationale}</p>}
              {rec.status === 'Pending Review' && <div className="mt-3 flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => recommendationAction('dismiss_recommendation',rec)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold">Dismiss</button>
                {(viewer.agency_owner || !addOn.agency_approval_required) && <button disabled={busy} onClick={() => recommendationAction('approve_recommendation',rec)} className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Approve</button>}
                {rec.requires_google_change && rec.apply_action && canApply && <button disabled={busy} onClick={() => recommendationAction('apply_recommendation',rec)} className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">Approve & Apply</button>}
                {addOn.agency_approval_required && !viewer.agency_owner && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Circle className="h-3 w-3" /> Waiting for Agency Owner review</span>}
              </div>}
              {rec.status === 'Applied' && <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-green-700"><CheckCircle2 className="h-3.5 w-3.5" /> Applied to Google</div>}
            </div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
