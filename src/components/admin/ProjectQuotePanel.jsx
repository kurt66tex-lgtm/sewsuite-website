import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Trash2, Send, Save, ExternalLink, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function money(v) {
  return '$' + Number(v || 0).toFixed(2);
}

function normalizedForm(source = {}) {
  return {
    recipient_email: source.recipient_email || '',
    recipient_name: source.recipient_name || '',
    company_name: source.company_name || '',
    line_items: Array.isArray(source.line_items) && source.line_items.length
      ? source.line_items.map(x => ({ description: x.description || '', quantity: Number(x.quantity || 1), unit_price: Number(x.unit_price || 0) }))
      : [{ description: '', quantity: 1, unit_price: 0 }],
    tax_amount: Number(source.tax_amount || 0),
    valid_until: source.valid_until || '',
    notes: source.notes || '',
    terms: source.terms || ''
  };
}

export default function ProjectQuotePanel({ job, customer, onQuoteChanged }) {
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState(normalizedForm());
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [notice, setNotice] = useState('');
  const [approvalUrl, setApprovalUrl] = useState('');

  const load = async () => {
    setLoading(true);
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageProjectQuote', { action: 'get_for_job', job_id: job.id });
      const data = res?.data || res || {};
      const source = data.quote || data.defaults || {};
      setQuote(data.quote || null);
      setForm(normalizedForm(source));
    } catch (e) {
      setNotice(e?.message || 'Unable to load quote.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lines = useMemo(() => form.line_items.map(row => ({
    ...row,
    amount: Number(row.quantity || 0) * Number(row.unit_price || 0)
  })), [form.line_items]);
  const subtotal = lines.reduce((sum, row) => sum + row.amount, 0);
  const total = subtotal + Number(form.tax_amount || 0);

  const setLine = (index, key, value) => setForm(f => ({
    ...f,
    line_items: f.line_items.map((row, i) => i === index ? { ...row, [key]: value } : row)
  }));
  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, { description: '', quantity: 1, unit_price: 0 }] }));
  const removeLine = (index) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== index) }));

  const saveDraft = async () => {
    setWorking('save');
    setNotice('');
    setApprovalUrl('');
    try {
      const res = await base44.functions.invoke('manageProjectQuote', { action: 'save_draft', job_id: job.id, quote: form });
      const data = res?.data || res || {};
      setQuote(data.quote);
      setForm(normalizedForm(data.quote));
      setNotice(data.quote?.version > (quote?.version || 0) ? `Revision ${data.quote.version} saved as draft.` : 'Quote draft saved.');
      onQuoteChanged?.({ estimate_amount: data.quote?.total, estimate_status: 'Prepared' });
      return data.quote;
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to save quote.');
      return null;
    } finally {
      setWorking('');
    }
  };

  const sendQuote = async () => {
    let current = quote;
    if (!current || current.status !== 'Draft') current = await saveDraft();
    if (!current) return;
    setWorking('send');
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageProjectQuote', {
        action: 'send_quote',
        quote_id: current.id,
        recipient_email: form.recipient_email,
        public_origin: window.location.origin
      });
      const data = res?.data || res || {};
      setQuote(data.quote);
      setApprovalUrl(data.approval_url || '');
      setNotice(`Quote ${data.quote?.quote_number || ''} was accepted by Microsoft 365 for delivery to ${data.quote?.recipient_email || form.recipient_email}.`);
      onQuoteChanged?.({ workflow_stage: 'Quote Sent', estimate_amount: data.quote?.total, estimate_status: 'Presented' });
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to send quote.');
    } finally {
      setWorking('');
    }
  };

  if (loading) return <section className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">Loading quote…</section>;

  const sentLike = quote && quote.status !== 'Draft';

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-slate-900"><FileText className="h-4 w-4" /> Quote</div>
          <div className="mt-1 text-xs text-slate-500">
            {quote ? <>{quote.quote_number} · <span className="font-semibold">{quote.status}</span>{quote.sent_at ? ` · Sent ${new Date(quote.sent_at).toLocaleString()}` : ''}</> : 'No quote prepared yet.'}
          </div>
        </div>
        <button onClick={load} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Customer Email</label>
          <input type="email" value={form.recipient_email} onChange={e => setForm(f => ({...f, recipient_email:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Attention</label>
          <input value={form.recipient_name} onChange={e => setForm(f => ({...f, recipient_name:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr><th className="px-3 py-2 text-left">Description</th><th className="px-3 py-2 text-right w-24">Qty</th><th className="px-3 py-2 text-right w-32">Unit Price</th><th className="px-3 py-2 text-right w-32">Amount</th><th className="w-10"></th></tr>
          </thead>
          <tbody>
            {lines.map((row,index)=>(
              <tr key={index} className="border-t border-slate-100">
                <td className="p-2"><input value={row.description} onChange={e=>setLine(index,'description',e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5" /></td>
                <td className="p-2"><input type="number" min="0" step="1" value={row.quantity} onChange={e=>setLine(index,'quantity',e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-right" /></td>
                <td className="p-2"><input type="number" min="0" step="0.01" value={row.unit_price} onChange={e=>setLine(index,'unit_price',e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-right" /></td>
                <td className="px-3 py-2 text-right font-medium">{money(row.amount)}</td>
                <td className="p-2"><button onClick={()=>removeLine(index)} disabled={form.line_items.length===1} className="text-slate-400 hover:text-red-600 disabled:opacity-30"><Trash2 className="h-4 w-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={addLine} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-600"><Plus className="h-3.5 w-3.5" /> Add line</button>

      <div className="mt-4 ml-auto max-w-xs space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{money(subtotal)}</strong></div>
        <div className="flex items-center justify-between gap-3"><label className="text-slate-500">Tax</label><input type="number" min="0" step="0.01" value={form.tax_amount} onChange={e=>setForm(f=>({...f,tax_amount:e.target.value}))} className="w-28 rounded border border-slate-300 px-2 py-1 text-right" /></div>
        <div className="flex justify-between border-t pt-2 text-base"><span>Total</span><strong>{money(total)}</strong></div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Valid Through</label>
          <input type="date" value={form.valid_until} onChange={e=>setForm(f=>({...f,valid_until:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Company / Organization</label>
          <input value={form.company_name} onChange={e=>setForm(f=>({...f,company_name:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Quote Notes</label>
        <textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Optional customer-facing notes" />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Terms</label>
        <textarea rows={3} value={form.terms} onChange={e=>setForm(f=>({...f,terms:e.target.value}))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {notice && <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{notice}</div>}
      {approvalUrl && <a href={approvalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700">Open customer review page <ExternalLink className="h-3.5 w-3.5" /></a>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={saveDraft} disabled={!!working} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">
          <Save className="h-4 w-4" /> {working==='save' ? 'Saving…' : sentLike ? 'Save New Revision' : 'Save Draft'}
        </button>
        <button onClick={sendQuote} disabled={!!working || total <= 0} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50">
          <Send className="h-4 w-4" /> {working==='send' ? 'Sending…' : quote?.status === 'Draft' ? 'Send Quote' : 'Save & Send Revision'}
        </button>
      </div>
      {quote?.status === 'Sent' && quote.viewed_at && <div className="mt-3 text-xs text-slate-500">Customer viewed this quote {new Date(quote.viewed_at).toLocaleString()}.</div>}
      {['Approved','Declined'].includes(quote?.status) && <div className="mt-3 text-xs font-semibold text-slate-600">Customer response: {quote.status}{quote.response_name ? ` by ${quote.response_name}` : ''}{quote.response_note ? ` — ${quote.response_note}` : ''}</div>}
    </section>
  );
}
