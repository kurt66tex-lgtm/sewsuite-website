import { useEffect, useState } from 'react';
import { FileCheck2, Upload, Trash2, Send, Save, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function normalized(source = {}) {
  return {
    recipient_email: source.recipient_email || '',
    recipient_name: source.recipient_name || '',
    company_name: source.company_name || '',
    message: source.message || ''
  };
}

export default function ProjectProofPanel({ job, customer, onProofChanged }) {
  const [proof, setProof] = useState(null);
  const [form, setForm] = useState(normalized());
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewUrl, setReviewUrl] = useState('');

  const quoteApproved = job.estimate_status === 'Approved';

  const load = async () => {
    setLoading(true);
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageProjectProof', { action: 'get_for_job', job_id: job.id });
      const data = res?.data || res || {};
      setProof(data.proof || null);
      setAttachments(data.attachments || []);
      setForm(normalized(data.proof || data.defaults || {}));
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to load proof.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFiles = async (files) => {
    const selected = [...(files || [])].slice(0, Math.max(0, 6 - attachments.length));
    if (!selected.length) return;
    setWorking('upload');
    setNotice('');
    try {
      const added = [];
      for (const file of selected) {
        if (file.size > 10 * 1024 * 1024) throw new Error(`${file.name} is larger than 10MB.`);
        const uploaded = await base44.integrations.Core.UploadPrivateFile({ file });
        const data = uploaded?.data || uploaded || {};
        const res = await base44.functions.invoke('manageProjectProof', {
          action: 'add_attachment',
          job_id: job.id,
          file_uri: data.file_uri,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size
        });
        const result = res?.data || res || {};
        if (result.attachment) added.push(result.attachment);
      }
      setAttachments(list => [...list, ...added]);
      setNotice(added.length ? `${added.length} proof file${added.length === 1 ? '' : 's'} uploaded.` : 'No proof files were added.');
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to upload proof file.');
    } finally {
      setWorking('');
    }
  };

  const removeAttachment = async (id) => {
    setWorking('remove');
    setNotice('');
    try {
      await base44.functions.invoke('manageProjectProof', { action: 'remove_attachment', job_id: job.id, attachment_id: id });
      setAttachments(list => list.filter(a => a.id !== id));
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to remove proof file.');
    } finally {
      setWorking('');
    }
  };

  const saveDraft = async () => {
    setWorking('save');
    setNotice('');
    setReviewUrl('');
    try {
      const res = await base44.functions.invoke('manageProjectProof', {
        action: 'save_draft',
        job_id: job.id,
        proof: { ...form, attachment_ids: attachments.map(a => a.id) }
      });
      const data = res?.data || res || {};
      setProof(data.proof || null);
      setAttachments(data.attachments || attachments);
      setForm(normalized(data.proof || form));
      setNotice(data.proof?.version > (proof?.version || 0) ? `Proof revision ${data.proof.version} saved as draft.` : 'Proof draft saved.');
      onProofChanged?.({ workflow_stage: 'Proof Preparation', proof_status: 'Preparing' });
      return data.proof;
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to save proof.');
      return null;
    } finally {
      setWorking('');
    }
  };

  const markNotRequired = async () => {
    setWorking('skip');
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageProjectProof', { action: 'mark_not_required', job_id: job.id });
      const data = res?.data || res || {};
      setNotice('Proof approval marked as not required for this project.');
      onProofChanged?.({ workflow_stage: data.workflow_stage || 'Quote Approved', proof_status: data.proof_status || 'Not Required' });
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to update proof requirement.');
    } finally {
      setWorking('');
    }
  };

  const sendProof = async () => {
    let current = proof;
    if (!current || current.status !== 'Draft') current = await saveDraft();
    if (!current) return;
    setWorking('send');
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageProjectProof', {
        action: 'send_proof',
        proof_id: current.id,
        recipient_email: form.recipient_email,
        public_origin: window.location.origin
      });
      const data = res?.data || res || {};
      setProof(data.proof);
      setReviewUrl(data.review_url || '');
      setNotice(`Proof ${data.proof?.proof_number || ''} was accepted by Microsoft 365 for delivery to ${data.proof?.recipient_email || form.recipient_email}.`);
      onProofChanged?.({ workflow_stage: 'Proof Sent', proof_status: 'Sent' });
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to send proof.');
    } finally {
      setWorking('');
    }
  };

  if (loading) return <section className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Loading proof workflow…</section>;

  const lockedProof = proof && ['Sent','Approved'].includes(proof.status);
  const hasPriorProof = proof && proof.status !== 'Draft';
  const priorAttachmentIds = new Set(proof?.status === 'Changes Requested' ? (proof.attachment_ids || []) : []);

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900"><FileCheck2 className="h-4 w-4" /> Artwork Proof</div>
          <div className="mt-1 text-xs text-slate-500">
            {proof ? <>{proof.proof_number} · <span className="font-semibold">{proof.status}</span>{proof.sent_at ? ` · Sent ${new Date(proof.sent_at).toLocaleString()}` : ''}</> : 'No proof prepared yet.'}
          </div>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>

      {!quoteApproved && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">The customer quote must be approved before a proof can be sent.</div>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Customer Email</label>
          <input type="email" value={form.recipient_email} onChange={e=>setForm(f=>({...f,recipient_email:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Attention</label>
          <input value={form.recipient_name} onChange={e=>setForm(f=>({...f,recipient_name:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Proof Files</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments.map(a => (
            <div key={a.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              {a.file_type?.startsWith('image/') && a.signed_url
                ? <a href={a.signed_url} target="_blank" rel="noreferrer"><img src={a.signed_url} alt={a.file_name || 'Proof'} className="h-28 w-full object-contain bg-white" /></a>
                : <a href={a.signed_url || '#'} target="_blank" rel="noreferrer" className="flex h-28 items-center justify-center px-3 text-center text-xs font-semibold text-slate-600">{a.file_name || 'Proof file'}</a>}
              <div className="truncate bg-white px-2 py-1.5 pr-8 text-xs text-slate-600">{a.file_name || 'Proof file'}</div>
              <button type="button" onClick={()=>removeAttachment(a.id)} disabled={!!working || lockedProof || priorAttachmentIds.has(a.id)} className="absolute bottom-1 right-1 rounded bg-white p-1 text-slate-400 shadow hover:text-red-600 disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {attachments.length < 6 && !lockedProof && (
            <label className="flex h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-xs font-semibold text-slate-500 hover:bg-slate-100">
              {working==='upload' ? <Loader2 className="mb-2 h-5 w-5 animate-spin" /> : <Upload className="mb-2 h-5 w-5" />}
              Upload proof
              <span className="mt-1 font-normal text-slate-400">JPG, PNG, WEBP, HEIC or PDF</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" className="hidden" onChange={e=>uploadFiles(e.target.files)} disabled={!!working} />
            </label>
          )}
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Customer Message</label>
        <textarea rows={3} value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {notice && <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{notice}</div>}
      {reviewUrl && <a href={reviewUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">Open customer proof page <ExternalLink className="h-3.5 w-3.5" /></a>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={saveDraft} disabled={!!working || !quoteApproved || !attachments.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> {working==='save' ? 'Saving…' : hasPriorProof ? 'Save New Revision' : 'Save Draft'}
        </button>
        <button onClick={sendProof} disabled={!!working || !quoteApproved || !attachments.length} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50">
          <Send className="h-4 w-4" /> {working==='send' ? 'Sending…' : proof?.status === 'Draft' ? 'Send Proof' : 'Save & Send Revision'}
        </button>
        {!proof && !attachments.length && job.proof_status !== 'Not Required' && (
          <button onClick={markNotRequired} disabled={!!working || !quoteApproved} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-50">{working==='skip' ? 'Updating…' : 'Proof Not Required'}</button>
        )}
      </div>
      {job.proof_status === 'Not Required' && <div className="mt-3 text-xs font-semibold text-slate-500">Proof approval is marked not required for this project.</div>}

      {proof?.status === 'Sent' && proof.viewed_at && <div className="mt-3 text-xs text-slate-500">Customer viewed this proof {new Date(proof.viewed_at).toLocaleString()}.</div>}
      {['Approved','Changes Requested'].includes(proof?.status) && <div className="mt-3 text-xs font-semibold text-slate-600">Customer response: {proof.status}{proof.response_name ? ` by ${proof.response_name}` : ''}{proof.response_note ? ` — ${proof.response_note}` : ''}</div>}
    </section>
  );
}