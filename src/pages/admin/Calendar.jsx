import { useEffect, useState, useMemo } from 'react';
import { Calendar as CalIcon, Clock, User, ChevronLeft, ChevronRight, Package, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatVisitDate, formatArrivalWindow, isReadyForReturnVisit, isWaitingOnParts, hasPendingReturnVisit, getPartSummary, getPartStatusSummary, getLastVisitDate } from '@/lib/visitUtils';
import VisitCard from '@/components/admin/VisitCard';
import VisitSchedulingDrawer from '@/components/admin/VisitSchedulingDrawer';
import JobDetail from '@/components/admin/JobDetail';

const VIEWS = ['Day', 'Week', 'Month', 'Technician'];

export default function Calendar() {
  const [view, setView] = useState('Day');
  const [viewDate, setViewDate] = useState(new Date());
  const [visits, setVisits] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState({});
  const [technicians, setTechnicians] = useState([]);
  const [parts, setParts] = useState({});
  const [serviceLocations, setServiceLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleJob, setScheduleJob] = useState(null);
  const [scheduleType, setScheduleType] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Appointment.list('-created_date', 500),
      base44.entities.Job.list('-created_date', 500),
      base44.entities.Customer.list('-created_date', 500),
      base44.entities.Technician.filter({ active: true }),
      base44.entities.JobPart.list('-created_date', 500),
      base44.entities.ServiceLocation.list('-created_date', 500)
    ]).then(([v, j, c, t, p, sl]) => {
      setVisits(v.filter(visit => !visit.is_test_data && visit.status !== 'Canceled'));
      setJobs(j.filter(job => !job.is_test_data));
      const custMap = {};
      c.filter(cust => !cust.is_test_data).forEach(cust => { custMap[cust.id] = cust; });
      setCustomers(custMap);
      setTechnicians(t.filter(tech => !tech.is_test_data));
      const partsMap = {};
      p.filter(part => !part.is_test_data).forEach(part => {
        if (!partsMap[part.job_id]) partsMap[part.job_id] = [];
        partsMap[part.job_id].push(part);
      });
      setParts(partsMap);
      const locMap = {};
      sl.filter(l => !l.is_test_data).forEach(l => { locMap[l.id] = l; });
      setServiceLocations(locMap);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const jobMap = useMemo(() => {
    const m = {};
    jobs.forEach(j => { m[j.id] = j; });
    return m;
  }, [jobs]);

  const techMap = useMemo(() => {
    const m = {};
    technicians.forEach(t => { m[t.id] = t; });
    return m;
  }, [technicians]);

  // Waiting on Parts queue: Waiting Parts + parts still Needed/Ordered/Backordered
  const waitingPartsJobs = useMemo(() => {
    return jobs.filter(j => isWaitingOnParts(j.status, parts[j.id] || []));
  }, [jobs, parts]);

  // Ready for Return Visit queue: Waiting Parts + all parts ready + no pending return visit
  const readyForReturnJobs = useMemo(() => {
    return jobs.filter(j => {
      if (!isReadyForReturnVisit(j.status, parts[j.id] || [])) return false;
      const jobVisits = visits.filter(v => v.job_id === j.id);
      return !hasPendingReturnVisit(jobVisits);
    });
  }, [jobs, parts, visits]);

  // Unscheduled jobs: Open status only — excludes jobs already in more specific queues
  const unscheduledJobs = useMemo(() => {
    return jobs.filter(j => {
      if (j.status !== 'Open') return false;
      if (isWaitingOnParts(j.status, parts[j.id] || [])) return false;
      if (isReadyForReturnVisit(j.status, parts[j.id] || []) && !hasPendingReturnVisit(visits.filter(v => v.job_id === j.id))) return false;
      return true;
    });
  }, [jobs, parts, visits]);

  // Visits for the selected day
  const dayVisits = useMemo(() => {
    const dateStr = viewDate.toISOString().slice(0, 10);
    return visits.filter(v => v.scheduled_date === dateStr || (v.scheduled_start && v.scheduled_start.slice(0, 10) === dateStr));
  }, [visits, viewDate]);

  // Visits for the selected week
  const weekVisits = useMemo(() => {
    const start = new Date(viewDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return visits.filter(v => {
      const vd = v.scheduled_date || (v.scheduled_start ? v.scheduled_start.slice(0, 10) : null);
      if (!vd) return false;
      const d = new Date(vd + 'T00:00:00');
      return d >= start && d < end;
    });
  }, [visits, viewDate]);

  // Month visits
  const monthVisits = useMemo(() => {
    return visits.filter(v => {
      const vd = v.scheduled_date || (v.scheduled_start ? v.scheduled_start.slice(0, 10) : null);
      if (!vd) return false;
      const d = new Date(vd + 'T00:00:00');
      return d.getFullYear() === viewDate.getFullYear() && d.getMonth() === viewDate.getMonth();
    });
  }, [visits, viewDate]);

  const navigate = (dir) => {
    const d = new Date(viewDate);
    if (view === 'Day') d.setDate(d.getDate() + dir);
    else if (view === 'Week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setViewDate(d);
  };

  const openSchedule = (job, visitType) => {
    setScheduleJob(job);
    setScheduleType(visitType || null);
    setScheduleOpen(true);
  };

  const openJobDetail = (jobId) => {
    const j = jobMap[jobId];
    if (j) {
      setSelectedJob(j);
      setSelectedCustomer(customers[j.customer_id] || null);
    }
  };

  const dateLabel = view === 'Day' ?
    viewDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) :
    view === 'Month' ?
    viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) :
    viewDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2"><CalIcon className="w-6 h-6" /> Schedule</h1>
          <p className="text-sm text-slate-500 mt-1">Dispatch, scheduling, and technician assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-slate-300 rounded-lg overflow-hidden">
            {VIEWS.map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-semibold ${view === v ? 'bg-brand-dark text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={() => navigate(-1)} className="px-2 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="font-bold text-brand-dark text-sm min-w-[140px] text-center">{dateLabel}</span>
          <button onClick={() => navigate(1)} className="px-2 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={() => setViewDate(new Date())} className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Today</button>
        </div>
      </div>

      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div>
          {/* Main schedule area */}
          <div>
            {/* DAY / DISPATCH VIEW */}
            {view === 'Day' && (
              <div>
                {/* Parts / Return Visit Queues */}
                {(waitingPartsJobs.length > 0 || readyForReturnJobs.length > 0) && (
                  <div className="mb-4 space-y-3">
                    {waitingPartsJobs.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <h3 className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1.5">
                          <Package className="w-4 h-4" /> WAITING ON PARTS ({waitingPartsJobs.length})
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {waitingPartsJobs.map(j => {
                            const c = customers[j.customer_id];
                            const loc = j.service_location_id ? serviceLocations[j.service_location_id] : null;
                            const jobParts = parts[j.id] || [];
                            const jobVisits = visits.filter(v => v.job_id === j.id);
                            const lastVisit = getLastVisitDate(jobVisits);
                            return (
                              <div key={j.id} className="bg-white border border-orange-200 rounded-lg p-2.5">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-xs font-semibold text-slate-500">{j.job_number}</span>
                                  <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">{getPartStatusSummary(jobParts)}</span>
                                </div>
                                <div className="font-medium text-sm">{c ? `${c.first_name} ${c.last_name}` : '—'}</div>
                                <div className="text-xs text-slate-500">{j.service_type || '—'}{loc?.city ? ` · ${loc.city}` : ''}</div>
                                <div className="text-xs text-slate-500 mt-0.5 truncate">{getPartSummary(jobParts)}</div>
                                {lastVisit && <div className="text-[10px] text-slate-400 mt-0.5">Last visit: {formatVisitDate(lastVisit)}</div>}
                                <div className="flex gap-1.5 mt-2">
                                  <button onClick={() => openJobDetail(j.id)} className="flex-1 text-xs font-semibold border border-slate-300 text-slate-600 rounded-lg px-2 py-1.5 hover:border-brand-accent">Open Job</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {readyForReturnJobs.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <h3 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-1.5">
                          <CalIcon className="w-4 h-4" /> READY TO SCHEDULE RETURN VISIT ({readyForReturnJobs.length})
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {readyForReturnJobs.map(j => {
                            const c = customers[j.customer_id];
                            const loc = j.service_location_id ? serviceLocations[j.service_location_id] : null;
                            const jobParts = parts[j.id] || [];
                            const jobVisits = visits.filter(v => v.job_id === j.id);
                            const lastVisit = getLastVisitDate(jobVisits);
                            return (
                              <div key={j.id} className="bg-white border border-green-200 rounded-lg p-2.5">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-mono text-xs font-semibold text-slate-500">{j.job_number}</span>
                                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{getPartStatusSummary(jobParts)}</span>
                                </div>
                                <div className="font-medium text-sm">{c ? `${c.first_name} ${c.last_name}` : '—'}</div>
                                <div className="text-xs text-slate-500">{j.service_type || '—'}{loc?.city ? ` · ${loc.city}` : ''}</div>
                                <div className="text-xs text-slate-500 mt-0.5 truncate">{getPartSummary(jobParts)}</div>
                                {lastVisit && <div className="text-[10px] text-slate-400 mt-0.5">Last visit: {formatVisitDate(lastVisit)}</div>}
                                <div className="flex gap-1.5 mt-2">
                                  <button onClick={() => openJobDetail(j.id)} className="flex-1 text-xs font-semibold border border-slate-300 text-slate-600 rounded-lg px-2 py-1.5 hover:border-brand-accent">Open Job</button>
                                  <button onClick={() => openSchedule(j, 'Return Visit')} className="flex-1 text-xs font-bold bg-brand-accent text-brand-dark rounded-lg px-2 py-1.5 hover:bg-brand-accent-dark">Schedule Return</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Unscheduled panel */}
                {unscheduledJobs.length > 0 && (
                  <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <h3 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Unscheduled / Ready to Schedule ({unscheduledJobs.length})
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {unscheduledJobs.map(j => (
                        <div key={j.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-mono text-xs font-semibold text-slate-500 flex items-center gap-1">
                              {j.safety_flag && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                              {j.job_number}
                              {j.safety_flag && <span className="font-sans text-[9px] font-bold text-red-600">SAFETY</span>}
                            </div>
                            <div className="font-medium text-sm truncate">{customers[j.customer_id] ? `${customers[j.customer_id].first_name} ${customers[j.customer_id].last_name}` : '—'}</div>
                            <div className="text-xs text-slate-500 truncate">{j.service_type} {j.status === 'Waiting Parts' ? '· Parts Ready' : ''}</div>
                          </div>
                          <button onClick={() => openSchedule(j)} className="flex-shrink-0 bg-brand-accent text-brand-dark text-xs font-bold px-3 py-1.5 rounded-lg">Schedule</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technician columns */}
                {technicians.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <User className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p>No technicians yet. Add technicians in Settings.</p>
                  </div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(technicians.length, 4)}, 1fr)` }}>
                    {technicians.map(tech => {
                      const techVisits = dayVisits.filter(v => v.technician_id === tech.id);
                      return (
                        <div key={tech.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2" style={{ borderLeft: `4px solid ${tech.color || '#3B82F6'}` }}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: tech.color || '#3B82F6' }}>
                              {tech.first_name?.[0] || '?'}
                            </div>
                            <div className="font-semibold text-sm text-slate-900">{tech.first_name} {tech.last_name || ''}</div>
                          </div>
                          <div className="p-2 space-y-2 min-h-[200px]">
                            {techVisits.length === 0 && <div className="text-xs text-slate-400 text-center pt-8">No visits</div>}
                            {techVisits.map(v => (
                              <VisitCard key={v.id} visit={v} job={jobMap[v.job_id]} customer={customers[v.customer_id]} technician={tech}
                                onClick={() => openJobDetail(v.job_id)} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Unassigned visits */}
                {dayVisits.filter(v => !v.technician_id).length > 0 && (
                  <div className="mt-3 bg-white border border-slate-200 rounded-xl p-3">
                    <h3 className="text-sm font-bold text-slate-600 mb-2">Unassigned</h3>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {dayVisits.filter(v => !v.technician_id).map(v => (
                        <VisitCard key={v.id} visit={v} job={jobMap[v.job_id]} customer={customers[v.customer_id]}
                          onClick={() => openJobDetail(v.job_id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WEEK VIEW */}
            {view === 'Week' && (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const start = new Date(viewDate);
                  start.setDate(start.getDate() - start.getDay() + dayIdx);
                  const dateStr = start.toISOString().slice(0, 10);
                  const dayV = weekVisits.filter(v => (v.scheduled_date || v.scheduled_start?.slice(0, 10)) === dateStr);
                  const isToday = new Date().toDateString() === start.toDateString();
                  return (
                    <div key={dayIdx} className="bg-white border border-slate-200 rounded-lg min-h-[150px]">
                      <div className={`px-2 py-1 text-center text-xs font-bold border-b ${isToday ? 'bg-brand-accent/10 text-brand-dark' : 'text-slate-500'}`}>
                        {start.toLocaleDateString('en-US', { weekday: 'short' })}
                        <div className="text-sm">{start.getDate()}</div>
                      </div>
                      <div className="p-1 space-y-1">
                        {dayV.slice(0, 4).map(v => (
                          <button key={v.id} onClick={() => openJobDetail(v.job_id)}
                            className="w-full text-left text-[10px] bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-1 truncate">
                            <div className="font-semibold">{formatArrivalWindow(v)}</div>
                            <div className="truncate">{customers[v.customer_id] ? `${customers[v.customer_id].first_name} ${customers[v.customer_id].last_name}` : '—'}</div>
                          </button>
                        ))}
                        {dayV.length > 4 && <div className="text-[10px] text-slate-400 px-1">+{dayV.length - 4} more</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MONTH VIEW */}
            {view === 'Month' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="px-2 py-2 text-center text-xs font-bold text-slate-600">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {(() => {
                    const year = viewDate.getFullYear();
                    const month = viewDate.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const cells = [];
                    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e-${i}`} className="min-h-[80px] border-r border-b border-slate-100 bg-slate-50" />);
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = new Date(year, month, day).toISOString().slice(0, 10);
                      const dayV = monthVisits.filter(v => (v.scheduled_date || v.scheduled_start?.slice(0, 10)) === dateStr);
                      const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                      cells.push(
                        <div key={day} className={`min-h-[80px] border-r border-b border-slate-100 p-1 ${isToday ? 'bg-brand-accent/10' : ''}`}>
                          <div className={`text-xs font-bold ${isToday ? 'text-brand-dark' : 'text-slate-400'}`}>{day}</div>
                          <div className="space-y-0.5">
                            {dayV.slice(0, 3).map(v => (
                              <button key={v.id} onClick={() => openJobDetail(v.job_id)}
                                className="block w-full text-left text-[9px] bg-brand-dark text-white rounded px-1 py-0.5 truncate hover:bg-brand-charcoal">
                                {formatArrivalWindow(v)} {customers[v.customer_id]?.first_name || '—'}
                              </button>
                            ))}
                            {dayV.length > 3 && <div className="text-[9px] text-slate-400">+{dayV.length - 3}</div>}
                          </div>
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
            )}

            {/* TECHNICIAN VIEW */}
            {view === 'Technician' && (
              <div className="space-y-3">
                {technicians.length === 0 && <p className="text-slate-400 text-center py-8">No technicians. Add them in Settings.</p>}
                {technicians.map(tech => {
                  const techVisits = dayVisits.filter(v => v.technician_id === tech.id);
                  return (
                    <div key={tech.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2" style={{ borderLeft: `4px solid ${tech.color || '#3B82F6'}` }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: tech.color || '#3B82F6' }}>
                          {tech.first_name?.[0] || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{tech.first_name} {tech.last_name || ''}</div>
                          <div className="text-xs text-slate-500">{techVisits.length} visit(s) today</div>
                        </div>
                      </div>
                      <div className="p-3">
                        {techVisits.length === 0 ? <p className="text-sm text-slate-400">No visits scheduled.</p> : (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {techVisits.map(v => (
                              <VisitCard key={v.id} visit={v} job={jobMap[v.job_id]} customer={customers[v.customer_id]} technician={tech}
                                onClick={() => openJobDetail(v.job_id)} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Scheduling Drawer */}
      {scheduleJob && (
        <VisitSchedulingDrawer
          open={scheduleOpen}
          onClose={() => { setScheduleOpen(false); setScheduleJob(null); setScheduleType(null); }}
          job={scheduleJob}
          customerRequested={{ date: scheduleJob.requested_date, window: scheduleJob.requested_window }}
          defaultVisitType={scheduleType}
        />
      )}

      {/* Job Detail */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          customer={selectedCustomer}
          onClose={() => { setSelectedJob(null); setSelectedCustomer(null); }}
        />
      )}
    </div>
  );
}