import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ShieldCheck, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ProofReview() {
  const { token } = useParams();
  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [approveCheck, setApproveCheck] = useState(false);
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
    base44.functions.invoke('manageProjectProof', { action: 'public_get', token })
      .then(res => {
        if (!active) return;
        const data = res?.data || res || {};
        if (!data.proof) throw new Error(data.error || 'Proof not found.');
        setProof(data.proof);
        setName(data.proof.customer?.name || data.proof.recipient_name || '');
      })
      .catch(e => { if (active) setError(e?.response?.data?.error || e?.message || 'Unable to load proof.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const respond = async (decision) => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (decision === 'Approve' && !approveCheck) {
      setError('Please confirm that you approve the proof shown above.');
      return;
    }
    if (decision === 'Changes' && !note.trim()) {
      setError('Please describe the changes you need.');
      return;
    }
    setWorking(decision);
    setError('');
    try {
      const res = await base44.functions.invoke('manageProjectProof', {
        action: 'public_respond', token, decision, response_name: name.trim(), response_note: note.trim()
      });
      const data = res?.data || res || {};
      if (!data.proof) throw new Error(data.error || 'Unable to record your response.');
      setProof(data.proof);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Unable to record your response.');
    } finally {
      setWorking('');
    }
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-16 text-center text-slate-500">Loading proof…</main>;
  if (error && !proof) return <main className="mx-auto max-w-3xl px-4 py-16"><div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">{error}</div></main>;

  const answered = ['Approved','Changes Requested'].includes(proof.status);
  const approved = proof.status === 'Approved';

  return (
    <main className="min-h-screen bg-slate-50 py-10 sm:py-14">
      <div className="mx-auto max-w-5xl px-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Artwork Proof</div>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">{proof.proof_number}</h1>
            <p className="mt-2 text-slate-600">{proof.business.name}</p>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <section className="grid gap-4 sm:grid-cols-2">
              <div><div className="text-xs font-semibold uppercase text-slate-500">Prepared for</div><div className="mt-1 font-semibold text-slate-900">{proof.customer.company_name || proof.customer.name}</div>{proof.customer.company_name && <div className="text-sm text-slate-600">{proof.customer.name}</div>}</div>
              <div><div className="text-xs font-semibold uppercase text-slate-500">Project</div><div className="mt-1 font-semibold text-slate-900">{proof.project.type || proof.project.number}</div><div className="text-sm text-slate-600">{proof.project.number}</div></div>
            </section>

            {proof.message && <section className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-semibold uppercase text-slate-500">Review instructions</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{proof.message}</p></section>}

            <section>
              <div className="mb-3 text-xs font-semibold uppercase text-slate-500">Proof Files</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(proof.attachments || []).map(a => (
                  <div key={a.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {a.file_type?.startsWith('image/') && a.signed_url ? (
                      <a href={a.signed_url} target="_blank" rel="noreferrer">
                        <img src={a.signed_url} alt={a.file_name || 'Proof'} className="max-h-[70vh] w-full object-contain bg-white" />
                      </a>
                    ) : (
                      <a href={a.signed_url || '#'} target="_blank" rel="noreferrer" className="flex min-h-48 items-center justify-center gap-2 p-6 text-center font-semibold text-slate-700">
                        Open {a.file_name || 'proof file'} <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <div className="border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">{a.file_name || 'Proof file'}</div>
                  </div>
                ))}
              </div>
            </section>

            {answered ? (
              <section className={`rounded-xl border p-5 ${approved ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2 font-bold text-slate-900">{approved ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />} {approved ? 'Proof Approved' : 'Changes Requested'}</div>
                {proof.response_name && <p className="mt-2 text-sm text-slate-700">Recorded for {proof.response_name}{proof.responded_at ? ` on ${new Date(proof.responded_at).toLocaleString()}` : ''}.</p>}
                {proof.response_note && <p className="mt-2 text-sm text-slate-700">Note: {proof.response_note}</p>}
              </section>
            ) : (
              <section className="rounded-xl border border-slate-200 p-5">
                <div className="mb-4 flex items-center gap-2 font-bold text-slate-900"><ShieldCheck className="h-5 w-5" /> Respond to this proof</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Your name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" /></div>
                  <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Changes / note</label><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="Required only if requesting changes" /></div>
                </div>
                <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={approveCheck} onChange={e=>setApproveCheck(e.target.checked)} className="mt-1" /><span>I have reviewed this proof carefully and approve it for production.</span></label>
                {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={()=>respond('Approve')} disabled={!!working} className="rounded-lg bg-green-600 px-5 py-2.5 font-bold text-white disabled:opacity-50">{working==='Approve'?'Recording…':'Approve Proof'}</button>
                  <button onClick={()=>respond('Changes')} disabled={!!working} className="rounded-lg border border-amber-300 bg-white px-5 py-2.5 font-bold text-amber-800 disabled:opacity-50">{working==='Changes'?'Recording…':'Request Changes'}</button>
                </div>
              </section>
            )}

            <section className="border-t border-slate-200 pt-4 text-sm text-slate-500">
              Questions? {proof.business.phone && <span>Call {proof.business.phone}. </span>}{proof.business.email && <span>Email {proof.business.email}.</span>}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
