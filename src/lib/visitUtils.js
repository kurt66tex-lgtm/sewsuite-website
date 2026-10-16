// Frontend visit/job utilities — mirrors base44/shared/visitLogic.ts for client use.

export const VISIT_STATUSES = ['Requested', 'Confirmed', 'Dispatched', 'En Route', 'On Site', 'Complete', 'Canceled'];
export const VISIT_TYPES = ['Initial Service', 'Return Visit', 'Warranty Visit', 'Estimate / Diagnostic', 'Other'];
export const JOB_STATUSES = ['Open', 'Scheduled', 'In Progress', 'Waiting Parts', 'Completed', 'Canceled'];
export const ESTIMATE_STATUSES = ['Not Started', 'Prepared', 'Presented', 'Approved', 'Declined'];
export const CORE_VISIT_OUTCOMES = ['Service Completed', 'Materials / Return Visit Required', 'Assessment Only', 'Customer Declined Service', 'Other'];
export const APPLIANCE_VISIT_OUTCOMES = ['Repair Completed', 'Parts / Return Visit Required', 'Diagnosis Only', 'Customer Declined Repair', 'Other'];
export const VISIT_OUTCOMES = CORE_VISIT_OUTCOMES;

export const isCompletedServiceOutcome = (outcome) => outcome === 'Service Completed' || outcome === 'Repair Completed';
export const isReturnRequiredOutcome = (outcome) => outcome === 'Materials / Return Visit Required' || outcome === 'Parts / Return Visit Required';
export const isAssessmentOnlyOutcome = (outcome) => outcome === 'Assessment Only' || outcome === 'Diagnosis Only';
export const isCustomerDeclinedOutcome = (outcome) => outcome === 'Customer Declined Service' || outcome === 'Customer Declined Repair';
export const PART_STATUSES = ['Possible', 'Needed', 'Ordered', 'Backordered', 'Received', 'On Truck', 'Installed', 'Not Needed'];

export const ARRIVAL_WINDOWS = [
  { label: '8 AM – 10 AM', start: '8:00 AM', end: '10:00 AM' },
  { label: '10 AM – 12 PM', start: '10:00 AM', end: '12:00 PM' },
  { label: '12 PM – 2 PM', start: '12:00 PM', end: '2:00 PM' },
  { label: '2 PM – 5 PM', start: '2:00 PM', end: '5:00 PM' },
];

// Old → new job status migration map
export const STATUS_MIGRATION = {
  'New': 'Open',
  'Awaiting Scheduling': 'Open',
  'Scheduled': 'Scheduled',
  'Dispatched': 'In Progress',
  'En Route': 'In Progress',
  'On Site': 'In Progress',
  'Diagnosing': 'In Progress',
  'Estimate Presented': 'In Progress',
  'Approved': 'In Progress',
  'Parts Required': 'Waiting Parts',
  'Parts Ordered': 'Waiting Parts',
  'Return Visit Needed': 'Waiting Parts',
  'Repairing': 'In Progress',
  'Completed': 'Completed',
  'Canceled': 'Canceled',
};

export function deriveJobStatus(visits = [], parts = [], currentStatus) {
  if (!visits || visits.length === 0) return 'Open';
  if (currentStatus === 'Completed' || currentStatus === 'Canceled') return null;

  const activeVisits = visits.filter(v =>
    v.status === 'En Route' || v.status === 'On Site' || v.status === 'Dispatched'
  );
  if (activeVisits.length > 0) return 'In Progress';

  const pendingParts = (parts || []).filter(p =>
    p.status === 'Needed' || p.status === 'Ordered' || p.status === 'Backordered'
  );
  if (pendingParts.length > 0) return 'Waiting Parts';

  const confirmedVisits = visits.filter(v =>
    v.status === 'Confirmed' || v.status === 'Requested'
  );
  if (confirmedVisits.length > 0) return 'Scheduled';

  const completedVisits = visits.filter(v => v.status === 'Complete');
  const serviceCompleted = completedVisits.some(v => isCompletedServiceOutcome(v.visit_outcome));
  const hasOutstandingVisits = visits.some(v =>
    v.status !== 'Complete' && v.status !== 'Canceled'
  );

  if (serviceCompleted && !hasOutstandingVisits) return 'Completed';
  if (!hasOutstandingVisits && !serviceCompleted) return 'Open';

  return null;
}

export function calculateFirstTripCompletion(visits = [], jobStatus) {
  if (jobStatus !== 'Completed') return false;

  const sorted = [...visits]
    .filter(v => v.status !== 'Canceled')
    .sort((a, b) => (a.visit_number || 1) - (b.visit_number || 1));

  if (sorted.length === 0) return false;

  const firstVisit = sorted[0];
  const subsequentVisits = sorted.slice(1);

  if (firstVisit.status !== 'Complete') return false;
  if (!isCompletedServiceOutcome(firstVisit.visit_outcome)) return false;

  const hasSubsequentRepairVisit = subsequentVisits.some(v =>
    isCompletedServiceOutcome(v.visit_outcome) || isReturnRequiredOutcome(v.visit_outcome)
  );

  return !hasSubsequentRepairVisit;
}

