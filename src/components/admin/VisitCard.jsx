import { Clock, User, Wrench, AlertTriangle } from 'lucide-react';
import { formatVisitDate, formatArrivalWindow, getStatusColor } from '@/lib/visitUtils';

// Compact visit card for schedule/dispatch views.
// Props: visit, job, customer, technician, onClick
export default function VisitCard({ visit, job, customer, technician, onClick }) {
  if (!visit) return null;

  return (
    <button onClick={onClick}
      className={`w-full text-left bg-white border rounded-lg p-2.5 hover:shadow-md transition-all ${job?.safety_flag ? 'border-red-300 hover:border-red-400' : 'border-slate-200 hover:border-slate-300'}`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-xs font-mono font-semibold text-slate-500 flex items-center gap-1">
          {job?.safety_flag && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
          {job?.job_number || '—'}
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getStatusColor(visit.status)}`}>{visit.status}</span>
      </div>
      <div className="font-semibold text-sm text-slate-900 truncate">
        {customer ? `${customer.first_name} ${customer.last_name}` : '—'}
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
        <Wrench className="w-3 h-3" /> {job?.service_type || visit.appliance_id || 'Service'}
      </div>
      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
        <Clock className="w-3 h-3" /> {formatVisitDate(visit)} · {formatArrivalWindow(visit)}
      </div>
      {technician && (
        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
          <User className="w-3 h-3" /> {technician.first_name} {technician.last_name || ''}
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-1">
        {job?.safety_flag && (
          <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-red-100 text-red-700 rounded px-1.5 py-0.5">
            <AlertTriangle className="w-2.5 h-2.5" /> SAFETY
          </div>
        )}
        {visit.visit_type && visit.visit_type !== 'Initial Service' && (
          <div className="inline-block text-[10px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">{visit.visit_type}</div>
        )}
      </div>
    </button>
  );
}