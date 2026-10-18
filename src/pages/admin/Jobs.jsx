import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import NewServiceCallDrawer from '@/components/admin/NewServiceCallDrawer';
import JobDetail from '@/components/admin/JobDetail';
import ProjectDetail from '@/components/admin/ProjectDetail';
import { base44 } from '@/api/base44Client';
import { JOB_STATUSES, getStatusColor, getNextVisit, formatVisitDate, isReadyForReturnVisit, hasPendingReturnVisit } from '@/lib/visitUtils';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { crmVocabulary, isProjectQuoteModel, PROJECT_WORKFLOW_STAGES } from '@/lib/businessModel';
import { useAuth } from '@/lib/AuthContext';
import { isAgencyOwner } from '@/lib/accessControl';

function projectNextStep(job) {
  const stage = job.workflow_stage || 'Quote Needed';
  const map = {
    'Quote Needed': 'Prepare quote',
    'Quote Sent': 'Customer review',
    'Awaiting Customer Approval': 'Awaiting quote approval',
    'Quote Approved': job.proof_status === 'Not Required' ? 'Schedule production' : 'Prepare proof',
    'Artwork / Logo Needed': 'Get artwork / logo',
    'Proof Preparation': 'Prepare revised proof',
    'Proof Sent': 'Customer review',
    'Awaiting Proof Approval': 'Awaiting proof approval',
    'Proof Approved': 'Schedule production',
    'Production Scheduled': 'Start production',
    'In Production': job.quality_check_status === 'Needs Rework' ? 'Complete rework' : 'Finish production',
    'Quality Check': job.quality_check_status === 'Passed' ? 'Choose fulfillment' : 'Perform quality check',
    'Ready for Pickup / Shipping': job.fulfillment_method === 'Shipping' ? 'Ship & complete' : 'Pickup & complete',
    'Completed': 'Complete',
    'Review Request': 'Review follow-up'
  };
  return map[stage] || stage;
}