export function isReadyForReturnVisit(jobStatus, parts = []) {
  if (jobStatus !== 'Waiting Parts') return false;
  if (!parts || parts.length === 0) return false;
  const requiredParts = parts.filter(p => p.status !== 'Possible' && p.status !== 'Not Needed');
  if (requiredParts.length === 0) return false;
  return requiredParts.every(p =>
    p.status === 'Received' || p.status === 'On Truck' || p.status === 'Installed'
  );
}

export function getNextVisit(visits = []) {
  if (!visits || visits.length === 0) return null;

  const active = visits.find(v =>
    v.status === 'En Route' || v.status === 'On Site' || v.status === 'Dispatched'
  );
  if (active) return active;

  const upcoming = visits
    .filter(v => v.status === 'Confirmed' || v.status === 'Requested')
    .sort((a, b) => {
      const da = a.scheduled_date || a.scheduled_start || '';
      const db = b.scheduled_date || b.scheduled_start || '';
      return da.localeCompare(db);
    });
  if (upcoming.length > 0) return upcoming[0];

  return [...visits].sort((a, b) => (b.visit_number || 1) - (a.visit_number || 1))[0];
}

export function formatVisitDate(visit) {
  if (!visit) return '—';
  if (visit.scheduled_date) {
    try {
      return new Date(visit.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
    } catch { return visit.scheduled_date; }
  }
  if (visit.scheduled_start) {
    try {
      return new Date(visit.scheduled_start).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
      });
    } catch { return '—'; }
  }
  return '—';
}

export function formatArrivalWindow(visit) {
  if (!visit) return '—';
  if (visit.arrival_window_start && visit.arrival_window_end) {
    return `${visit.arrival_window_start} – ${visit.arrival_window_end}`;
  }
  if (visit.arrival_window_start) return visit.arrival_window_start;
  if (visit.scheduled_start) {
    try {
      return new Date(visit.scheduled_start).toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit'
      });
    } catch { return '—'; }
  }
  return '—';
}

export function getStatusColor(status) {
  const colors = {
    'Open': 'bg-blue-100 text-blue-800',
    'Scheduled': 'bg-indigo-100 text-indigo-800',
    'In Progress': 'bg-amber-100 text-amber-800',
    'Waiting Parts': 'bg-orange-100 text-orange-800',
    'Completed': 'bg-green-100 text-green-800',
    'Canceled': 'bg-red-100 text-red-800',
    'Requested': 'bg-slate-100 text-slate-700',
    'Confirmed': 'bg-indigo-100 text-indigo-800',
    'Dispatched': 'bg-purple-100 text-purple-800',
    'En Route': 'bg-blue-100 text-blue-800',
    'On Site': 'bg-amber-100 text-amber-800',
    'Complete': 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
}

export function formatRequestedDate(dateStr, windowStr) {
  if (!dateStr) return 'Not specified';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return windowStr ? `${formatted} · ${windowStr}` : formatted;
  } catch {
    return windowStr ? `${dateStr} · ${windowStr}` : dateStr;
  }
}

// --- Phase 3 Polish: Parts / Return Visit queue helpers ---

export function isWaitingOnParts(jobStatus, parts = []) {
  if (jobStatus !== 'Waiting Parts') return false;
  if (!parts || parts.length === 0) return false;
  return parts.some(p => p.status === 'Needed' || p.status === 'Ordered' || p.status === 'Backordered');
}

export function hasPendingReturnVisit(visits = []) {
  if (!visits || visits.length === 0) return false;
  return visits.some(v =>
    v.visit_type === 'Return Visit' &&
    v.status !== 'Canceled' &&
    v.status !== 'Complete'
  );
}

export function isReadyForReturnVisitStrict(jobStatus, parts = [], visits = []) {
  if (!isReadyForReturnVisit(jobStatus, parts)) return false;
  return !hasPendingReturnVisit(visits);
}

export function getPartSummary(parts = []) {
  if (!parts || parts.length === 0) return 'No parts tracked';
  const active = parts.filter(p => p.status !== 'Not Needed');
  if (active.length === 0) return 'All parts resolved';
  const first = active[0];
  const label = first.description || first.part_number || 'Part';
  return active.length > 1 ? `${label} +${active.length - 1} more` : label;
}

export function getPartStatusSummary(parts = []) {
  if (!parts || parts.length === 0) return '—';
  return [...new Set(parts.map(p => p.status))].join(', ');
}

export function getLastVisitDate(visits = []) {
  if (!visits || visits.length === 0) return null;
  const completed = visits.filter(v => v.status === 'Complete');
  if (completed.length === 0) return null;
  return [...completed].sort((a, b) => {
    const da = (a.completed_time || a.scheduled_date || a.scheduled_start || '');
    const db = (b.completed_time || b.scheduled_date || b.scheduled_start || '');
    return db.localeCompare(da);
  })[0];
}