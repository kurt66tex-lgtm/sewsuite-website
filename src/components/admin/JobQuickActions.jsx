import { useState } from 'react';
import { Calendar, Truck, Navigation, CheckCircle2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getNextVisit, isReadyForReturnVisit } from '@/lib/visitUtils';

// Context-aware quick action buttons for a job.
// Props: job, visits, parts, customer, onScheduleVisit, onCompleteVisit, onAddParts, onReload
export default function JobQuickActions({ job, visits = [], parts = [], customer, canManageJob = true, onScheduleVisit, onCompleteVisit, onReload }) {
  const [busy, setBusy] = useState(false);
  const nextVisit = getNextVisit(visits);
  const readyForReturn = isReadyForReturnVisit(job.status, parts);

  const updateVisit = async (visitId, data) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('updateVisitStatus', {
        visit_id: visitId,
        status: data.status
      });
      const payload = res?.data || res;
      if (payload?.error) throw new Error(payload.error);
      if (onReload) onReload(); else window.location.reload();
    } finally { setBusy(false); }
  };

  const actions = [];

  // Generic scheduling belongs to Open jobs only. Waiting Parts jobs must
  // pass through the parts-ready return-visit path instead of bypassing it.
  if (job.status === 'Open') {
    actions.push({ label: 'Schedule Visit', icon: Calendar, variant: 'primary', onClick: () => onScheduleVisit(null) });
  }

  // SCHEDULE RETURN VISIT — if Waiting Parts and parts ready
  if (readyForReturn) {
    actions.push({ label: 'Schedule Return Visit', icon: RotateCcw, variant: 'primary', onClick: () => onScheduleVisit(null, 'Return Visit') });
  }

  // DISPATCH — if visit is Confirmed
  if (nextVisit?.status === 'Confirmed') {
    actions.push({ label: 'Dispatch', icon: Truck, variant: 'default', onClick: () => updateVisit(nextVisit.id, { status: 'Dispatched', dispatch_time: new Date().toISOString() }) });
  }

  // MARK EN ROUTE — if visit is Dispatched
  if (nextVisit?.status === 'Dispatched') {
    actions.push({ label: 'En Route', icon: Navigation, variant: 'default', onClick: () => updateVisit(nextVisit.id, { status: 'En Route', en_route_time: new Date().toISOString() }) });
  }

  // ARRIVED — if visit is En Route
  if (nextVisit?.status === 'En Route') {
    actions.push({ label: 'Arrived', icon: CheckCircle2, variant: 'default', onClick: () => updateVisit(nextVisit.id, { status: 'On Site', arrived_time: new Date().toISOString() }) });
  }

  // COMPLETE VISIT — if visit is On Site or Dispatched
  if (canManageJob && (nextVisit?.status === 'On Site' || nextVisit?.status === 'Dispatched')) {
    actions.push({ label: 'Complete Visit', icon: CheckCircle2, variant: 'success', onClick: () => onCompleteVisit(nextVisit) });
  }

  // COMPLETE JOB — if all visits done but job not Completed/Canceled
  if (canManageJob && job.status === 'In Progress' && !visits.some(v => v.status === 'On Site' || v.status === 'En Route' || v.status === 'Dispatched')) {
    actions.push({
      label: 'Complete Job', icon: CheckCircle2, variant: 'success',
      onClick: async () => {
        setBusy(true);
        try {
          const res = await base44.functions.invoke('completeJob', { job_id: job.id });
          const payload = res?.data || res;
          if (payload?.error) throw new Error(payload.error);
          if (onReload) onReload(); else window.location.reload();
        } finally { setBusy(false); }
      }
    });
  }

  // Intentionally show no scheduling action while Waiting Parts is unresolved.
  // Once all required parts are Received/On Truck, Schedule Return Visit appears above.

  if (job.status === 'Completed' || job.status === 'Canceled') {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, i) => (
        <button key={i} onClick={a.onClick} disabled={busy}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold disabled:opacity-50 ${
            a.variant === 'primary' ? 'bg-brand-accent text-brand-dark hover:bg-brand-accent-dark' :
            a.variant === 'success' ? 'bg-green-600 text-white hover:bg-green-700' :
            'border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}>
          <a.icon className="w-4 h-4" /> {a.label}
        </button>
      ))}
    </div>
  );
}