import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Printer, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function money(v) {
  return '$' + Number(v || 0).toFixed(2);
}

export default function QuoteReview() {
  const { token } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [approvedCheck, setApprovedCheck] = useState(false);
  const [working, setWorking] = useState('');

  useEffect(() => {
    let robots = document.querySelector('meta[name="robots"]');
    const robotsPrior = robots?.getAttribute('content') ?? null;
    const robotsCreated = !robots;
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex,nofollow,noarchive');

    let referrer = document.querySelector('meta[name="referrer"]');
    const referrerPrior = referrer?.getAttribute('content') ?? null;
    const referrerCreated = !referrer;
    if (!referrer) {
      referrer = document.createElement('meta');
      referrer.setAttribute('name', 'referrer');
      document.head.appendChild(referrer);
    }
    referrer.setAttribute('content', 'no-referrer');

    return () => {
      if (robotsCreated) robots?.remove(); else if (robotsPrior != null) robots?.setAttribute('content', robotsPrior);
      if (referrerCreated) referrer?.remove(); else if (referrerPrior != null) referrer?.setAttribute('content', referrerPrior);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.functions.invoke('manageProjectQuote', { action: 'public_get', token })
      .then(res => {
        if (!active) return;
        const data = res?.data || res || {};
        if (!data.quote) throw new Error(data.error || 'Quote not found.');
        setQuote(data.quote);
        setName(data.quote.customer?.name || data.quote.recipient_name || '');
      })
      .catch(e => { if (active) setError(e?.response?.data?.error || e?.message || 'Unable to load quote.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const respond = async (decision) => {
    if (decision === 'Approve' && !approvedCheck) {
      setError('Please confirm that you approve the quote shown above.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setWorking(decision);
    setError('');
    try {
      const res = await base44.functions.invoke('manageProjectQuote', {
        action: 'public_respond', token, decision, response_name: name.trim(), response_note: note.trim()
      });
      const data = res?.data || res || {};
      if (!data.quote) throw new Error(data.error || 'Unable to record your response.');
      setQuote(data.quote);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to record your response.');
    } finally {
      setWorking('');
    }
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">Loading quote…</main>;
  if (error && !quote) return <main className="mx-auto max-w-3xl px-4 py-16"><div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">{error}</div></main>;

  const answered = ['Approved','Declined','Expired'].includes(quote.status);
  const approved = quote.status === 'Approved';

  return (
    <main className="bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quote</div>
                <h1 className="mt-1 text-3xl font-bold text-slate-900">{quote.quote_number}</h1>
                <p className="mt-2 text-slate-600">{quote.business.name}</p>
              </div>
              <button onClick={()=>window.print()} className="print:hidden inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"><Printer className="h-4 w-4" /> Print / Save PDF</button>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <section className="grid gap-4 sm:grid-cols-2">
              <div><div className="text-xs font-semibold uppercase text-slate-500">Prepared for</div><div className="mt-1 font-semibold text-slate-900">{quote.customer.company_name || quote.customer.name}</div>{quote.customer.company_name && <div className="text-sm text-slate-600">{quote.customer.name}</div>}</div>
              <div><div className="text-xs font-semibold uppercase text-slate-500">Project</div><div className="mt-1 font-semibold text-slate-900">{quote.project.type || quote.project.number}</div><div className="text-sm text-slate-600">{quote.project.number}</div></div>
              {quote.valid_until && <div><div className="text-xs font-semibold uppercase text-slate-500">Valid through</div><div className="mt-1 text-slate-800">{quote.valid_until}</div></div>}
              {quote.project.desired_completion && <div><div className="text-xs font-semibold uppercase text-slate-500">Desired completion</div><div className="mt-1 text-slate-800">{quote.project.desired_completion}</div></div>}
            </section>

            {quote.project.description && <section><div className="text-xs font-semibold uppercase text-slate-500">Project description</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{quote.project.description}</p></section>}

            <section className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3 text-left">Description</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit Price</th><th className="px-4 py-3 text-right">Amount</th></tr></thead>
                <tbody>{quote.line_items.map((row,i)=><tr key={i} className="border-t border-slate-100"><td className="px-4 py-3">{row.description}</td><td className="px-4 py-3 text-right">{row.quantity}</td><td className="px-4 py-3 text-right">{money(row.unit_price)}</td><td className="px-4 py-3 text-right font-medium">{money(row.amount)}</td></tr>)}</tbody>
              </table>
            </section>

            <section className="ml-auto max-w-sm space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><strong>{money(quote.subtotal)}</strong></div>
              {Number(quote.tax_amount || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">Tax</span><strong>{money(quote.tax_amount)}</strong></div>}
              <div className="flex justify-between border-t border-slate-200 pt-3 text-xl"><span>Total</span><strong>{money(quote.total)}</strong></div>
            </section>

            {quote.notes && <section><div className="text-xs font-semibold uppercase text-slate-500">Notes</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{quote.notes}</p></section>}
            {quote.terms && <section className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-semibold uppercase text-slate-500">Terms</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{quote.terms}</p></section>}

            {answered ? (
              <section className={`rounded-xl border p-5 ${approved ? 'border-green-200 bg-green-50' : quote.status === 'Declined' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2 font-bold text-slate-900">{approved ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />} Quote {quote.status}</div>
                {quote.response_name && <p className="mt-2 text-sm text-slate-700">Recorded for {quote.response_name}{quote.responded_at ? ` on ${new Date(quote.responded_at).toLocaleString()}` : ''}.</p>}
                {quote.response_note && <p className="mt-2 text-sm text-slate-700">Note: {quote.response_note}</p>}
              </section>
            ) : (
              <section className="rounded-xl border border-slate-200 p-5 print:hidden">
                <div className="mb-4 flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5" /> Respond to this quote</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Your name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Note (optional)</label><input value={note} onChange={e=>setNote(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
                </div>
                <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={approvedCheck} onChange={e=>setApprovedCheck(e.target.checked)} className="mt-1" /><span>I have reviewed the scope, price and terms shown above and approve this quote.</span></label>
                {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={()=>respond('Approve')} disabled={!!working} className="rounded-lg bg-green-600 px-5 py-2.5 font-bold text-white disabled:opacity-50">{working==='Approve'?'Recording…':'Approve Quote'}</button>
                  <button onClick={()=>respond('Decline')} disabled={!!working} className="rounded-lg border border-red-300 bg-white px-5 py-2.5 font-bold text-red-700 disabled:opacity-50">{working==='Decline'?'Recording…':'Decline Quote'}</button>
                </div>
              </section>
            )}

            <section className="border-t border-slate-200 pt-4 text-sm text-slate-500">
              Questions? {quote.business.phone && <span>Call {quote.business.phone}. </span>}{quote.business.email && <span>Email {quote.business.email}.</span>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