const FILTER_CHIPS = [
  { key: 'All', label: 'All' },
  { key: 'Open', label: 'Open' },
  { key: 'Scheduled', label: 'Scheduled' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Waiting Parts', label: 'Waiting Parts' },
  { key: 'Ready for Return Visit', label: 'Ready for Return Visit' },
  { key: 'Completed', label: 'Completed' },
];

export default function Jobs() {
  const { settings } = useBusinessSettings();
  const { user } = useAuth();
  const agencyOwner = isAgencyOwner(user);
  const isProjectQuote = isProjectQuoteModel(settings);
  const terms = crmVocabulary(settings);
  const filterChips = isProjectQuote ? [{ key: 'All', label: 'All' }, ...PROJECT_WORKFLOW_STAGES.map(stage => ({ key: stage, label: stage }))] : FILTER_CHIPS;
  const [allJobs, setAllJobs] = useState([]);
  const [customers, setCustomers] = useState({});
  const [visits, setVisits] = useState({});
  const [parts, setParts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Job.list('-created_date', 500).then(async list => {
      const showTest = agencyOwner && includeTest;
      list = showTest ? list : list.filter(j => !j.is_test_data);
      setAllJobs(list);

      const cIds = [...new Set(list.map(j => j.customer_id).filter(Boolean))];
      const custs = {};
      for (const id of cIds) {
        try { const c = await base44.entities.Customer.get(id); custs[id] = c; } catch (e) {}
      }
      setCustomers(custs);

      const allVisits = await base44.entities.Appointment.list('-created_date', 500);
      const visitMap = {};
      allVisits.filter(v => (agencyOwner && includeTest) || !v.is_test_data).forEach(v => {
        if (!visitMap[v.job_id]) visitMap[v.job_id] = [];
        visitMap[v.job_id].push(v);
      });
      setVisits(visitMap);

      const allParts = await base44.entities.JobPart.list('-created_date', 500);
      const partsMap = {};
      allParts.filter(p => (agencyOwner && includeTest) || !p.is_test_data).forEach(p => {
        if (!partsMap[p.job_id]) partsMap[p.job_id] = [];
        partsMap[p.job_id].push(p);
      });
      setParts(partsMap);

      const params = new URLSearchParams(window.location.search);
      const openJobId = params.get('job');
      if (openJobId) {
        const job = list.find(j => j.id === openJobId);
        if (job) {
          setSelected(job);
          setSelectedCustomer(custs[job.customer_id] || null);
        }
        window.history.replaceState({}, '', window.location.pathname);
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [includeTest, agencyOwner]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = { All: allJobs.length };
    if (isProjectQuote) {
      PROJECT_WORKFLOW_STAGES.forEach(stage => { c[stage] = allJobs.filter(j => (j.workflow_stage || 'Quote Needed') === stage).length; });
      return c;
    }
    JOB_STATUSES.forEach(s => { c[s] = allJobs.filter(j => j.status === s).length; });
    c['Ready for Return Visit'] = allJobs.filter(j => {
      const jobParts = parts[j.id] || [];
      const jobVisits = visits[j.id] || [];
      return isReadyForReturnVisit(j.status, jobParts) && !hasPendingReturnVisit(jobVisits);
    }).length;
    return c;
  }, [allJobs, parts, visits, isProjectQuote]);

  const filteredJobs = useMemo(() => {
    let filtered = allJobs;
    if (statusFilter !== 'All') {
      if (isProjectQuote) {
        filtered = filtered.filter(j => (j.workflow_stage || 'Quote Needed') === statusFilter);
      } else if (statusFilter === 'Ready for Return Visit') {
        filtered = filtered.filter(j => {
          const jobParts = parts[j.id] || [];
          const jobVisits = visits[j.id] || [];
          return isReadyForReturnVisit(j.status, jobParts) && !hasPendingReturnVisit(jobVisits);
        });
      } else {
        filtered = filtered.filter(j => j.status === statusFilter);
      }
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(j => [j.job_number, j.service_type, j.issue_description, j.error_code].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return filtered;
  }, [allJobs, statusFilter, search, parts, visits, isProjectQuote]);

  const openJob = (j) => {
    setSelected(j);
    setSelectedCustomer(customers[j.customer_id] || null);
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand-dark">{terms.workPlural}</h1>
        <div className="flex items-center gap-3">
          {agencyOwner && <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer"><input type="checkbox" checked={includeTest} onChange={e => setIncludeTest(e.target.checked)} /> Test Data</label>}
          <button onClick={() => setDrawerOpen(true)} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg text-sm">
            <Plus className="w-4 h-4" /> {terms.createWork}
          </button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {filterChips.map(chip => (
          <button key={chip.key} onClick={() => setStatusFilter(chip.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${statusFilter === chip.key ? 'bg-brand-dark text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-brand-accent'}`}>
            {chip.label} {counts[chip.key] !== undefined && <span className={`ml-1 ${statusFilter === chip.key ? 'text-slate-300' : 'text-slate-400'}`}>{counts[chip.key]}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isProjectQuote ? 'Search project #, type or description…' : 'Search job #, type, error code…'} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:outline-none" />
      </div>

      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">{terms.workNumber}</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">{isProjectQuote ? 'Project Type' : 'Service'}</th>
                {isProjectQuote && <th className="text-left px-4 py-3">Source</th>}
                {isProjectQuote && <th className="text-left px-4 py-3">Quote</th>}
                <th className="text-left px-4 py-3">{isProjectQuote ? 'Production / Desired' : 'Next Visit'}</th>
                {isProjectQuote && <th className="text-left px-4 py-3">Fulfillment</th>}
                {isProjectQuote && <th className="text-left px-4 py-3">Next Step</th>}
                <th className="text-left px-4 py-3">{isProjectQuote ? 'Stage' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map(j => {
                const c = customers[j.customer_id];
                const jobVisits = visits[j.id] || [];
                const nextV = getNextVisit(jobVisits);
                return (
                  <tr key={j.id} onClick={() => openJob(j)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      <div className="flex items-center gap-1">
                        {j.safety_flag && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                        {j.job_number || j.id.slice(0, 8)}
                        {j.is_test_data && <span className="text-[9px] bg-slate-200 text-slate-500 px-1 py-0.5 rounded font-sans">TEST</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{c ? (isProjectQuote && c.company_name ? <><div>{c.company_name}</div><div className="text-xs font-normal text-slate-500">{c.first_name} {c.last_name}</div></> : `${c.first_name} ${c.last_name}`) : '—'}</td>
                    <td className="px-4 py-3">{j.service_type || '—'} {j.error_code && <span className="text-xs text-slate-400">({j.error_code})</span>}</td>
                    {isProjectQuote && <td className="px-4 py-3 text-xs text-slate-600">{j.source || '—'}</td>}
                    {isProjectQuote && <td className="px-4 py-3 text-xs"><div className="font-semibold text-slate-900">{j.estimate_amount != null ? '$'+Number(j.estimate_amount).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'}</div><div className="text-[10px] text-slate-400">{j.estimate_status || 'Not Started'}</div></td>}
                    <td className="px-4 py-3 text-xs">{isProjectQuote ? <><div className="font-medium text-slate-800">{j.production_scheduled_date || '—'}</div>{j.requested_date && <div className="text-[10px] text-slate-400">Desired {j.requested_date}</div>}</> : (nextV ? formatVisitDate(nextV) : '—')}</td>
                    {isProjectQuote && <td className="px-4 py-3 text-xs"><div className="font-medium text-slate-800">{j.fulfillment_method && j.fulfillment_method !== 'Not Set' ? j.fulfillment_method : '—'}</div>{j.fulfillment_status && j.fulfillment_status !== 'Not Ready' && <div className="text-[10px] text-slate-400">{j.fulfillment_status}</div>}</td>}
                    {isProjectQuote && <td className="px-4 py-3 text-xs font-medium text-slate-700">{projectNextStep(j)}</td>}
                    <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded ${isProjectQuote ? 'bg-slate-100 text-slate-700' : getStatusColor(j.status)}`}>{isProjectQuote ? (j.workflow_stage || 'Quote Needed') : j.status}</span></td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && <tr><td colSpan={isProjectQuote ? 9 : 5} className="px-4 py-8 text-center text-slate-400">No {terms.workPlural.toLowerCase()} found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selected && (isProjectQuote ? (
        <ProjectDetail
          job={selected}
          customer={selectedCustomer}
          onUpdated={(updated) => { setSelected(updated); setAllJobs(list => list.map(j => j.id === updated.id ? updated : j)); }}
          onClose={() => { setSelected(null); setSelectedCustomer(null); }}
        />
      ) : (
        <JobDetail
          job={selected}
          customer={selectedCustomer}
          onClose={() => { setSelected(null); setSelectedCustomer(null); }}
        />
      ))}

      <NewServiceCallDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} defaultSource="Phone" />
    </div>
  );
}