import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, CircleAlert, Loader2, RefreshCw, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function pct(v) {
  return Number.isFinite(Number(v)) ? (Number(v) * 100).toFixed(1) + '%' : '—';
}

function num(v) {
  return Number.isFinite(Number(v)) ? Number(v).toLocaleString() : '—';
}

function pos(v) {
  return Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v).toFixed(1) : '—';
}

function delta(latest, baseline, inverse = false) {
  const a = Number(latest);
  const b = Number(baseline);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const d = a - b;
  const improved = inverse ? d < 0 : d > 0;
  return { value: d, improved, flat: Math.abs(d) < 0.0001 };
}

function Metric({ label, value, change, format = 'number', inverse = false }) {
  const display = format === 'percent' ? pct(value) : format === 'position' ? pos(value) : num(value);
  const d = change ? delta(value, change, inverse) : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-black text-slate-900">{display}</div>
      {d && !d.flat && (
        <div className={'mt-1 text-[11px] font-semibold ' + (d.improved ? 'text-green-700' : 'text-amber-700')}>
          {d.value > 0 ? '+' : ''}{format === 'percent' ? (d.value * 100).toFixed(1) + ' pts' : d.value.toFixed(format === 'position' ? 1 : 0)} vs baseline
        </div>
      )}
    </div>
  );
}

