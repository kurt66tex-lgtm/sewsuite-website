import { useEffect, useState } from 'react';
import { X, Save, FileText, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PROJECT_WORKFLOW_STAGES, projectStageCoreStatus } from '@/lib/businessModel';
import ProjectQuotePanel from '@/components/admin/ProjectQuotePanel';
import ProjectProofPanel from '@/components/admin/ProjectProofPanel';
import ProjectProductionPanel from '@/components/admin/ProjectProductionPanel';

const FULFILLMENT = ['Not Set', 'Local Pickup', 'Shipping'];

export default function ProjectDetail({ job, customer, onClose, onUpdated }) {
  const [draft, setDraft] = useState(job);
  const [attachments, setAttachments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => { setDraft(job); }, [job]);

  useEffect(() => {
    let active = true;
    base44.functions.invoke('getOfficeAttachments', { job_id: job.id })
      .then(res => { if (active) setAttachments((res?.data || res || {}).attachments || []); })
      .catch(() => { if (active) setAttachments([]); });
    return () => { active = false; };
  }, [job.id]);

  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }));

  const save = async () => {
    setSaving(true);
    setNotice('');
    try {
      const coreStatus = projectStageCoreStatus(draft.workflow_stage || 'Quote Needed');
      const patch = {
        workflow_stage: draft.workflow_stage || 'Quote Needed',
        status: coreStatus,
        fulfillment_method: draft.fulfillment_method || 'Not Set',
        artwork_status: draft.artwork_status || null,
        proof_status: draft.proof_status || 'Not Started',
        production_notes: draft.production_notes || null,
        customer_notes: draft.customer_notes || null,
        requested_date: draft.requested_date || null,
        completed_at: coreStatus === 'Completed' ? (draft.completed_at || new Date().toISOString()) : null
      };
      await base44.entities.Job.update(job.id, patch);
      await base44.entities.CRMActivity.create({
        entity_type: 'Job',
        entity_id: job.id,
        job_id: job.id,
        customer_id: job.customer_id || null,
        lead_id: job.lead_id || null,
        event_type: 'Project updated',
        from_status: job.workflow_stage || 'Quote Needed',
        to_status: patch.workflow_stage,
        performed_at: new Date().toISOString(),
        description: `Project stage updated to ${patch.workflow_stage}`
      });
      const updated = { ...draft, ...patch };
      setDraft(updated);
      setNotice('Project updated.');
      onUpdated?.(updated);
    } catch (e) {
      setNotice(e.message || 'Unable to update project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4">
          <div>
            <div className="text-xs font-semibold uppercase text-slate-500">Project</div>
            <h2 className="text-lg font-bold text-slate-900">{draft.job_number || draft.id.slice(0, 8)}</h2>
            <div className="text-sm text-slate-500">{customer?.company_name ? `${customer.company_name} · ${customer.first_name} ${customer.last_name}` : (customer ? `${customer.first_name} ${customer.last_name}` : 'Customer')} · {draft.service_type || 'Project'}</div>
          </div>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-xl border border-slate-200 p-4">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Workflow Stage</label>
            <select value={draft.workflow_stage || 'Quote Needed'} onChange={e => set('workflow_stage', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              {PROJECT_WORKFLOW_STAGES.map(stage => <option key={stage} disabled={['Quote Sent','Awaiting Customer Approval','Quote Approved','Proof Sent','Awaiting Proof Approval','Proof Approved','Production Scheduled','In Production','Quality Check','Ready for Pickup / Shipping','Completed','Review Request'].includes(stage) && stage !== draft.workflow_stage}>{stage}</option>)}
            </select>
          </section>

          <section className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Artwork Status</label>
              <input value={draft.artwork_status || ''} onChange={e => set('artwork_status', e.target.value)} placeholder="Ready, needs logo, needs revision…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Proof Status</label>
              <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{draft.proof_status || 'Not Started'}</div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Fulfillment</label>
              <select value={draft.fulfillment_method || 'Not Set'} onChange={e => set('fulfillment_method', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {FULFILLMENT.map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Desired Completion</label>
              <input type="date" value={draft.requested_date || ''} onChange={e => set('requested_date', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Project Description</label>
            <p className="mb-4 whitespace-pre-wrap text-sm text-slate-700">{draft.issue_description || 'No project description.'}</p>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Production / Project Notes</label>
            <textarea rows={4} value={draft.production_notes || ''} onChange={e => set('production_notes', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <label className="mb-1 mt-3 block text-xs font-semibold uppercase text-slate-500">Customer Notes</label>
            <textarea rows={3} value={draft.customer_notes || ''} onChange={e => set('customer_notes', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </section>

          <ProjectQuotePanel job={draft} customer={customer} onQuoteChanged={(patch) => { const updated = { ...draft, ...patch }; setDraft(updated); onUpdated?.(updated); }} />

          <ProjectProofPanel job={draft} customer={customer} onProofChanged={(patch) => { const updated = { ...draft, ...patch }; setDraft(updated); onUpdated?.(updated); }} />

          <ProjectProductionPanel job={draft} onJobChanged={(updatedJob) => { const updated = { ...draft, ...updatedJob }; setDraft(updated); onUpdated?.(updated); }} />

          <section className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><FileText className="h-4 w-4" /> Artwork & Files ({attachments.length})</div>
            {attachments.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {attachments.map(a => (
                  <a key={a.id} href={a.signed_url || '#'} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {a.file_type?.startsWith('image/') && a.signed_url
                      ? <img src={a.signed_url} alt={a.file_name || 'Project file'} className="h-28 w-full object-cover" />
                      : <div className="flex h-28 items-center justify-center"><ImageIcon className="h-7 w-7 text-slate-400" /></div>}
                    <div className="truncate bg-white px-2 py-1.5 text-xs text-slate-600">{a.file_name || a.attachment_type || 'File'}</div>
                  </a>
                ))}
              </div>
            ) : <p className="text-sm text-slate-400">No project files linked yet.</p>}
          </section>

          {notice && <div className="text-sm text-slate-600">{notice}</div>}
          <button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 font-bold text-brand-dark disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
}
