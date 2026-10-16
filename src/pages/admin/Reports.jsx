import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { calculateFirstTripCompletion, isWaitingOnParts, isCompletedServiceOutcome } from '@/lib/visitUtils';
import GoogleLocalLeadsOverview from '@/components/admin/GoogleLocalLeadsOverview';
import ProjectReports from '@/components/admin/ProjectReports';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { isProjectQuoteModel } from '@/lib/businessModel';

const RANGES = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'quarter', label: 'This Quarter' },
  { key: 'ytd', label: 'Year to Date' },
  { key: 'custom', label: 'Custom' },
];

function getRangeStart(rangeKey, customStart) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (rangeKey) {
    case 'today': return today;
    case 'week': { const d = new Date(today); d.setDate(d.getDate() - d.getDay()); return d; }
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'last30': { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
    case 'quarter': { const q = Math.floor(now.getMonth() / 3); return new Date(now.getFullYear(), q * 3, 1); }
    case 'ytd': return new Date(now.getFullYear(), 0, 1);
    case 'custom': return customStart ? new Date(customStart + 'T00:00:00') : new Date(now.getTime() - 30 * 86400000);
    default: { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
  }
}

export default function Reports() {
  const { settings } = useBusinessSettings();
  return isProjectQuoteModel(settings) ? <ProjectReports /> : <FieldServiceReports />;
}

function FieldServiceReports() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 500),
      base44.entities.Job.list('-created_date', 500),
      base44.entities.Appointment.list('-created_date', 500),
      base44.entities.JobPart.list('-created_date', 500),
      base44.entities.Customer.list('-created_date', 500),
      base44.entities.Technician.list('-created_date', 200),
      base44.entities.ServiceLocation.list('-created_date', 500),
      base44.entities.EquipmentAsset.list('-created_date', 500),
      base44.entities.ApplianceUnit.list('-created_date', 500),
      base44.entities.ReviewRequest.list('-created_date', 200),
      base44.entities.Review.list('-created_date', 200),
    ]).then(([leads, jobs, visits, parts, customers, technicians, locs, assets, appliances, reviewReqs, reviews]) => {
      setRawData({ leads, jobs, visits, parts, customers, technicians, locs, assets, appliances, reviewReqs, reviews });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rangeStart = getRangeStart(rangeKey, customStart);
  const rangeEnd = rangeKey === 'custom' && customEnd ? new Date(customEnd + 'T23:59:59') : new Date();

  const inRange = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= rangeStart && d <= rangeEnd;
  };

  const stats = useMemo(() => {
    if (!rawData) return null;
    const ft = (arr) => (includeTest ? arr || [] : (arr || []).filter((r) => !r.is_test_data));
    const leads = ft(rawData.leads);
    const jobs = ft(rawData.jobs);
    const visits = ft(rawData.visits);
    const parts = ft(rawData.parts);
    const reviewReqs = ft(rawData.reviewReqs);
    const reviews = ft(rawData.reviews); // retained for future public-review reporting
    const techs = rawData.technicians || [];
    const locs = rawData.locs || [];
    const assets = rawData.assets || [];
    const appliances = rawData.appliances || [];

    const locMap = {}; locs.forEach((l) => { locMap[l.id] = l; });
    const assetMap = {}; assets.forEach((a) => { assetMap[a.id] = a; });
    const appMap = {}; appliances.forEach((a) => { appMap[a.id] = a; });
    const techMap = {}; techs.forEach((t) => { techMap[t.id] = t; });

    const visitsByJob = {};
    visits.forEach((v) => { if (!visitsByJob[v.job_id]) visitsByJob[v.job_id] = []; visitsByJob[v.job_id].push(v); });
    const partsByJob = {};
    parts.forEach((p) => { if (!partsByJob[p.job_id]) partsByJob[p.job_id] = []; partsByJob[p.job_id].push(p); });

    // Range-filtered records
    const leadsIn = leads.filter((l) => inRange(l.created_date));
    const jobsIn = jobs.filter((j) => inRange(j.created_date));
    const completedIn = jobs.filter((j) => j.status === 'Completed' && j.completed_at && inRange(j.completed_at));

    // Lead → Job conversion
    const bookedFromLeads = leadsIn.filter((l) => l.status === 'Converted' || l.job_id).length;
    const conversionRate = leadsIn.length > 0 ? Math.round((bookedFromLeads / leadsIn.length) * 100) : 0;

    // First-trip completion (visit-derived)
    const eligibleCompleted = completedIn.filter((j) => {
      const jv = visitsByJob[j.id] || [];
      return jv.some((v) => v.status === 'Complete' && isCompletedServiceOutcome(v.visit_outcome));
    });
    const firstTripCount = eligibleCompleted.filter((j) => calculateFirstTripCompletion(visitsByJob[j.id] || [], j.status)).length;
    const firstTripRate = eligibleCompleted.length > 0 ? Math.round((firstTripCount / eligibleCompleted.length) * 100) : 0;

    // Return visit rate
    const withReturnVisit = completedIn.filter((j) => {
      const jv = visitsByJob[j.id] || [];
      return jv.some((v) => v.visit_type === 'Return Visit' && v.status === 'Complete');
    });
    const returnVisitRate = completedIn.length > 0 ? Math.round((withReturnVisit.length / completedIn.length) * 100) : 0;

    // Avg visits per completed job
    const totalVisits = completedIn.reduce((sum, j) => sum + (visitsByJob[j.id]?.length || 0), 0);
    const avgVisits = completedIn.length > 0 ? (totalVisits / completedIn.length).toFixed(1) : '0';

    // Waiting parts
    const waitingPartsJobs = jobs.filter((j) => isWaitingOnParts(j.status, partsByJob[j.id] || []));
    const avgDaysWaiting = waitingPartsJobs.length > 0
      ? Math.round(waitingPartsJobs.reduce((sum, j) => {
          const lastVisit = (visitsByJob[j.id] || []).filter((v) => v.status === 'Complete').sort((a, b) => (b.completed_time || '').localeCompare(a.completed_time || ''))[0];
          const refDate = lastVisit?.completed_time ? new Date(lastVisit.completed_time) : new Date(j.created_date);
          return sum + Math.max(0, Math.floor((Date.now() - refDate.getTime()) / 86400000));
        }, 0) / waitingPartsJobs.length)
      : 0;

    // Review workflow metrics. Use ReviewRequest lifecycle dates so the
    // denominator and numerator come from the same CRM cohort. Public Google
    // reviews imported for the website are not assumed to map 1:1 to requests.
    const sentReviewRequests = reviewReqs.filter((r) => r.request_sent_date && inRange(r.request_sent_date));
    const reviewsRequested = sentReviewRequests.length;
    const reviewsReceived = sentReviewRequests.filter((r) => r.review_received_date).length;
    const reviewConversion = reviewsRequested > 0 ? Math.round((reviewsReceived / reviewsRequested) * 100) : 0;

    // Revenue
    const hasAmounts = completedIn.some((j) => j.estimate_amount);
    const revenue = hasAmounts ? completedIn.reduce((sum, j) => sum + (j.estimate_amount || 0), 0) : null;
    const approvedOnly = completedIn.filter((j) => j.estimate_status === 'Approved');
    const approvedRevenue = approvedOnly.reduce((sum, j) => sum + (j.estimate_amount || 0), 0);

    // Breakdowns
    const byService = {}; jobsIn.forEach((j) => { const k = j.service_type || 'Unknown'; byService[k] = (byService[k] || 0) + 1; });
    const byManufacturer = {}; jobsIn.forEach((j) => {
      const asset = j.equipment_asset_id ? assetMap[j.equipment_asset_id] : null;
      const appliance = j.appliance_id ? appMap[j.appliance_id] : null;
      const k = asset?.manufacturer || appliance?.brand || 'Unknown';
      byManufacturer[k] = (byManufacturer[k] || 0) + 1;
    });
    const byCity = {}; jobsIn.forEach((j) => { const l = j.service_location_id ? locMap[j.service_location_id] : null; const k = l?.city || 'Unknown'; byCity[k] = (byCity[k] || 0) + 1; });
    const bySource = {}; leadsIn.forEach((l) => { const k = l.source || 'Unknown'; bySource[k] = (bySource[k] || 0) + 1; });
    const byStatus = {}; jobsIn.forEach((j) => { const k = j.status || 'Unknown'; byStatus[k] = (byStatus[k] || 0) + 1; });
    const byTech = {}; jobsIn.forEach((j) => { const k = j.assigned_technician_id ? (techMap[j.assigned_technician_id]?.first_name || 'Unknown') : 'Unassigned'; byTech[k] = (byTech[k] || 0) + 1; });

    // Technician metrics
    // COMPLETED VISITS: status = Complete, completed_time falls within selected range
    // COMPLETED JOBS PER TECHNICIAN: Credit the Job to the technician who completed
    //   the final completed-service visit. The completed Job date must fall in the range.
    //   Do not attribute the same completed Job to multiple technicians.
    const creditedJobIds = new Set();
    const techMetrics = techs.filter((t) => t.active !== false).map((t) => {
      const tVisits = visits.filter((v) => v.technician_id === t.id && v.status === 'Complete' && v.completed_time && inRange(v.completed_time));
      // Credit completed jobs to the technician on the final completed-service visit
      const tJobs = completedIn.filter((j) => {
        if (creditedJobIds.has(j.id)) return false; // don't double-credit
        const repairVisits = (visitsByJob[j.id] || [])
          .filter(v => v.status === 'Complete' && isCompletedServiceOutcome(v.visit_outcome))
          .sort((a, b) => (b.completed_time || '').localeCompare(a.completed_time || ''));
        if (repairVisits.length === 0) return false;
        if (repairVisits[0].technician_id !== t.id) return false;
        creditedJobIds.add(j.id);
        return true;
      });
      const tEligible = tJobs.filter((j) => {
        const jv = visitsByJob[j.id] || [];
        return jv.some((v) => v.status === 'Complete' && isCompletedServiceOutcome(v.visit_outcome));
      });
      const tFirstTrip = tEligible.filter((j) => calculateFirstTripCompletion(visitsByJob[j.id] || [], j.status)).length;
      const tReturnVisits = tJobs.filter((j) => (visitsByJob[j.id] || []).some((v) => v.visit_type === 'Return Visit' && v.status === 'Complete')).length;
      return {
        name: `${t.first_name} ${t.last_name || ''}`.trim(),
        completedVisits: tVisits.length,
        completedJobs: tJobs.length,
        firstTripRate: tEligible.length > 0 ? Math.round((tFirstTrip / tEligible.length) * 100) : null,
        returnRate: tJobs.length > 0 ? Math.round((tReturnVisits / tJobs.length) * 100) : null,
      };
    });

    return {
      leads: leadsIn.length, bookedJobs: bookedFromLeads, conversionRate,
      completed: completedIn.length, firstTripRate, firstTripNumerator: firstTripCount, firstTripDenominator: eligibleCompleted.length,
      returnVisitRate, avgVisits, waitingParts: waitingPartsJobs.length, avgDaysWaiting,
      reviewsRequested, reviewsReceived, reviewConversion,
      revenue, approvedRevenue, hasAmounts,
      byService, byManufacturer, byCity, bySource, byStatus, byTech, techMetrics,
      totalJobs: jobsIn.length,
    };
  }, [rawData, rangeKey, customStart, customEnd, includeTest]);

  if (loading) return <div className="p-6 text-center text-slate-400">Loading reports…</div>;
  if (!stats) return <div className="p-6 text-center text-slate-400">No data available.</div>;

  const kpis = [
    { label: 'Leads / Requests', value: stats.leads, to: '/admin/inbox' },
    { label: 'Booked Jobs', value: stats.bookedJobs, to: '/admin/jobs' },
    { label: 'Conversion Rate', value: `${stats.conversionRate}%`, to: '/admin/jobs' },
    { label: 'Completed Jobs', value: stats.completed, to: '/admin/jobs' },
    { label: 'First-Trip Completion', value: `${stats.firstTripRate}%`, to: '/admin/reports' },
    { label: 'Return Visit Rate', value: `${stats.returnVisitRate}%`, to: '/admin/reports' },
    { label: 'Avg Visits / Job', value: stats.avgVisits, to: '/admin/jobs' },
    { label: 'Waiting Parts', value: stats.waitingParts, to: '/admin/jobs' },
    { label: 'Avg Days Waiting', value: stats.avgDaysWaiting, to: '/admin/jobs' },
    { label: 'Reviews Requested', value: stats.reviewsRequested, to: '/admin/reviews' },
    { label: 'Reviews Received', value: stats.reviewsReceived, to: '/admin/reviews' },
    { label: 'Review Conversion', value: `${stats.reviewConversion}%`, to: '/admin/reviews' },
  ];

  const renderBreakdown = (title, counts, total, linkTo) => {
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return null;
    const usePct = total >= 5;
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-dark mb-3">{title}</h2>
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 font-medium">{k}</span>
                <Link to={linkTo} className="text-slate-500 hover:text-brand-dark">
                  {v}{usePct ? ` (${Math.round((v / (total || 1)) * 100)}%)` : ''}
                </Link>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-accent rounded-full" style={{ width: `${(v / (total || 1)) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2"><TrendingUp className="w-6 h-6" /> Reports</h1>
          <p className="text-sm text-slate-500">Operational performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          {rangeKey === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
              <span className="text-slate-400">→</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm" />
            </div>
          )}
          <div className="flex border border-slate-300 rounded-lg overflow-hidden">
            {RANGES.map((r) => (
              <button key={r.key} onClick={() => setRangeKey(r.key)} className={`px-3 py-1.5 text-xs font-semibold ${rangeKey === r.key ? 'bg-brand-dark text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{r.label}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} className="rounded" /> Test Data
          </label>
        </div>
      </div>

      <GoogleLocalLeadsOverview />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        {kpis.map((c, i) => (
          <Link key={i} to={c.to} className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow">
            <div className="text-xl font-bold text-brand-dark">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Revenue */}
      {stats.revenue !== null && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h2 className="font-bold text-brand-dark mb-3 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Revenue (range)</h2>
          <div className="flex gap-6">
            <div>
              <div className="text-2xl font-bold text-brand-dark">${stats.approvedRevenue.toLocaleString()}</div>
              <div className="text-xs text-slate-500">Approved / Estimated Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-400">${stats.revenue.toLocaleString()}</div>
              <div className="text-xs text-slate-400">All Completed (incl. unapproved)</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Based on estimate_amount for completed jobs. Labeled as estimated — not actual invoiced revenue.</p>
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {renderBreakdown('Jobs by Service', stats.byService, stats.totalJobs, '/admin/jobs')}
        {renderBreakdown('Jobs by Manufacturer / Brand', stats.byManufacturer, stats.totalJobs, '/admin/jobs')}
        {renderBreakdown('Jobs by City / Service Area', stats.byCity, stats.totalJobs, '/admin/jobs')}
        {renderBreakdown('Leads by Source', stats.bySource, stats.leads, '/admin/inbox')}
        {renderBreakdown('Jobs by Technician', stats.byTech, stats.totalJobs, '/admin/jobs')}
        {renderBreakdown('Jobs by Status', stats.byStatus, stats.totalJobs, '/admin/jobs')}
      </div>

      {/* Technician Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-slate-100"><h2 className="font-bold text-brand-dark">Technician Metrics</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Technician</th>
              <th className="text-left px-4 py-3">Completed Visits</th>
              <th className="text-left px-4 py-3">Completed Jobs</th>
              <th className="text-left px-4 py-3">First-Trip Completion</th>
              <th className="text-left px-4 py-3">Return Visit Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stats.techMetrics.map((t, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                <td className="px-4 py-3">{t.completedVisits}</td>
                <td className="px-4 py-3">{t.completedJobs}</td>
                <td className="px-4 py-3">{t.firstTripRate !== null ? `${t.firstTripRate}%` : '—'}</td>
                <td className="px-4 py-3">{t.returnRate !== null ? `${t.returnRate}%` : '—'}</td>
              </tr>
            ))}
            {stats.techMetrics.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No technician data in range.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-400 space-y-1">
        <p>First-Trip Completion: {stats.firstTripNumerator}/{stats.firstTripDenominator} eligible completed jobs.
        Test data {includeTest ? 'included' : 'excluded'}. Revenue shown as estimated — not actual invoiced amounts.</p>
        <p>Technician Attribution: Completed jobs are credited to the technician who performed the final completed-service visit. Each completed job is attributed to exactly one technician. Completed visits count only visits with status = Complete and completed_time within the selected range.</p>
      </div>
    </div>
  );
}