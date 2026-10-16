import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAgencyOwner } from '@/lib/accessControl';

const RANGES = [
  { key:'today', label:'Today' },
  { key:'week', label:'This Week' },
  { key:'month', label:'This Month' },
  { key:'last30', label:'Last 30 Days' },
  { key:'quarter', label:'This Quarter' },
  { key:'ytd', label:'Year to Date' },
  { key:'custom', label:'Custom' }
];

function rangeStart(key, customStart) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'today') return today;
  if (key === 'week') { const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return d; }
  if (key === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === 'last30') { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
  if (key === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1);
  if (key === 'ytd') return new Date(now.getFullYear(), 0, 1);
  return customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getTime() - 30*86400000);
}

export default function ProjectReports() {
  const { user } = useAuth();
  const agencyOwner = isAgencyOwner(user);
  const [raw, setRaw] = useState({ leads: [], jobs: [], reviews: [], seo: [] });
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 500),
      base44.entities.Job.list('-created_date', 500),
      base44.entities.ReviewRequest.list('-created_date', 300),
      base44.entities.SeoPerformanceSnapshot.list('-captured_at', 60).catch(() => [])
    ]).then(([leads, jobs, reviews, seo]) => setRaw({
      leads: leads || [],
      jobs: jobs || [],
      reviews: reviews || [],
      seo: seo || []
    })).finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const ft = (arr) => (agencyOwner && includeTest ? arr || [] : (arr || []).filter(x => !x.is_test_data));
    const leads = ft(raw.leads);
    const jobs = ft(raw.jobs);
    const reviews = ft(raw.reviews);
    const seo = ft(raw.seo);
    const seoBaseline = seo.find(s => s.snapshot_type === 'Baseline') || null;
    const seoLatest = seo[0] || null;
    const start = rangeStart(rangeKey, customStart);
    const end = rangeKey === 'custom' && customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
    const inRange = (value) => {
      if (!value) return false;
      const d = new Date(value);
      return d >= start && d <= end;
    };

    const leadsIn = leads.filter(l => inRange(l.created_date));
    const jobsIn = jobs.filter(j => inRange(j.created_date));
    const completedIn = jobs.filter(j => j.status === 'Completed' && inRange(j.completed_at));
    const convertedLeadIds = new Set(jobsIn.map(j => j.lead_id).filter(Boolean));
    const converted = leadsIn.filter(l => l.status === 'Converted' || l.job_id || convertedLeadIds.has(l.id)).length;
    const approved = jobsIn.filter(j => j.estimate_status === 'Approved');
    const approvedValue = approved.reduce((sum,j)=>sum+Number(j.estimate_amount||0),0);
    const quoteApproval = jobsIn.length ? Math.round(approved.length / jobsIn.length * 100) : 0;

    const active = jobs.filter(j => j.status !== 'Completed' && j.status !== 'Canceled');
    const inProduction = active.filter(j => j.workflow_stage === 'In Production').length;
    const qualityCheck = active.filter(j => j.workflow_stage === 'Quality Check').length;
    const readyFulfillment = active.filter(j => j.workflow_stage === 'Ready for Pickup / Shipping').length;
    const productionDurations = completedIn
      .filter(j => j.production_started_at && j.completed_at)
      .map(j => Math.max(0, (new Date(j.completed_at) - new Date(j.production_started_at))/86400000));
    const avgProductionDays = productionDurations.length
      ? (productionDurations.reduce((a,b)=>a+b,0)/productionDurations.length).toFixed(1)
      : '—';

    const byStage={}, byType={}, bySource={}, byFulfillment={}, byUtm={}, byAcquisition={};
    jobsIn.forEach(j=>{
      const stage=j.workflow_stage||'Quote Needed'; byStage[stage]=(byStage[stage]||0)+1;
      const type=j.service_type||'Unknown'; byType[type]=(byType[type]||0)+1;
      const f=j.fulfillment_method||'Not Set'; byFulfillment[f]=(byFulfillment[f]||0)+1;
    });
    leadsIn.forEach(l=>{
      const source=l.source||'Unknown'; bySource[source]=(bySource[source]||0)+1;
      if (l.utm_source) byUtm[l.utm_source]=(byUtm[l.utm_source]||0)+1;
      let channel = source;
      const ref = String(l.referrer || '').toLowerCase();
      if (l.utm_source) channel = `Campaign: ${l.utm_source}`;
      else if (source === 'Website Form') {
        if (!ref) channel = 'Direct / Unknown';
        else if (ref.includes('google.')) channel = 'Google Organic';
        else if (ref.includes('bing.')) channel = 'Bing Organic';
        else if (ref.includes('facebook.') || ref.includes('instagram.')) channel = 'Social Referral';
        else channel = 'Website Referral';
      }
      byAcquisition[channel]=(byAcquisition[channel]||0)+1;
    });

    const sentReviews = reviews.filter(r => r.request_sent_date && inRange(r.request_sent_date));
    const reviewReceived = sentReviews.filter(r=>r.review_received_date).length;

    return {
      leadsIn, jobsIn, completedIn, approved,
      converted,
      conversion: leadsIn.length ? Math.round(converted/leadsIn.length*100) : 0,
      quoteApproval,
      approvedValue,
      inProduction, qualityCheck, readyFulfillment, avgProductionDays,
      byStage, byType, bySource, byFulfillment, byUtm, byAcquisition,
      reviewSent: sentReviews.length,
      reviewReceived,
      reviewConversion: sentReviews.length ? Math.round(reviewReceived/sentReviews.length*100) : 0,
      seoBaseline,
      seoLatest
    };
  }, [raw, rangeKey, customStart, customEnd, includeTest, agencyOwner]);

  const breakdown = (title,obj) => (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-bold text-brand-dark">{title}</h2>
      <div className="space-y-2">
        {Object.entries(obj).sort((a,b)=>b[1]-a[1]).map(([label,value])=>(
          <div key={label} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-600">{label}</span><span className="font-semibold text-slate-900">{value}</span>
          </div>
        ))}
        {Object.keys(obj).length===0 && <div className="text-sm text-slate-400">No data in this period.</div>}
      </div>
    </section>
  );

  if (loading) return <div className="p-6 text-slate-500">Loading reports…</div>;

  const cards=[
    ['Quote Requests',stats.leadsIn.length,'/admin/inbox'],
    ['Converted to Projects',stats.converted,'/admin/jobs'],
    ['Request → Project',stats.conversion+'%','/admin/jobs'],
    ['Approved Quotes',stats.approved.length,'/admin/jobs'],
    ['Quote Approval',stats.quoteApproval+'%','/admin/jobs'],
    ['Approved Quote Value','$'+stats.approvedValue.toLocaleString(),'/admin/jobs'],
    ['Completed Projects',stats.completedIn.length,'/admin/jobs'],
    ['In Production',stats.inProduction,'/admin/jobs'],
    ['Quality Check',stats.qualityCheck,'/admin/jobs'],
    ['Ready for Fulfillment',stats.readyFulfillment,'/admin/jobs'],
    ['Avg Production Days',stats.avgProductionDays,'/admin/reports'],
    ['Reviews Requested',stats.reviewSent,'/admin/reviews'],
    ['Review Conversion',stats.reviewConversion+'%','/admin/reviews']
  ];

  return (
    <div className="max-w-7xl p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-dark"><TrendingUp className="h-6 w-6" /> Project Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Live acquisition, quote, production, completion and review performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rangeKey==='custom' && <>
            <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
            <span className="text-slate-400">→</span>
            <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs" />
          </>}
          <div className="flex flex-wrap overflow-hidden rounded-lg border border-slate-300">
            {RANGES.map(r=><button key={r.key} onClick={()=>setRangeKey(r.key)} className={`px-2.5 py-1.5 text-xs font-semibold ${rangeKey===r.key?'bg-brand-dark text-white':'bg-white text-slate-600 hover:bg-slate-50'}`}>{r.label}</button>)}
          </div>
          {agencyOwner && <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={includeTest} onChange={e=>setIncludeTest(e.target.checked)} /> Include Test Data</label>}
        </div>
      </div>

      {stats.seoLatest && <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="font-bold text-brand-dark">Organic Search Pilot</h2><p className="mt-1 text-xs text-slate-500">Rolling 28-day Google Search Console performance. Average position is impression-weighted Search Console data, not a Maps/local-pack rank.</p></div>
          {agencyOwner && <Link to="/admin/agency-controls" className="text-xs font-semibold text-blue-600">SEO baseline settings</Link>}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            ['Search Clicks',Number(stats.seoLatest.search_clicks||0).toLocaleString()],
            ['Impressions',Number(stats.seoLatest.search_impressions||0).toLocaleString()],
            ['CTR',(Number(stats.seoLatest.search_ctr||0)*100).toFixed(1)+'%'],
            ['Avg Position',Number(stats.seoLatest.search_average_position||0)>0?Number(stats.seoLatest.search_average_position).toFixed(1):'—'],
            ['Google Organic Leads',Number(stats.seoLatest.crm_google_organic_leads||0).toLocaleString()]
          ].map(([label,value])=><div key={label} className="rounded-lg bg-slate-50 p-4"><div className="text-2xl font-black text-brand-dark">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}
        </div>
        {stats.seoBaseline && stats.seoLatest.id !== stats.seoBaseline.id && <div className="mt-3 text-xs text-slate-500">Baseline {stats.seoBaseline.period_start} → {stats.seoBaseline.period_end}: {Number(stats.seoBaseline.search_clicks||0).toLocaleString()} clicks · {Number(stats.seoBaseline.search_impressions||0).toLocaleString()} impressions · avg position {Number(stats.seoBaseline.search_average_position||0)>0?Number(stats.seoBaseline.search_average_position).toFixed(1):'—'}.</div>}
      </section>}

      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-bold text-brand-dark">Acquisition Funnel</h2>
          <p className="mt-1 text-xs text-slate-500">Real CRM records only unless Agency Owner enables test data.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['1 · Requests',stats.leadsIn.length],
            ['2 · Projects',stats.converted],
            ['3 · Approved Quotes',stats.approved.length],
            ['4 · Completed',stats.completedIn.length]
          ].map(([label,value])=><div key={label} className="rounded-lg bg-slate-50 p-4"><div className="text-2xl font-black text-brand-dark">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div>)}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {cards.map(([label,value,to])=><Link key={label} to={to} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm"><div className="text-2xl font-bold text-brand-dark">{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></Link>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {breakdown('Acquisition Channel',stats.byAcquisition)}
        {breakdown('CRM Lead Source',stats.bySource)}
        {breakdown('Campaign / UTM Source',stats.byUtm)}
        {breakdown('Projects by Workflow Stage',stats.byStage)}
        {breakdown('Projects by Type',stats.byType)}
        {breakdown('Projects by Fulfillment',stats.byFulfillment)}
      </div>

      <div className="mt-5 text-xs text-slate-400">
        Test data is {agencyOwner && includeTest ? 'included' : 'excluded'}. Approved quote value is estimated CRM value, not invoiced revenue.
      </div>
    </div>
  );
}
