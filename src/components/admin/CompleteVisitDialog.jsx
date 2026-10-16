import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CORE_VISIT_OUTCOMES, APPLIANCE_VISIT_OUTCOMES, isCompletedServiceOutcome, isReturnRequiredOutcome } from '@/lib/visitUtils';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function CompleteVisitDialog({ open, onClose, visit, job, functionName = 'completeVisit' }) {
  const { settings } = useBusinessSettings();
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const visitOutcomes = isApplianceModule ? APPLIANCE_VISIT_OUTCOMES : CORE_VISIT_OUTCOMES;
  const [outcome, setOutcome] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [techNotes, setTechNotes] = useState('');
  const [parts, setParts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset when opened
  useEffect(() => {
    if (open) {
      setOutcome('');
      setDiagnosis(job?.diagnosis || '');
      setTechNotes(job?.technician_notes || '');
      setParts([]);
      setError('');
    }
  }, [open]);

  if (!open || !visit) return null;

  const selectOutcome = (nextOutcome) => {
    setOutcome(nextOutcome);
    setError('');
    if (isCompletedServiceOutcome(nextOutcome)) {
      setParts(prev => prev.map(p => ({ ...p, status: 'Installed' })));
    } else if (isReturnRequiredOutcome(nextOutcome)) {
      setParts(prev => prev.map(p => ({ ...p, status: 'Needed' })));
    } else {
      setParts([]);
    }
  };

  const addPart = () => setParts([...parts, {
    part_number: '',
    description: '',
    quantity: 1,
    vendor: '',
    notes: '',
    status: isCompletedServiceOutcome(outcome) ? 'Installed' : 'Needed'
  }]);
  const updatePart = (i, field, val) => setParts(parts.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const removePart = (i) => setParts(parts.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!outcome) { setError('Please select a visit outcome.'); return; }
    if (isReturnRequiredOutcome(outcome) && parts.length === 0) {
      setError('At least one part or material item is required when a return visit is needed.'); return;
    }
    if (parts.some(p => !String(p.description || '').trim())) {
      setError('Each added part needs a description.'); return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke(functionName, {
        visit_id: visit.id,
        outcome,
        diagnosis: diagnosis || null,
        technician_notes: techNotes || null,
        parts: (isCompletedServiceOutcome(outcome) || isReturnRequiredOutcome(outcome)) && parts.length > 0 ? parts : undefined
      });
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e.message || 'Failed to complete visit.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10 rounded-t-xl">
          <h2 className="font-bold text-slate-900 text-lg">Complete Visit {visit.visit_number || ''}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-4 space-y-4">
          {/* Outcome */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Visit Outcome</label>
            <div className="space-y-1.5">
              {visitOutcomes.map(o => (
                <button key={o} onClick={() => selectOutcome(o)}
                  className={`w-full text-left border rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${outcome === o ? 'border-brand-accent bg-yellow-50 text-brand-dark' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Technician Diagnosis</label>
            <textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} rows={3}
              placeholder="What was the issue and what was done…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Technician Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Technician Notes</label>
            <textarea value={techNotes} onChange={e => setTechNotes(e.target.value)} rows={2}
              placeholder="Internal notes…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          {/* Parts / materials used or needed */}
          {(isCompletedServiceOutcome(outcome) || isReturnRequiredOutcome(outcome)) && (
            <div className={`border rounded-lg p-3 space-y-2 ${isCompletedServiceOutcome(outcome) ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className={`text-xs font-bold uppercase ${isCompletedServiceOutcome(outcome) ? 'text-green-800' : 'text-amber-800'}`}>
                {isCompletedServiceOutcome(outcome) ? (isApplianceModule ? 'Parts Used (Optional)' : 'Parts / Materials Used (Optional)') : (isApplianceModule ? 'Parts Needed' : 'Parts / Materials Needed')}
              </div>
              {isCompletedServiceOutcome(outcome) && (
                <div className="text-[11px] text-green-800">Add any parts or materials used during this visit. Items already tracked as Received or On Truck will be marked Installed when service is completed.</div>
              )}
              {parts.map((p, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-2 space-y-1.5">
                  <div className="flex gap-2">
                    <input value={p.part_number} onChange={e => updatePart(i, 'part_number', e.target.value)} placeholder={isApplianceModule ? "Part #" : "Part / item #"} className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-xs" />
                    <input value={p.quantity} onChange={e => updatePart(i, 'quantity', parseInt(e.target.value) || 1)} type="number" min="1" className="w-16 border border-slate-300 rounded px-2 py-1.5 text-xs" />
                    <button onClick={() => removePart(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <input value={p.description} onChange={e => updatePart(i, 'description', e.target.value)} placeholder="Description" className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs" />
                  <div className="flex gap-2">
                    <input value={p.vendor} onChange={e => updatePart(i, 'vendor', e.target.value)} placeholder="Vendor (optional)" className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-xs" />
                  </div>
                </div>
              ))}
              <button onClick={addPart} className="flex items-center gap-1 text-xs font-semibold text-brand-dark hover:text-brand-accent"><Plus className="w-3.5 h-3.5" /> Add {isApplianceModule ? 'Part' : 'Part / Material'}</button>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">{error}</div>}

          <div className="flex gap-2 border-t pt-3">
            <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-dark text-white rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Complete Visit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}