export default function SeoPilotBaselinePanel() {
  const [data, setData] = useState(null);
  const [siteUrl, setSiteUrl] = useState('');
  const [ga4PropertyId, setGa4PropertyId] = useState('');
  const [keywordsText, setKeywordsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const call = async (action, payload = {}) => {
    const res = await base44.functions.invoke('manageSeoPilotBaseline', { action, ...payload });
    const out = res?.data || res || {};
    if (out.error) throw new Error(out.error);
    return out;
  };

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      const out = await call('get');
      setData(out);
      setSiteUrl(out.selected_site_url || '');
      setGa4PropertyId(out.ga4_property_id || '');
      setKeywordsText((out.tracking_keywords || []).filter(x => x?.active !== false).map(x => x.keyword).join('\n'));
    } catch (e) {
      setError(e.message || 'Unable to load SEO pilot baseline.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const keywords = useMemo(() => keywordsText.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 100).map(keyword => ({ keyword, active: true })), [keywordsText]);

  const capture = async (snapshotType) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const out = await call('capture', {
        snapshot_type: snapshotType,
        site_url: siteUrl,
        ga4_property_id: ga4PropertyId,
        tracking_keywords: keywords
      });
      setNotice(snapshotType === 'Baseline' ? 'Day-zero SEO baseline captured.' : 'SEO performance snapshot captured.');
      await load();
      return out;
    } catch (e) {
      setError(e.message || 'Unable to capture SEO snapshot.');
    } finally {
      setBusy(false);
    }
  };

  const baseline = data?.baseline || null;
  const latest = data?.latest || null;
  const gscReady = data?.connectors?.search_console_connected;
  const gaReady = data?.connectors?.analytics_connected;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-start gap-2">
          <BarChart3 className="mt-0.5 h-5 w-5 text-brand-accent" />
          <div>
            <h2 className="font-bold text-slate-900">Live Pilot SEO Baseline & Trends</h2>
            <p className="text-xs text-slate-500">Preserves a rolling 28-day Search Console benchmark so post-launch performance can be compared to the pre-launch site.</p>
          </div>
        </div>
        <button onClick={load} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Refresh
        </button>
      </div>

      <div className="space-y-5 p-5">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>}

        <div className="grid gap-3 md:grid-cols-2">
          <div className={'rounded-lg border p-3 ' + (gscReady ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50')}>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              {gscReady ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <CircleAlert className="h-4 w-4 text-amber-600" />}
              Google Search Console
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-600">{gscReady ? 'Connected. Organic search snapshots can be captured.' : 'Not connected. Open Base44 Integrations and connect Google Search Console before the day-zero capture.'}</div>
          </div>
          <div className={'rounded-lg border p-3 ' + (gaReady ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50')}>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              {gaReady ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <CircleAlert className="h-4 w-4 text-slate-400" />}
              Google Analytics
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-600">{gaReady ? 'Connected. Analytics metrics will be included when a GA4 property ID is entered.' : 'Optional but recommended. Search Console baseline works without Analytics.'}</div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Search Console Property</span>
            {data?.sites?.length ? (
              <select value={siteUrl} onChange={e=>setSiteUrl(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select property…</option>
                {data.sites.map(s => <option key={s.site_url} value={s.site_url}>{s.site_url} · {s.permission_level}</option>)}
              </select>
            ) : (
              <input value="" readOnly placeholder={gscReady ? 'Connected, but no Search Console properties were returned' : 'Connect Search Console to list properties'} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500" />
            )}
            {gscReady && data?.sites_error && <span className="mt-1 block text-[11px] text-amber-700">{data.sites_error}</span>}
            {gscReady && !data?.sites_error && !data?.sites?.length && <span className="mt-1 block text-[11px] text-amber-700">The connected Google account did not return any verified Search Console properties.</span>}
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Google Analytics Property <span className="font-normal text-slate-400">(optional)</span></span>
            {data?.analytics_properties?.length ? (
              <select value={ga4PropertyId} onChange={e=>setGa4PropertyId(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select GA4 property…</option>
                {data.analytics_properties.map(p => <option key={p.property_id} value={p.property_id}>{p.display_name} · {p.property_id}{p.account ? ' · ' + p.account : ''}</option>)}
              </select>
            ) : (
              <input value={ga4PropertyId} onChange={e=>setGa4PropertyId(e.target.value.replace(/[^0-9]/g,''))} placeholder={gaReady ? 'No GA4 properties returned' : 'Connect Google Analytics to list properties'} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            )}
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-600">Tracked Organic Queries <span className="font-normal text-slate-400">(one per line)</span></span>
          <textarea rows={5} value={keywordsText} onChange={e=>setKeywordsText(e.target.value)} placeholder={'custom embroidery allen tx\nscreen printing allen tx\ndtf printing allen tx'} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <span className="mt-1 block text-[11px] text-slate-400">Search Console average position is measured from real impressions; it is not a simulated rank checker or Google Maps/local-pack position.</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {!baseline ? (
            <button onClick={()=>capture('Baseline')} disabled={busy || !gscReady || !siteUrl} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-40">
              <Search className="h-4 w-4" /> Capture Day-Zero Baseline
            </button>
          ) : (
            <button onClick={()=>capture('Weekly')} disabled={busy || !gscReady || !siteUrl} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-40">
              <RefreshCw className="h-4 w-4" /> Capture Current Snapshot
            </button>
          )}
          {baseline && <div className="self-center text-xs text-slate-500">Baseline captured {new Date(baseline.captured_at).toLocaleString()} · period {baseline.period_start} to {baseline.period_end}</div>}
        </div>

        {latest && (
          <>
            <div>
              <div className="mb-2 text-sm font-bold text-slate-900">{baseline && latest.id !== baseline.id ? 'Current rolling 28-day performance' : 'Baseline rolling 28-day performance'}</div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Metric label="Search Clicks" value={latest.search_clicks} change={baseline && latest.id !== baseline.id ? baseline.search_clicks : null} />
                <Metric label="Impressions" value={latest.search_impressions} change={baseline && latest.id !== baseline.id ? baseline.search_impressions : null} />
                <Metric label="CTR" value={latest.search_ctr} change={baseline && latest.id !== baseline.id ? baseline.search_ctr : null} format="percent" />
                <Metric label="Avg Position" value={latest.search_average_position} change={baseline && latest.id !== baseline.id ? baseline.search_average_position : null} format="position" inverse />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 text-sm font-bold text-slate-900">Tracked Queries</div>
                <div className="space-y-2">
                  {(latest.tracked_queries || []).map(q => (
                    <div key={q.query} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-slate-700">{q.query}</span>
                      <span className="shrink-0 font-semibold text-slate-900">{q.found ? 'Pos. ' + pos(q.position) : 'No impressions'}</span>
                    </div>
                  ))}
                  {(latest.tracked_queries || []).length === 0 && <div className="text-sm text-slate-400">No tracked queries configured yet.</div>}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 text-sm font-bold text-slate-900">Business Activity in Same Period</div>
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Website Leads" value={latest.crm_website_leads} />
                  <Metric label="Google-Attributed Leads" value={latest.crm_google_leads} />
                  <Metric label="Google Organic Leads" value={latest.crm_google_organic_leads} />
                  <Metric label="Google Reviews Stored" value={latest.review_count} />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900">Snapshot History</div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-xs uppercase text-slate-500"><tr><th className="px-4 py-2 text-left">Captured</th><th className="px-4 py-2 text-left">Type</th><th className="px-4 py-2 text-right">Clicks</th><th className="px-4 py-2 text-right">Impressions</th><th className="px-4 py-2 text-right">CTR</th><th className="px-4 py-2 text-right">Avg Position</th><th className="px-4 py-2 text-right">Website Leads</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.snapshots || []).slice(0,12).map(s => <tr key={s.id}><td className="px-4 py-2 text-xs text-slate-600">{new Date(s.captured_at).toLocaleDateString()}</td><td className="px-4 py-2">{s.snapshot_type}</td><td className="px-4 py-2 text-right">{num(s.search_clicks)}</td><td className="px-4 py-2 text-right">{num(s.search_impressions)}</td><td className="px-4 py-2 text-right">{pct(s.search_ctr)}</td><td className="px-4 py-2 text-right">{pos(s.search_average_position)}</td><td className="px-4 py-2 text-right">{num(s.crm_website_leads)}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
