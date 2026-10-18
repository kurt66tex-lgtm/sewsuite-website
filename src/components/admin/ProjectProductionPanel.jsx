import { useEffect, useState } from 'react';
import { CalendarDays, Factory, CheckCircle2, RotateCcw, PackageCheck, Truck, Store, ClipboardCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function localDate() {
  return new Date().toISOString().slice(0,10);
}

export default function ProjectProductionPanel({ job, onJobChanged }) {
  const [scheduledDate, setScheduledDate] = useState(job.production_scheduled_date || job.requested_date || localDate());
  const [fulfillment, setFulfillment] = useState(job.fulfillment_method || 'Not Set');
  const [qualityNotes, setQualityNotes] = useState(job.quality_check_notes || '');
  const [completionNotes, setCompletionNotes] = useState(job.completion_notes || '');
  const [carrier, setCarrier] = useState(job.shipping_carrier || '');
  const [tracking, setTracking] = useState(job.shipping_tracking_number || '');
  const [working, setWorking] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setScheduledDate(job.production_scheduled_date || job.requested_date || localDate());
    setFulfillment(job.fulfillment_method || 'Not Set');
    setQualityNotes(job.quality_check_notes || '');
    setCompletionNotes(job.completion_notes || '');
    setCarrier(job.shipping_carrier || '');
    setTracking(job.shipping_tracking_number || '');
  }, [job.id, job.production_scheduled_date, job.requested_date, job.fulfillment_method, job.quality_check_notes, job.completion_notes, job.shipping_carrier, job.shipping_tracking_number]);

  const call = async (action, extra = {}) => {
    setWorking(action);
    setNotice('');
    try {
      const res = await base44.functions.invoke('manageProjectProduction', { action, job_id: job.id, ...extra });
      const data = res?.data || res || {};
      if (data.job) onJobChanged?.(data.job);
      if (action === 'schedule') setNotice('Production scheduled.');
      if (action === 'start') setNotice('Production started.');
      if (action === 'finish_production') setNotice('Production completed and moved to quality check.');
      if (action === 'quality_check') setNotice(extra.result === 'Passed' ? 'Quality check passed.' : 'Returned to production for rework.');
      if (action === 'mark_ready') {
        const delivery = data.notification?.sent ? ' Customer pickup email accepted for delivery.' : '';
        setNotice('Project marked ready for fulfillment.' + delivery);
      }
      if (action === 'complete') {
        const review = data.review_request_id ? ' Review request workflow created.' : '';
        const delivery = data.notification?.sent ? ' Customer shipping email accepted for delivery.' : '';
        setNotice('Project completed.' + delivery + review);
      }
      return data;
    } catch (e) {
      setNotice(e?.response?.data?.error || e?.message || 'Unable to update production workflow.');
      return null;
    } finally {
      setWorking('');
    }
  };

  const stage = job.workflow_stage || 'Quote Needed';
  const productionReady = job.estimate_status === 'Approved' && ['Approved','Not Required'].includes(job.proof_status || '');
  const isCompleted = job.status === 'Completed' || stage === 'Completed';

  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <div className="mb-4 flex items-center gap-2 font-bold text-slate-900"><Factory className="h-4 w-4" /> Production & Fulfillment</div>

      {!productionReady && !isCompleted && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Production becomes available after the quote is approved and the proof is approved or marked not required.
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">Current Stage</div>
          <div className="mt-1 font-semibold text-slate-900">{stage}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500">Fulfillment Status</div>
          <div className="mt-1 font-semibold text-slate-900">{job.fulfillment_status || 'Not Ready'}</div>
        </div>
      </div>

      {stage === 'Proof Approved' || (productionReady && ['Quote Approved','Artwork / Logo Needed','Proof Preparation'].includes(stage) && job.proof_status === 'Not Required') ? (
        <div className="rounded-lg border border-slate-200 p-3">
          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Production Date</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input type="date" value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={()=>call('schedule',{production_scheduled_date:scheduledDate})} disabled={!!working || !productionReady} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50">
              <CalendarDays className="h-4 w-4" /> {working==='schedule'?'Scheduling…':'Schedule Production'}
            </button>
          </div>
        </div>
      ) : null}

      {stage === 'Production Scheduled' && (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-3 text-sm text-slate-600">Scheduled for <strong>{job.production_scheduled_date || '—'}</strong>.</div>
          <button onClick={()=>call('start')} disabled={!!working} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50">
            <Factory className="h-4 w-4" /> {working==='start'?'Starting…':'Start Production'}
          </button>
        </div>
      )}

      {stage === 'In Production' && (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-3 text-sm text-slate-600">
            {job.quality_check_status === 'Needs Rework'
              ? <span className="font-semibold text-amber-700">Rework required{job.quality_check_notes ? ': ' + job.quality_check_notes : ''}</span>
              : <>Production started {job.production_started_at ? new Date(job.production_started_at).toLocaleString() : ''}.</>}
          </div>
          <button onClick={()=>call('finish_production')} disabled={!!working} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50">
            <ClipboardCheck className="h-4 w-4" /> {working==='finish_production'?'Updating…':'Send to Quality Check'}
          </button>
        </div>
      )}

      {stage === 'Quality Check' && (
        <div className="rounded-lg border border-slate-200 p-3">
          {job.quality_check_status !== 'Passed' ? (
            <>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Quality Check Notes</label>
              <textarea rows={2} value={qualityNotes} onChange={e=>setQualityNotes(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Optional for pass; required for rework" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={()=>call('quality_check',{result:'Passed',notes:qualityNotes})} disabled={!!working} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  <CheckCircle2 className="h-4 w-4" /> {working==='quality_check'?'Updating…':'Pass Quality Check'}
                </button>
                <button onClick={()=>call('quality_check',{result:'Needs Rework',notes:qualityNotes})} disabled={!!working} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-800 disabled:opacity-50">
                  <RotateCcw className="h-4 w-4" /> Needs Rework
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-900">
              <div className="flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" /> Quality Check Passed</div>
              <div className="mt-1 text-xs text-green-800">{job.quality_checked_at ? new Date(job.quality_checked_at).toLocaleString() : ''}{job.quality_check_notes ? ' · ' + job.quality_check_notes : ''}</div>
            </div>
          )}

          {job.quality_check_status === 'Passed' && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="mb-2 text-sm font-semibold text-slate-800">Next: choose how the completed order will be delivered.</div>
              <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Fulfillment Method</label>
              <select value={fulfillment} onChange={e=>setFulfillment(e.target.value)} className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option>Not Set</option>
                <option>Local Pickup</option>
                <option>Shipping</option>
              </select>
              <button onClick={()=>call('mark_ready',{fulfillment_method:fulfillment})} disabled={!!working || fulfillment==='Not Set'} className="inline-flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-brand-dark disabled:opacity-50">
                <PackageCheck className="h-4 w-4" /> {working==='mark_ready'?'Updating…':'Mark Ready for Fulfillment'}
              </button>
            </div>
          )}
        </div>
      )}

      {stage === 'Ready for Pickup / Shipping' && (
        <div className="rounded-lg border border-slate-200 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            {job.fulfillment_method === 'Shipping' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
            Ready for {job.fulfillment_method || 'fulfillment'}
          </div>

          {job.fulfillment_method === 'Shipping' && (
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Carrier</label><input value={carrier} onChange={e=>setCarrier(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="UPS, FedEx, USPS…" /></div>
              <div><label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Tracking Number</label><input value={tracking} onChange={e=>setTracking(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div>
            </div>
          )}

          <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Completion Notes</label>
          <textarea rows={2} value={completionNotes} onChange={e=>setCompletionNotes(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={()=>call('complete',{completion_notes:completionNotes,shipping_carrier:carrier,shipping_tracking_number:tracking})} disabled={!!working} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" /> {working==='complete'?'Completing…':job.fulfillment_method==='Shipping'?'Mark Shipped & Complete':'Mark Picked Up & Complete'}
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <div className="font-bold">Project Completed</div>
          <div className="mt-1">{job.completed_at ? new Date(job.completed_at).toLocaleString() : ''}{job.fulfillment_status ? ' · ' + job.fulfillment_status : ''}</div>
          {job.shipping_tracking_number && <div className="mt-1">Tracking: {job.shipping_tracking_number}</div>}
          <div className="mt-2 text-xs text-green-800">The review-request workflow is handled separately according to the client’s reputation-management settings.</div>
        </div>
      )}

      {notice && <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{notice}</div>}
    </section>
  );
}
