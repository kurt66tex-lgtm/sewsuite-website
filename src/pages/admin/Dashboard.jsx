import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NewServiceCallDrawer from '@/components/admin/NewServiceCallDrawer';
import ActionQueue from '@/components/admin/dashboard/ActionQueue';
import TodaySchedule from '@/components/admin/dashboard/TodaySchedule';
import ProjectDashboard from '@/components/admin/dashboard/ProjectDashboard';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { isProjectQuoteModel } from '@/lib/businessModel';
import {
  isWaitingOnParts,
  isReadyForReturnVisit,
  hasPendingReturnVisit,
  calculateFirstTripCompletion,
  isCompletedServiceOutcome,
} from '@/lib/visitUtils';

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day(s) ago`;
}

export default function Dashboard() {
  const { settings } = useBusinessSettings();
  return isProjectQuoteModel(settings) ? <ProjectDashboard /> : <FieldServiceDashboard />;
}

function FieldServiceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [leads, jobs, visits, parts, customers, technicians, serviceLocations, reviews] = await Promise.all([
          base44.entities.Lead.list('-created_date', 500),
          base44.entities.Job.list('-created_date', 500),
          base44.entities.Appointment.list('-created_date', 500),
          base44.entities.JobPart.list('-created_date', 500),
          base44.entities.Customer.list('-created_date', 500),
          base44.entities.Technician.filter({ active: true }),
          base44.entities.ServiceLocation.list('-created_date', 500),
          base44.entities.ReviewRequest.list('-created_date', 200),
        ]);

        const ft = (arr) => (includeTest ? arr || [] : (arr || []).filter((r) => !r.is_test_data));
        const fLeads = ft(leads);
        const fJobs = ft(jobs);
        const fVisits = ft(visits);
        const fParts = ft(parts);
        const fReviews = ft(reviews);

        const custMap = {};
        customers.forEach((c) => { custMap[c.id] = c; });
        const locMap = {};
        serviceLocations.forEach((l) => { locMap[l.id] = l; });
        const partsByJob = {};
        fParts.forEach((p) => { if (!partsByJob[p.job_id]) partsByJob[p.job_id] = []; partsByJob[p.job_id].push(p); });
        const visitsByJob = {};
        fVisits.forEach((v) => { if (!visitsByJob[v.job_id]) visitsByJob[v.job_id] = []; visitsByJob[v.job_id].push(v); });

        const localNow = new Date();
        const todayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
        const todaysVisits = fVisits.filter(
          (v) => v.status !== 'Canceled' && (v.scheduled_date === todayStr || (v.scheduled_start && v.scheduled_start.slice(0, 10) === todayStr))
        );

        // --- Action Queue ---
        const actions = [];

        fLeads.filter((l) => l.safety_flag && l.status !== 'Converted' && l.status !== 'Closed').forEach((l) => {
          actions.push({
            id: `safety-${l.id}`, type: 'SAFETY_FLAG', priority: 'high',
            customer: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
            appliance: l.service_type || l.asset_type || l.appliance_type, city: l.city,
            waitTime: `Received ${relativeTime(l.created_date)}`,
            actionLabel: 'Review Now', actionTo: '/admin/inbox',
            isTestData: !!l.is_test_data,
          });
        });

        fLeads.filter((l) => l.status === 'New' && !l.safety_flag).forEach((l) => {
          actions.push({
            id: `new-${l.id}`, type: 'NEW_REQUEST', priority: 'high',
            customer: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
            appliance: l.service_type || l.asset_type || l.appliance_type, city: l.city,
            waitTime: `Received ${relativeTime(l.created_date)}`,
            actionLabel: 'Review Request', actionTo: '/admin/inbox',
            isTestData: !!l.is_test_data,
          });
        });

        const dueFollowUps = fLeads.filter(l =>
          l.status !== 'Converted' &&
          l.status !== 'Closed' &&
          l.follow_up_date &&
          l.follow_up_date <= todayStr
        );
        const dueFollowUpIds = new Set(dueFollowUps.map(l => l.id));

        dueFollowUps.forEach((l) => {
          const overdue = l.follow_up_date < todayStr;
          actions.push({
            id: `followup-${l.id}`,
            type: 'FOLLOW_UP_DUE',
            priority: overdue ? 'high' : 'medium',
            customer: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
            appliance: l.service_type || l.asset_type || l.appliance_type,
            city: l.city,
            waitTime: overdue ? `Overdue since ${l.follow_up_date}` : 'Due today',
            actionLabel: 'Follow Up',
            actionTo: '/admin/inbox',
            isTestData: !!l.is_test_data,
          });
        });

        fLeads.filter((l) => l.status === 'Waiting on Customer' && !dueFollowUpIds.has(l.id)).forEach((l) => {
          actions.push({
            id: `wait-${l.id}`, type: 'WAITING_CUSTOMER', priority: 'medium',
            customer: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
            appliance: l.service_type || l.asset_type || l.appliance_type, city: l.city,
            waitTime: `Updated ${relativeTime(l.updated_date)}`,
            actionLabel: 'Follow Up', actionTo: '/admin/inbox',
          });
        });

        const twoDaysAgo = Date.now() - 2 * 86400000;
        fLeads.filter((l) =>
          l.status === 'Working' &&
          !dueFollowUpIds.has(l.id) &&
          !l.follow_up_date &&
          new Date(l.updated_date).getTime() < twoDaysAgo
        ).forEach((l) => {
          actions.push({
            id: `overdue-${l.id}`, type: 'OVERDUE_FOLLOWUP', priority: 'medium',
            customer: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'Unknown',
            appliance: l.service_type || l.asset_type || l.appliance_type, city: l.city,
            waitTime: `Updated ${relativeTime(l.updated_date)}`,
            actionLabel: 'Follow Up', actionTo: '/admin/inbox',
          });
        });

        fJobs.filter((j) => isReadyForReturnVisit(j.status, partsByJob[j.id] || []) && !hasPendingReturnVisit(visitsByJob[j.id] || [])).forEach((j) => {
          const c = custMap[j.customer_id];
          const loc = j.service_location_id ? locMap[j.service_location_id] : null;
          actions.push({
            id: `ready-${j.id}`, type: 'PARTS_READY', priority: 'high',
            customer: c ? `${c.first_name} ${c.last_name}` : '—',
            jobNumber: j.job_number, appliance: j.service_type, city: loc?.city,
            waitTime: 'Parts received',
            actionLabel: 'Schedule Return', actionTo: `/admin/jobs?job=${j.id}`,
            isTestData: !!j.is_test_data,
          });
        });

        fJobs.forEach((j) => {
          const jp = partsByJob[j.id] || [];
          const bo = jp.find((p) => p.status === 'Backordered' || (p.status === 'Ordered' && p.expected_date && new Date(p.expected_date) < new Date()));
          if (bo) {
            const c = custMap[j.customer_id];
            const loc = j.service_location_id ? locMap[j.service_location_id] : null;
            actions.push({
              id: `bo-${j.id}`, type: 'PART_BACKORDERED', priority: 'high',
              customer: c ? `${c.first_name} ${c.last_name}` : '—',
              jobNumber: j.job_number, appliance: j.service_type, city: loc?.city,
              waitTime: bo.expected_date ? `Expected ${bo.expected_date}` : `Ordered ${relativeTime(bo.ordered_date)}`,
              actionLabel: 'View Job', actionTo: `/admin/jobs?job=${j.id}`,
            });
          }
        });

        fJobs.filter((j) => j.safety_flag && j.status !== 'Completed' && j.status !== 'Canceled').forEach((j) => {
          const c = custMap[j.customer_id];
          const loc = j.service_location_id ? locMap[j.service_location_id] : null;
          actions.push({
            id: `safety-job-${j.id}`, type: 'SAFETY_FLAG', priority: 'high',
            customer: c ? `${c.first_name} ${c.last_name}` : '—',
            jobNumber: j.job_number, appliance: j.service_type, city: loc?.city,
            waitTime: 'Safety-flagged service call',
            actionLabel: 'Review Job', actionTo: `/admin/jobs?job=${j.id}`,
            isTestData: !!j.is_test_data,
          });
        });

        fJobs.filter((j) => j.status === 'Open' && !j.safety_flag && !isWaitingOnParts(j.status, partsByJob[j.id] || []) && !isReadyForReturnVisit(j.status, partsByJob[j.id] || [])).forEach((j) => {
          const c = custMap[j.customer_id];
          const loc = j.service_location_id ? locMap[j.service_location_id] : null;
          actions.push({
            id: `unsched-${j.id}`, type: 'UNSCHEDULED', priority: 'medium',
            customer: c ? `${c.first_name} ${c.last_name}` : '—',
            jobNumber: j.job_number, appliance: j.service_type, city: loc?.city,
            waitTime: `Created ${relativeTime(j.created_date)}`,
            actionLabel: 'Schedule', actionTo: `/admin/jobs?job=${j.id}`,
          });
        });

        const effectiveReviewDue = (r) => {
          if (r.status === 'Request Due' || r.status === 'Reminder Due') return true;
          if (r.status === 'Eligible' && r.request_due_date && todayStr >= r.request_due_date) return true;
          if (r.status === 'Request Sent' && r.reminder_due_date && todayStr >= r.reminder_due_date) return true;
          return false;
        };

        fReviews.filter(effectiveReviewDue).forEach((r) => {
          const j = fJobs.find((jb) => jb.id === r.job_id);
          const c = j ? custMap[j.customer_id] : null;
          actions.push({
            id: `review-${r.id}`, type: 'REVIEW_DUE', priority: 'normal',
            customer: c ? `${c.first_name} ${c.last_name}` : '—',
            jobNumber: j?.job_number,
            waitTime: j?.completed_at ? `Completed ${relativeTime(j.completed_at)}` : '—',
            actionLabel: 'Send Request', actionTo: '/admin/reviews',
          });
        });

        // --- KPIs ---
        const newRequests = fLeads.filter((l) => l.status === 'New').length;
        const waitingPartsCount = fJobs.filter((j) => isWaitingOnParts(j.status, partsByJob[j.id] || [])).length;
        const unscheduledCount = fJobs.filter((j) => j.status === 'Open' && !isWaitingOnParts(j.status, partsByJob[j.id] || []) && !isReadyForReturnVisit(j.status, partsByJob[j.id] || [])).length;
        const readyReturnCount = fJobs.filter((j) => isReadyForReturnVisit(j.status, partsByJob[j.id] || []) && !hasPendingReturnVisit(visitsByJob[j.id] || [])).length;
        const reviewsDue = fReviews.filter(effectiveReviewDue).length;

        // First-trip completion (visit-derived)
        const completedJobs = fJobs.filter((j) => j.status === 'Completed');
        const eligibleCompleted = completedJobs.filter((j) => {
          const jv = visitsByJob[j.id] || [];
          return jv.some((v) => v.status === 'Complete' && isCompletedServiceOutcome(v.visit_outcome));
        });
        const firstTripCount = eligibleCompleted.filter((j) => calculateFirstTripCompletion(visitsByJob[j.id] || [], j.status)).length;
        const firstTripRate = eligibleCompleted.length > 0 ? Math.round((firstTripCount / eligibleCompleted.length) * 100) : 0;

        setData({
          actions,
          todaysVisits,
          jobs: fJobs,
          custMap,
          technicians,
          locMap,
          kpis: {
            newRequests, todaysVisits: todaysVisits.length, waitingParts: waitingPartsCount,
            unscheduled: unscheduledCount + readyReturnCount, firstTripRate, reviewsDue,
            firstTripDenominator: eligibleCompleted.length, firstTripNumerator: firstTripCount,
          },
          safetyCount:
            fLeads.filter((l) => l.safety_flag && l.status !== 'Converted' && l.status !== 'Closed').length +
            fJobs.filter((j) => j.safety_flag && j.status !== 'Completed' && j.status !== 'Canceled').length,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [includeTest]);

  if (loading) return <div className="p-8 text-slate-500">Loading dashboard…</div>;

  const k = data.kpis;
  const kpiCards = [
    { label: 'New Requests', value: k.newRequests, to: '/admin/inbox', color: 'text-blue-600' },
    { label: "Today's Visits", value: k.todaysVisits, to: '/admin/calendar', color: 'text-green-600' },
    { label: 'Waiting Parts', value: k.waitingParts, to: '/admin/jobs', color: 'text-orange-600' },
    { label: 'Unscheduled / Ready', value: k.unscheduled, to: '/admin/jobs', color: 'text-amber-600' },
    { label: 'First-Trip Completion', value: `${k.firstTripRate}%`, to: '/admin/reports', color: 'text-brand-dark' },
    { label: 'Reviews Due', value: k.reviewsDue, to: '/admin/reviews', color: 'text-purple-600' },
  ];

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Dashboard</h1>
          <p className="text-sm text-slate-500">Daily operations home — what needs attention right now.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={includeTest} onChange={(e) => setIncludeTest(e.target.checked)} className="rounded" />
            Include Test Data
          </label>
          <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> New Service Call
          </button>
        </div>
      </div>

      {data.safetyCount > 0 && (
        <Link to="/admin/inbox" className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-red-800 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5" /> {data.safetyCount} safety-flagged request(s) need immediate attention
        </Link>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpiCards.map((c, i) => (
          <Link key={i} to={c.to} className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow">
            <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      {/* Main: Action Queue + Today's Schedule */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ActionQueue items={data.actions} />
        <TodaySchedule
          visits={data.todaysVisits}
          jobs={data.jobs}
          customers={data.custMap}
          technicians={data.technicians}
          serviceLocations={data.locMap}
        />
      </div>

      <div className="mt-4 text-xs text-slate-400">
        First-Trip Completion: {k.firstTripNumerator}/{k.firstTripDenominator} eligible completed jobs
        (excludes canceled, test data, and jobs without a completed-service visit).
      </div>

      <NewServiceCallDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultSource="Phone" />
    </div>
  );
}