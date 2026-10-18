import { useState, useEffect } from 'react';
import { X, Phone, MapPin, Clock, CheckCircle2, AlertTriangle, Wrench, User, Calendar, Package, FileText, Camera, Activity as ActivityIcon, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { isModelSerialSuspicious, hasMeaningfulPreDiagnosis } from '@/lib/crmUtils';
import { formatVisitDate, formatArrivalWindow, formatRequestedDate, getStatusColor, getNextVisit, calculateFirstTripCompletion, ESTIMATE_STATUSES, PART_STATUSES, isWaitingOnParts, isReadyForReturnVisitStrict } from '@/lib/visitUtils';
import JobQuickActions from './JobQuickActions';
import VisitSchedulingDrawer from './VisitSchedulingDrawer';
import CompleteVisitDialog from './CompleteVisitDialog';
import { useAuth } from '@/lib/AuthContext';
import { hasSectionAccess } from '@/lib/accessControl';

const TABS = [
  { key: 'overview', label: 'Overview', icon: FileText },
  { key: 'visits', label: 'Visits', icon: Calendar },
  { key: 'diagnosis', label: 'Diagnosis', icon: ClipboardList },
  { key: 'estimate', label: 'Estimate', icon: Wrench },
  { key: 'parts', label: 'Parts', icon: Package },
  { key: 'photos', label: 'Photos', icon: Camera },
  { key: 'activity', label: 'Activity', icon: ActivityIcon },
];

export default function JobDetail({ job, customer, onClose }) {
  const { user } = useAuth();
  const canEditJobs = hasSectionAccess(user, 'jobs');
  const [tab, setTab] = useState('overview');
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState(null);
  const [completeOpen, setCompleteOpen] = useState(false);

  useEffect(() => {
    if (!job) return;
    setDetail(null);
    setTab('overview');
    Promise.all([
      base44.entities.Appointment.filter({ job_id: job.id }).catch(() => []),
      base44.entities.JobPart.filter({ job_id: job.id }).catch(() => []),
      base44.entities.CRMActivity.filter({ job_id: job.id }).catch(() => []),
      job.equipment_asset_id ? base44.entities.EquipmentAsset.get(job.equipment_asset_id).catch(() => null) : Promise.resolve(null),
      job.appliance_id ? base44.entities.ApplianceUnit.get(job.appliance_id).catch(() => null) : Promise.resolve(null),
      job.service_location_id ? base44.entities.ServiceLocation.get(job.service_location_id).catch(() => null) : Promise.resolve(null),
      job.customer_contact_id ? base44.entities.CustomerContact.get(job.customer_contact_id).catch(() => null) : Promise.resolve(null),
      job.lead_id ? base44.entities.Lead.get(job.lead_id).catch(() => null) : Promise.resolve(null),
      base44.functions.invoke('getOfficeAttachments', { job_id: job.id })
        .then(r => (r?.data || r || {}).attachments || [])
        .catch(() => []),
      base44.entities.Technician.filter({ active: true }).catch(() => [])
    ]).then(([visits, parts, activities, equipmentAsset, appliance, location, customerContact, lead, attachments, techs]) => {
      setDetail({ visits, parts, activities, equipmentAsset, appliance, location, customerContact, lead, attachments, techs });
    }).catch(() => setDetail({ visits: [], parts: [], activities: [], equipmentAsset: null, appliance: null, location: null, customerContact: null, lead: null, attachments: [], techs: [] }));
  }, [job]);

  if (!job) return null;

  const reload = () => {
    Promise.all([
      base44.entities.Appointment.filter({ job_id: job.id }).catch(() => []),
      base44.entities.JobPart.filter({ job_id: job.id }).catch(() => []),
      base44.entities.CRMActivity.filter({ job_id: job.id }).catch(() => []),
      base44.functions.invoke('getOfficeAttachments', { job_id: job.id })
        .then(r => (r?.data || r || {}).attachments || [])
        .catch(() => [])
    ]).then(([visits, parts, activities, attachments]) => {
      setDetail(d => ({ ...d, visits, parts, activities, attachments }));
    }).catch(() => {});
  };

  const visits = detail?.visits || [];
  const parts = detail?.parts || [];
  const equipmentAsset = detail?.equipmentAsset || null;
  const appliance = detail?.appliance || null;
  const location = detail?.location || null;
  const customerContact = detail?.customerContact || null;
  const lead = detail?.lead || null;
  const attachments = detail?.attachments || [];
  const techs = detail?.techs || [];
  const nextVisit = getNextVisit(visits);
  const firstTrip = calculateFirstTripCompletion(visits, job.status);

  const getTechName = (id) => {
    const t = techs.find(t => t.id === id);
    return t ? `${t.first_name} ${t.last_name || ''}`.trim() : null;
  };

  const updateJob = async (data) => {
    if (!canEditJobs) return;
    setSaving(true);
    try {
      await base44.entities.Job.update(job.id, data);
      if (data.status) await base44.entities.CRMActivity.create({
        entity_type: 'Job', entity_id: job.id, job_id: job.id,
        customer_id: job.customer_id, event_type: 'Status changed',
        description: `Job status changed to ${data.status}`
      });
      reload();
    } finally { setSaving(false); }
  };

  const updateEstimate = async (field, value) => {
    const data = { [field]: value };
    if (field === 'estimate_status') {
      if (value === 'Presented') data.estimate_presented_at = new Date().toISOString();
      if (value === 'Approved') { data.estimate_approved_at = new Date().toISOString(); data.customer_approved = true; }
    }
    await updateJob(data);
  };

  const updatePartStatus = async (partId, status) => {
    setSaving(true);
    try {
      await base44.entities.JobPart.update(partId, { status });
      reload();
    } finally { setSaving(false); }
  };

  const modelValue = equipmentAsset?.model_number || appliance?.model_number || null;
  const modelSuspicious = modelValue ? isModelSerialSuspicious(modelValue) : false;
  const preDiagnosis = lead?.ai_pre_diagnosis || null;
  const hasPreDiagnosis = hasMeaningfulPreDiagnosis(preDiagnosis, lead?.problem_description || job.issue_description);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-xl overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{job.job_number || `Job ${job.id.slice(0, 8)}`}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(job.status)}`}>{job.status}</span>
            {firstTrip && <span className="ml-2 text-xs text-green-600 font-semibold">✓ First-trip completion</span>}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {/* Parts Banner */}
        {isWaitingOnParts(job.status, parts) && (
          <div className="bg-orange-50 border-b border-orange-200 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Package className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-bold text-orange-800">WAITING ON PARTS</span>
            </div>
            <div className="space-y-1">
              {parts.filter(p => p.status === 'Needed' || p.status === 'Ordered' || p.status === 'Backordered').map(p => (
                <div key={p.id} className="text-xs text-slate-700 flex items-center justify-between gap-2">
                  <span className="truncate">{p.description}{p.part_number ? ` (${p.part_number})` : ''}</span>
                  <span className="font-semibold text-orange-700 flex-shrink-0">{p.status}{p.expected_date ? ` · exp ${p.expected_date}` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {isReadyForReturnVisitStrict(job.status, parts, visits) && (
          <div className="bg-green-50 border-b border-green-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-green-800">PARTS READY — RETURN VISIT NEEDS SCHEDULING</span>
              </div>
              <button onClick={() => { setScheduleType('Return Visit'); setScheduleOpen(true); }}
                className="flex-shrink-0 bg-brand-accent text-brand-dark font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-brand-accent-dark">
                Schedule Return Visit
              </button>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {(job.safety_flag || lead?.safety_flag) && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">SAFETY-FLAGGED SERVICE CALL</div>
                <div className="text-xs mt-0.5">{job.safety_reason || lead?.safety_reason || 'Review the reported safety concern before dispatch or service.'}</div>
              </div>
            </div>
          )}

          {/* Above the fold */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Customer</div>
              <div className="font-medium">{customer ? `${customer.first_name} ${customer.last_name}` : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Phone</div>
              {(customerContact?.phone || customer?.primary_phone) && (
                <a href={`tel:${String(customerContact?.phone || customer?.primary_phone).replace(/[^0-9]/g, '')}`} className="font-medium flex items-center gap-1 text-blue-600"><Phone className="w-3.5 h-3.5" /> {customerContact?.phone || customer?.primary_phone}</a>
              )}
            </div>
            {customerContact && (
              <div className="col-span-2 rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                <div className="text-xs text-slate-500">Job / Site Contact</div>
                <div className="font-medium text-slate-900">{customerContact.display_name}</div>
                <div className="text-xs text-slate-600">{[customerContact.title_or_relationship, customerContact.email].filter(Boolean).join(' · ')}</div>
              </div>
            )}
            <div className="col-span-2">
              <div className="text-xs text-slate-500">Service Address</div>
              {location ? (
                <a href={`https://maps.google.com/?q=${encodeURIComponent(`${location.address_line_1}, ${location.city} ${location.state} ${location.zip}`)}`}
                  target="_blank" rel="noopener" className="font-medium flex items-start gap-1 text-blue-600">
                  <MapPin className="w-3.5 h-3.5 mt-0.5" />
                  {location.location_name ? `${location.location_name} · ` : ''}{location.address_line_1}{location.address_line_2 ? `, ${location.address_line_2}` : ''}, {location.city} {location.state} {location.zip}
                </a>
              ) : <span className="text-slate-400">—</span>}
            </div>
          </div>

          {/* Service / Equipment */}
          <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
            <div>
              <div className="text-xs text-slate-500">Service</div>
              <div className="font-medium">{job.service_type || '—'}</div>
            </div>
            {(equipmentAsset || appliance) && (
              <>
                <div>
                  <div className="text-xs text-slate-500">Equipment / Asset</div>
                  <div className="font-medium">{equipmentAsset?.asset_type || appliance?.appliance_type || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Manufacturer / Brand</div>
                  <div className="font-medium">{equipmentAsset?.manufacturer || appliance?.brand || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Model</div>
                  <div className={`font-medium text-xs ${modelSuspicious ? 'text-red-600' : ''}`}>{modelValue || '—'}{modelSuspicious && ' ⚠'}</div>
                </div>
                {(equipmentAsset?.serial_number || appliance?.serial_number) && (
                  <div>
                    <div className="text-xs text-slate-500">Serial</div>
                    <div className="font-medium text-xs">{equipmentAsset?.serial_number || appliance?.serial_number}</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Problem */}
          {job.issue_description && (
            <div className="text-sm border-t pt-3">
              <div className="text-xs text-slate-500">Reported Problem</div>
              <p className="text-slate-800">{job.issue_description}</p>
            </div>
          )}
          {job.error_code && (
            <div className="flex items-center gap-2 text-sm border-t pt-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Error code: <span className="font-mono font-semibold">{job.error_code}</span>
            </div>
          )}

          {/* Customer Requested */}
          <div className="border-t pt-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Customer Requested</h3>
            </div>
            <div className="text-sm font-medium text-slate-900">
              {formatRequestedDate(job.requested_date, job.requested_window)}
            </div>
          </div>

          {/* Next/Current Visit */}
          {nextVisit ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-semibold text-slate-500 uppercase">{nextVisit.status === 'Complete' ? 'Last Visit' : 'Next / Current Visit'}</h3>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${getStatusColor(nextVisit.status)}`}>{nextVisit.status}</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{formatVisitDate(nextVisit)}</div>
              <div className="text-sm text-slate-600">{formatArrivalWindow(nextVisit)}</div>
              {nextVisit.technician_id && (
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><User className="w-3 h-3" /> {getTechName(nextVisit.technician_id) || '—'}</div>
              )}
              {nextVisit.visit_type && nextVisit.visit_type !== 'Initial Service' && (
                <div className="inline-block mt-1 text-[10px] bg-slate-200 text-slate-600 rounded px-1.5 py-0.5">{nextVisit.visit_type}</div>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              No visits scheduled yet.
            </div>
          )}

          {/* Quick Actions */}
          <JobQuickActions
            job={job} visits={visits} parts={parts} customer={customer}
            canManageJob={canEditJobs}
            onScheduleVisit={(_visit, type) => { setScheduleType(type); setScheduleOpen(true); }}
            onCompleteVisit={(v) => setCompleteOpen(true)}
            onReload={reload}
          />

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-t pt-3 border-b pb-2 sticky top-[73px] bg-white z-[5]">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${tab === t.key ? 'bg-brand-dark text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'overview' && (
            <div className="space-y-3 text-sm">
              <div><span className="text-slate-500">Job Number:</span> <span className="font-mono font-semibold">{job.job_number}</span></div>
              <div><span className="text-slate-500">Service Type:</span> {job.service_type || '—'}</div>
              <div><span className="text-slate-500">Source:</span> {job.source || '—'}</div>
              <div><span className="text-slate-500">Technician:</span> {getTechName(job.assigned_technician_id) || 'Unassigned'}</div>
              {job.warranty_expiration && <div><span className="text-slate-500">Warranty expires:</span> <span className="font-medium text-green-700">{job.warranty_expiration}</span></div>}
              {job.completed_at && <div><span className="text-slate-500">Completed:</span> {new Date(job.completed_at).toLocaleDateString('en-US')}</div>}
              {nextVisit && <div><span className="text-slate-500">Visits:</span> {visits.length} ({visits.filter(v => v.status === 'Complete').length} complete)</div>}
            </div>
          )}

          {tab === 'visits' && (
            <div className="space-y-2">
              {visits.length === 0 && <p className="text-sm text-slate-400">No visits yet.</p>}
              {[...visits].sort((a, b) => (a.visit_number || 1) - (b.visit_number || 1)).map(v => (
                <div key={v.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">Visit {v.visit_number} · {v.visit_type}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(v.status)}`}>{v.status}</span>
                  </div>
                  <div className="text-sm text-slate-600">{formatVisitDate(v)} · {formatArrivalWindow(v)}</div>
                  {v.technician_id && <div className="text-xs text-slate-500 flex items-center gap-1 mt-1"><User className="w-3 h-3" /> {getTechName(v.technician_id)}</div>}
                  {v.visit_outcome && <div className="text-xs text-slate-500 mt-1">Outcome: {v.visit_outcome}</div>}
                  {v.visit_notes && <div className="text-xs text-slate-500 mt-1">Notes: {v.visit_notes}</div>}
                  {v.status !== 'Complete' && v.status !== 'Canceled' && (
                    <button onClick={() => { setScheduleType(null); setScheduleOpen(true); }}
                      className="mt-2 text-xs font-semibold text-brand-dark hover:text-brand-accent">Edit Visit →</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'diagnosis' && (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Customer-Reported Problem</div>
                <p className="text-slate-800">{job.issue_description || lead?.problem_description || '—'}</p>
              </div>
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">AI / Office Pre-Diagnosis</div>
                {hasPreDiagnosis ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
                    <p className="text-amber-900">{preDiagnosis}</p>
                  </div>
                ) : <p className="text-slate-400">No pre-diagnosis available.</p>}
              </div>
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Technician Diagnosis</div>
                <textarea defaultValue={job.diagnosis || ''} onBlur={e => { if (canEditJobs && e.target.value !== (job.diagnosis || '')) updateJob({ diagnosis: e.target.value }); }}
                  rows={4} placeholder="Enter technician diagnosis…" disabled={!canEditJobs}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500" />
              </div>
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Technician Notes</div>
                <textarea defaultValue={job.technician_notes || ''} onBlur={e => { if (canEditJobs && e.target.value !== (job.technician_notes || '')) updateJob({ technician_notes: e.target.value }); }}
                  rows={3} disabled={!canEditJobs}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500" />
              </div>
            </div>
          )}

          {tab === 'estimate' && (
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimate Amount</label>
                <input type="number" step="0.01" defaultValue={job.estimate_amount || ''} onBlur={e => { if (canEditJobs) updateEstimate('estimate_amount', e.target.value ? parseFloat(e.target.value) : null); }}
                  disabled={!canEditJobs} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500" placeholder="$0.00" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Estimate Status</label>
                <select value={job.estimate_status || 'Not Started'} onChange={e => updateEstimate('estimate_status', e.target.value)} disabled={saving || !canEditJobs}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500">
                  {ESTIMATE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {job.estimate_presented_at && <div className="text-xs text-slate-500">Presented: {new Date(job.estimate_presented_at).toLocaleString('en-US')}</div>}
              {job.estimate_approved_at && <div className="text-xs text-slate-500">Approved: {new Date(job.estimate_approved_at).toLocaleString('en-US')}</div>}
            </div>
          )}

          {tab === 'parts' && (
            <div className="space-y-2">
              {parts.length === 0 && <p className="text-sm text-slate-400">No parts tracked.</p>}
              {parts.map(p => (
                <div key={p.id} className="border border-slate-200 rounded-lg p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{p.description}</div>
                      {p.part_number && <div className="text-xs text-slate-500 font-mono">{p.part_number}</div>}
                      <div className="text-xs text-slate-500">Qty: {p.quantity} {p.vendor ? `· Vendor: ${p.vendor}` : ''}</div>
                    </div>
                    <select value={p.status} onChange={e => updatePartStatus(p.id, e.target.value)} disabled={saving || !canEditJobs}
                      className="text-xs border border-slate-300 rounded px-2 py-1 disabled:bg-slate-50 disabled:text-slate-500">
                      {PART_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {p.notes && <div className="text-xs text-slate-500 mt-1">{p.notes}</div>}
                </div>
              ))}
            </div>
          )}

          {tab === 'photos' && (
            <div className="grid grid-cols-2 gap-2">
              {attachments.length === 0 && <p className="text-sm text-slate-400 col-span-2">No photos.</p>}
              {attachments.map(a => {
                const url = a.signed_url || a.legacy_file_url || null;
                const isImage = a.file_type?.startsWith('image/');
                return (
                  <a key={a.id} href={url || '#'} target="_blank" rel="noopener noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:shadow-md">
                    {isImage && url ? (
                      <img src={url} alt={a.attachment_type || a.file_name || 'Photo'} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-slate-50"><FileText className="w-8 h-8 text-slate-400" /></div>
                    )}
                    <div className="text-[10px] text-slate-500 p-1 truncate">{a.file_name || a.attachment_type}</div>
                  </a>
                );
              })}
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-1">
              {(detail?.activities || []).length === 0 && <p className="text-sm text-slate-400">No activity logged.</p>}
              {[...(detail?.activities || [])].reverse().slice(0, 30).map((a, i) => (
                <div key={i} className="text-xs border-b border-slate-100 py-1.5">
                  <span className="font-medium text-slate-700">{a.event_type}</span>
                  <span className="text-slate-500"> — {a.description}</span>
                  {a.created_date && <span className="text-slate-400 block">{new Date(a.created_date).toLocaleString('en-US')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scheduling Drawer */}
      <VisitSchedulingDrawer
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        job={job}
        visit={visits.find(v => v.status !== 'Complete' && v.status !== 'Canceled')}
        customerRequested={{ date: job.requested_date, window: job.requested_window }}
        defaultVisitType={scheduleType}
      />

      {/* Complete Visit Dialog */}
      <CompleteVisitDialog
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        visit={nextVisit}
        job={job}
      />
    </div>
  );
}