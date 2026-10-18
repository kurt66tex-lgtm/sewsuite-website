import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ClipboardList, FileText, CheckCircle2, PackageCheck, Clock, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { isAgencyOwner } from '@/lib/accessControl';

function customerName(customer) {
  if (!customer) return '—';
  return customer.company_name || [customer.first_name, customer.last_name].filter(Boolean).join(' ') || 'Customer';
}

export default function ProjectDashboard() {
  const { user } = useAuth();
  const agencyOwner = isAgencyOwner(user);
  const [data, setData] = useState({ leads: [], jobs: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Lead.list('-created_date', 500),
      base44.entities.Job.list('-created_date', 500),
      base44.entities.Customer.list('-created_date', 500)
    ]).then(([leads, jobs, customers]) => {
      const showTest = agencyOwner && includeTest;
      setData({
        leads: showTest ? (leads || []) : (leads || []).filter(x => !x.is_test_data),
        jobs: showTest ? (jobs || []) : (jobs || []).filter(x => !x.is_test_data),
        customers: showTest ? (customers || []) : (customers || []).filter(x => !x.is_test_data)
      });
    }).finally(() => setLoading(false));
  }, [includeTest, agencyOwner]);

  const view = useMemo(() => {
    const customerMap = Object.fromEntries(data.customers.map(c => [c.id, c]));
    const activeJobs = data.jobs.filter(j => j.status !== 'Completed' && j.status !== 'Canceled');
    const stageCount = (stage) => activeJobs.filter(j => (j.workflow_stage || 'Quote Needed') === stage).length;
    const waitingCustomer = data.leads.filter(l => l.status === 'Waiting on Customer').length +
      activeJobs.filter(j => ['Awaiting Customer Approval', 'Awaiting Proof Approval'].includes(j.workflow_stage)).length;
    const actions = [];

    data.leads.filter(l => l.status === 'New').slice(0, 8).forEach(l => actions.push({
      id: 'lead-' + l.id,
      title: 'Review new quote request',
      detail: [l.first_name, l.last_name].filter(Boolean).join(' ') + (l.service_type ? ' · ' + l.service_type : ''),
      to: '/admin/inbox'
    }));

    activeJobs.forEach(j => {
      const stage = j.workflow_stage || 'Quote Needed';
      const labels = {
        'Quote Needed': 'Prepare quote',
        'Quote Sent': 'Follow up on quote',
        'Awaiting Customer Approval': 'Awaiting customer approval',
        'Quote Approved': 'Review artwork / proof requirements',
        'Artwork / Logo Needed': 'Request artwork / logo',
        'Proof Preparation': 'Prepare proof',
        'Proof Sent': 'Follow up on proof',
        'Awaiting Proof Approval': 'Awaiting proof approval',
        'Proof Approved': 'Plan production',
        'Production Scheduled': 'Production scheduled',
        'In Production': 'Production in progress',
        'Quality Check': j.quality_check_status === 'Passed' ? 'Choose fulfillment / mark ready' : 'Quality check',
        'Ready for Pickup / Shipping': 'Ready for fulfillment',
        'Review Request': 'Send review request'
      };
      if (!labels[stage]) return;
      actions.push({
        id: 'job-' + j.id,
        title: labels[stage],
        detail: `${j.job_number || 'Project'} · ${customerName(customerMap[j.customer_id])} · ${j.service_type || 'Project'}`,
        to: '/admin/jobs?job=' + j.id
      });
    });

    return {
      customerMap,
      activeJobs,
      actions: actions.slice(0, 12),
      kpis: [
        { label: 'New Quote Requests', value: data.leads.filter(l => l.status === 'New').length, to: '/admin/inbox', icon: Inbox },
        { label: 'Active Projects', value: activeJobs.length, to: '/admin/jobs', icon: ClipboardList },
        { label: 'Quote Needed', value: stageCount('Quote Needed'), to: '/admin/jobs', icon: FileText },
        { label: 'Waiting on Customer', value: waitingCustomer, to: '/admin/inbox', icon: Clock },
        { label: 'In Production', value: stageCount('In Production'), to: '/admin/jobs', icon: PackageCheck },
        { label: 'Ready for Fulfillment', value: stageCount('Ready for Pickup / Shipping'), to: '/admin/jobs', icon: CheckCircle2 }
      ]
    };
  }, [data]);

  if (loading) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="max-w-7xl p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Project Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Quote requests, approvals, artwork, production and fulfillment.</p>
        </div>
        {agencyOwner && <label className="flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" checked={includeTest} onChange={e=>setIncludeTest(e.target.checked)} /> Include Test Data</label>}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {view.kpis.map(k => (
          <Link key={k.label} to={k.to} className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm">
            <k.icon className="mb-2 h-4 w-4 text-brand-dark" />
            <div className="text-2xl font-bold text-brand-dark">{k.value}</div>
            <div className="mt-1 text-xs text-slate-500">{k.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-brand-dark">Action Queue</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {view.actions.map(a => (
              <Link key={a.id} to={a.to} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                  <div className="mt-0.5 text-xs text-slate-500">{a.detail}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
            {view.actions.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">No project actions waiting.</div>}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold text-brand-dark">Active Projects</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {view.activeJobs.slice(0, 10).map(j => (
              <Link key={j.id} to={'/admin/jobs?job=' + j.id} className="block px-4 py-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">{j.job_number || 'Project'} · {j.service_type || 'Project'}</div>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{j.workflow_stage || 'Quote Needed'}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{customerName(view.customerMap[j.customer_id])}{j.requested_date ? ' · Desired ' + j.requested_date : ''}</div>
              </Link>
            ))}
            {view.activeJobs.length === 0 && <div className="px-4 py-8 text-center text-sm text-slate-400">No active projects yet.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}
