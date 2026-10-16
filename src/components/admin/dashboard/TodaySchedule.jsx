import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import { formatArrivalWindow, getStatusColor } from '@/lib/visitUtils';

export default function TodaySchedule({ visits, jobs, customers, technicians, serviceLocations }) {
  if (!visits || visits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-brand-dark mb-1">Today's Schedule</h2>
        <p className="text-sm text-slate-400">No visits scheduled for today.</p>
      </div>
    );
  }

  const jobMap = {};
  (jobs || []).forEach((j) => { jobMap[j.id] = j; });

  const assigned = visits.filter((v) => v.technician_id);
  const unassigned = visits.filter((v) => !v.technician_id);

  const byTech = {};
  assigned.forEach((v) => {
    if (!byTech[v.technician_id]) byTech[v.technician_id] = [];
    byTech[v.technician_id].push(v);
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-bold text-brand-dark">Today's Schedule</h2>
        <span className="text-xs text-slate-500">{visits.length} visit(s)</span>
      </div>
      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {technicians.map((tech) => {
          const techVisits = byTech[tech.id] || [];
          if (techVisits.length === 0) return null;
          return (
            <div key={tech.id} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: tech.color || '#3B82F6' }}
                >
                  {tech.first_name?.[0] || '?'}
                </div>
                <span className="font-semibold text-sm text-slate-900">
                  {tech.first_name} {tech.last_name || ''}
                </span>
                <span className="text-xs text-slate-400">{techVisits.length}</span>
              </div>
              <div className="space-y-1.5 ml-8">
                {techVisits.map((v) => {
                  const job = jobMap[v.job_id];
                  const cust = customers?.[v.customer_id];
                  const loc = v.service_location_id ? serviceLocations?.[v.service_location_id] : null;
                  return (
                    <Link
                      key={v.id}
                      to={`/admin/jobs?job=${v.job_id}`}
                      className="block bg-slate-50 hover:bg-slate-100 rounded-lg p-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">{formatArrivalWindow(v)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(v.status)}`}>{v.status}</span>
                      </div>
                      <div className="text-sm font-medium text-slate-900">
                        {cust ? `${cust.first_name} ${cust.last_name}` : '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {job?.service_type || '—'}{loc?.city ? ` · ${loc.city}` : ''}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {unassigned.length > 0 && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-sm text-slate-600">Unassigned</span>
            </div>
            <div className="space-y-1.5 ml-8">
              {unassigned.map((v) => {
                const job = jobMap[v.job_id];
                const cust = customers?.[v.customer_id];
                return (
                  <Link
                    key={v.id}
                    to={`/admin/jobs?job=${v.job_id}`}
                    className="block bg-amber-50 hover:bg-amber-100 rounded-lg p-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{formatArrivalWindow(v)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getStatusColor(v.status)}`}>{v.status}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {cust ? `${cust.first_name} ${cust.last_name}` : '—'}
                    </div>
                    <div className="text-xs text-slate-500">{job?.service_type || '—'}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}