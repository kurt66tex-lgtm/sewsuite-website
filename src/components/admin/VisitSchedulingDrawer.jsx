import { useState, useEffect } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { VISIT_TYPES, ARRIVAL_WINDOWS, formatRequestedDate } from '@/lib/visitUtils';

export default function VisitSchedulingDrawer({ open, onClose, job, visit, customerRequested, defaultVisitType }) {
  const [visitType, setVisitType] = useState('Initial Service');
  const [scheduledDate, setScheduledDate] = useState('');
  const [windowChoice, setWindowChoice] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [technicianId, setTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    base44.entities.Technician.filter({ active: true }).then(list => setTechnicians(list.filter(t => !t.is_test_data))).catch(() => {});

    if (visit) {
      setVisitType(visit.visit_type || 'Initial Service');
      setScheduledDate(visit.scheduled_date || '');
      setWindowChoice(
        ARRIVAL_WINDOWS.find(w =>
          w.start === visit.arrival_window_start && w.end === visit.arrival_window_end
        )?.label || 'custom'
      );
      setCustomStart(visit.arrival_window_start || '');
      setCustomEnd(visit.arrival_window_end || '');
      setTechnicianId(visit.technician_id || '');
      setNotes(visit.visit_notes || '');
    } else if (job) {
      setVisitType(defaultVisitType || (job.original_job_id ? 'Warranty Visit' : 'Initial Service'));
      setScheduledDate(job.requested_date || '');
      setWindowChoice('');
      setCustomStart('');
      setCustomEnd('');
      setTechnicianId(job.assigned_technician_id || '');
      setNotes('');
    }
  }, [open, visit, job]);

  if (!open) return null;

  const arrivalStart = windowChoice === 'custom' ? customStart : ARRIVAL_WINDOWS.find(w => w.label === windowChoice)?.start;
  const arrivalEnd = windowChoice === 'custom' ? customEnd : ARRIVAL_WINDOWS.find(w => w.label === windowChoice)?.end;

  const handleSave = async () => {
    if (!scheduledDate) { setError('Date is required.'); return; }
    setSaving(true);
    try {
      await base44.functions.invoke('scheduleVisit', {
        visit_id: visit?.id || null,
        job_id: job.id,
        visit_type: visitType,
        scheduled_date: scheduledDate,
        arrival_window_start: arrivalStart || null,
        arrival_window_end: arrivalEnd || null,
        technician_id: technicianId || null,
        visit_notes: notes || null,
        is_test_data: job?.is_test_data || false
      });
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e.message || 'Failed to schedule visit.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto h-full">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900 text-lg">{visit ? 'Edit Visit' : 'Schedule Visit'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Customer Requested */}
          {customerRequested && (customerRequested.date || customerRequested.window) && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Customer Requested</div>
              <div className="text-sm font-medium text-slate-700">
                {formatRequestedDate(customerRequested.date, customerRequested.window)}
              </div>
            </div>
          )}

          {/* Visit Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Visit Type</label>
            <select value={visitType} onChange={e => setVisitType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {VISIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Date</label>
            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Arrival Window */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Arrival Window</label>
            <div className="space-y-1.5">
              {ARRIVAL_WINDOWS.map(w => (
                <button key={w.label} onClick={() => { setWindowChoice(w.label); setCustomStart(''); setCustomEnd(''); }}
                  className={`w-full text-left border rounded-lg px-3 py-2 text-sm transition-colors ${windowChoice === w.label ? 'border-brand-accent bg-yellow-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  {w.label}
                </button>
              ))}
              <button onClick={() => setWindowChoice('custom')}
                className={`w-full text-left border rounded-lg px-3 py-2 text-sm transition-colors ${windowChoice === 'custom' ? 'border-brand-accent bg-yellow-50' : 'border-slate-200 hover:border-slate-300'}`}>
                Custom
              </button>
              {windowChoice === 'custom' && (
                <div className="flex gap-2">
                  <input type="text" value={customStart} onChange={e => setCustomStart(e.target.value)} placeholder="Start (e.g. 9:00 AM)" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <input type="text" value={customEnd} onChange={e => setCustomEnd(e.target.value)} placeholder="End (e.g. 11:00 AM)" className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              )}
            </div>
          </div>

          {/* Technician */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Technician</label>
            <select value={technicianId} onChange={e => setTechnicianId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Unassigned</option>
              {technicians.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name || ''}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Scheduling Notes (internal)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Internal notes for this visit…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 border-t pt-3 sticky bottom-0 bg-white">
            <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />} {visit ? 'Update' : 'Schedule'} Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}