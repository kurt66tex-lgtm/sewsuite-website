import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Wrench, Navigation, CheckCircle2, Clock, ClipboardList, Loader2, LogOut, AlertTriangle, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatArrivalWindow, getStatusColor } from '@/lib/visitUtils';
import CompleteVisitDialog from '@/components/admin/CompleteVisitDialog';
import { useAuth } from '@/lib/AuthContext';

export default function TechnicianView() {
  const { logout } = useAuth();
  const [technician, setTechnician] = useState(null);
  const [visits, setVisits] = useState([]);
  const [jobs, setJobs] = useState({});
  const [customers, setCustomers] = useState({});
  const [contacts, setContacts] = useState({});
  const [equipmentAssets, setEquipmentAssets] = useState({});
  const [appliances, setAppliances] = useState({});
  const [locations, setLocations] = useState({});
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [detailData, setDetailData] = useState({});
  const [busy, setBusy] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [diagnosisText, setDiagnosisText] = useState('');
  const [showDiagnosis, setShowDiagnosis] = useState(false);

  const loadData = useCallback(async (dateStr) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await base44.functions.invoke('getMyTechnicianData', { date: dateStr });
      const data = res.data || res;
      if (data.error) { setAuthError(data.error); return; }
      setTechnician(data.technician);
      setVisits(data.visits || []);
      setJobs(data.jobs || {});
      setCustomers(data.customers || {});
      setContacts(data.contacts || {});
      setEquipmentAssets(data.equipment_assets || {});
      setAppliances(data.appliances || {});
      setLocations(data.locations || {});
    } catch (e) {
      setAuthError(e.message || 'Failed to load technician data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(viewDate); }, [viewDate, loadData]);

  const loadVisitDetail = async (visit) => {
    const job = jobs[visit.job_id];
    if (!job) return;
    try {
      const res = await base44.functions.invoke('getMyVisitDetail', { visit_id: visit.id });
      const data = res.data || res;
      if (data.error) return;
      setDetailData(d => ({ ...d, [visit.id]: { lead: data.lead, attachments: data.attachments, activities: data.activities } }));
    } catch {}
  };

  const toggleVisit = (visit) => {
    if (expandedVisit === visit.id) {
      setExpandedVisit(null);
    } else {
      setExpandedVisit(visit.id);
      if (!detailData[visit.id]) loadVisitDetail(visit);
      const job = jobs[visit.job_id];
      setDiagnosisText(job?.diagnosis || '');
      setShowDiagnosis(false);
    }
  };

  const updateVisit = async (visitId, status, label) => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke('updateMyVisitStatus', { visit_id: visitId, status });
      const data = res.data || res;
      if (data.error) { alert(data.error); return; }
      setVisits(prev => prev.map(v => v.id === visitId ? { ...v, status } : v));
    } catch (e) {
      alert(e.message || 'Failed to update visit');
    } finally { setBusy(false); }
  };

  const saveDiagnosis = async (visit) => {
    const job = jobs[visit.job_id];
    if (!job) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('saveMyDiagnosis', { job_id: job.id, diagnosis: diagnosisText });
      const data = res.data || res;
      if (data.error) { alert(data.error); return; }
      setJobs(prev => ({ ...prev, [job.id]: { ...prev[job.id], diagnosis: diagnosisText } }));
      setShowDiagnosis(false);
    } catch (e) {
      alert(e.message || 'Failed to save diagnosis');
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Required</h1>
          <p className="text-sm text-slate-600 mb-4">{authError}</p>
          <p className="text-xs text-slate-400">If you are a technician, please ensure your account is linked to a technician record. Contact your administrator if you need access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-brand-dark text-white sticky top-0 z-20">
        <div className="lg:hidden flex items-center justify-between px-4 py-2 border-b border-slate-700">
          <Link to="/admin" className="font-bold text-xs text-brand-accent">CRM</Link>
          <span className="text-xs font-semibold">Technician View</span>
          <button onClick={() => logout('/login?returnTo=/admin/technician')} className="text-xs text-slate-300 inline-flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between max-w-md mx-auto gap-3">
            <span className="text-sm font-bold text-brand-accent">{technician?.first_name} {technician?.last_name}</span>
            <div className="flex items-center gap-2">
              <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="bg-brand-charcoal text-white text-xs border-0 rounded px-2 py-1" />
              <button onClick={() => logout('/login?returnTo=/admin/technician')} className="hidden lg:inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white">
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-3 space-y-3">
        {visits.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Wrench className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No visits assigned for this day.</p>
          </div>
        )}

        {visits.sort((a, b) => (a.arrival_window_start || '').localeCompare(b.arrival_window_start || '')).map(visit => {
          const job = jobs[visit.job_id];
          const customer = job ? customers[job.customer_id] : null;
          const contact = job && job.customer_contact_id ? contacts[job.customer_contact_id] : null;
          const callPhone = contact?.phone || customer?.primary_phone || null;
          const asset = job && job.equipment_asset_id ? equipmentAssets[job.equipment_asset_id] : null;
          const appliance = job && job.appliance_id ? appliances[job.appliance_id] : null;
          const location = job && job.service_location_id ? locations[job.service_location_id] : null;
          const detail = detailData[visit.id] || {};
          const isExpanded = expandedVisit === visit.id;

          return (
            <div key={visit.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <button onClick={() => toggleVisit(visit)} className="w-full text-left p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-sm text-slate-900">{formatArrivalWindow(visit)}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(visit.status)}`}>{visit.status}</span>
                </div>
                <div className="font-semibold text-slate-900">{customer ? `${customer.first_name} ${customer.last_name}` : '—'}</div>
                <div className="text-xs text-slate-500">{job?.service_type || asset?.asset_type || appliance?.appliance_type || 'Service'} · {job?.job_number || ''}</div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {callPhone && (
                      <a href={`tel:${String(callPhone).replace(/[^0-9]/g, '')}`} className="flex items-center justify-center gap-1.5 bg-green-600 text-white font-bold py-2.5 rounded-lg text-sm">
                        <Phone className="w-4 h-4" /> Call {contact ? 'Site Contact' : 'Customer'}
                      </a>
                    )}
                    {location && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(`${location.address_line_1}, ${location.city} ${location.state} ${location.zip}`)}`}
                        target="_blank" rel="noopener" className="flex items-center justify-center gap-1.5 bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm">
                        <Navigation className="w-4 h-4" /> Directions
                      </a>
                    )}
                  </div>

                  {contact && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Job / Site Contact</div>
                      <div className="font-semibold text-slate-900">{contact.display_name}</div>
                      {contact.title_or_relationship && <div className="text-xs text-slate-600">{contact.title_or_relationship}</div>}
                      <div className="mt-1 text-xs text-slate-600">
                        {[contact.phone, contact.email].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  )}

                  {location && (
                    <div className="text-sm text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span>{location.location_name ? `${location.location_name} · ` : ''}{location.address_line_1}{location.address_line_2 ? `, ${location.address_line_2}` : ''}, {location.city} {location.state} {location.zip}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 rounded-lg p-2.5 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Service:</span> <span className="font-medium">{job?.service_type || '—'}</span></div>
                    {(asset || appliance) && <div className="flex justify-between"><span className="text-slate-500">Equipment:</span> <span className="font-medium">{asset?.asset_type || appliance?.appliance_type || '—'}</span></div>}
                    {(asset?.manufacturer || appliance?.brand) && <div className="flex justify-between"><span className="text-slate-500">Manufacturer:</span> <span className="font-medium">{asset?.manufacturer || appliance?.brand}</span></div>}
                    {(asset?.model_number || appliance?.model_number) && <div className="flex justify-between"><span className="text-slate-500">Model:</span> <span className="font-mono text-xs">{asset?.model_number || appliance?.model_number}</span></div>}
                    {(asset?.serial_number || appliance?.serial_number) && <div className="flex justify-between"><span className="text-slate-500">Serial:</span> <span className="font-mono text-xs">{asset?.serial_number || appliance?.serial_number}</span></div>}
                  </div>

                  {job?.safety_flag && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-800">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div><div className="font-bold">SAFETY FLAG</div><div>{job.safety_reason || 'Review the reported safety concern before service.'}</div></div>
                    </div>
                  )}

                  {job?.issue_description && (
                    <div className="text-sm">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Reported Problem</div>
                      <p className="text-slate-800">{job.issue_description}</p>
                    </div>
                  )}
                  {job?.error_code && (
                    <div className="text-sm flex items-center gap-1.5">
                      <span className="text-slate-500">Error code:</span>
                      <span className="font-mono font-semibold text-amber-600">{job.error_code}</span>
                    </div>
                  )}

                  {detail.lead?.ai_pre_diagnosis && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs">
                      <div className="font-semibold text-amber-800">Pre-Diagnosis</div>
                      <p className="text-amber-900 mt-0.5">{detail.lead.ai_pre_diagnosis}</p>
                    </div>
                  )}

                  {detail.attachments?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-1">Photos</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {detail.attachments.map(a => {
                          const url = a.signed_url || a.legacy_file_url || null;
                          const isImage = a.file_type?.startsWith('image/');
                          return (
                            <a key={a.id} href={url || '#'} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 bg-white">
                              {isImage && url ? (
                                <img src={url} alt={a.file_name || 'Customer upload'} className="w-full h-20 object-cover" />
                              ) : (
                                <div className="w-full h-20 flex items-center justify-center bg-slate-50"><FileText className="w-6 h-6 text-slate-400" /></div>
                              )}
                              <div className="px-1.5 py-1 text-[9px] text-slate-500 truncate">{a.file_name || a.attachment_type || 'Attachment'}</div>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {showDiagnosis ? (
                    <div className="space-y-2">
                      <textarea value={diagnosisText} onChange={e => setDiagnosisText(e.target.value)} rows={3}
                        placeholder="Enter diagnosis…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => setShowDiagnosis(false)} className="flex-1 border border-slate-300 rounded-lg py-2 text-sm font-semibold text-slate-600">Cancel</button>
                        <button onClick={() => saveDiagnosis(visit)} disabled={busy} className="flex-1 bg-brand-dark text-white rounded-lg py-2 text-sm font-bold">Save</button>
                      </div>
                    </div>
                  ) : (
                    job?.diagnosis && <div className="text-sm bg-slate-50 rounded-lg p-2"><div className="text-xs font-semibold text-slate-500 uppercase">Diagnosis</div><p className="text-slate-800">{job.diagnosis}</p></div>
                  )}

                  <div className="space-y-2 pt-1">
                    {visit.status === 'Confirmed' && (
                      <button onClick={() => updateVisit(visit.id, 'Dispatched', 'Dispatched')}
                        disabled={busy} className="w-full bg-purple-600 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        <Navigation className="w-5 h-5" /> DISPATCH
                      </button>
                    )}
                    {visit.status === 'Dispatched' && (
                      <button onClick={() => updateVisit(visit.id, 'En Route', 'Marked En Route')}
                        disabled={busy} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        <Navigation className="w-5 h-5" /> EN ROUTE
                      </button>
                    )}
                    {visit.status === 'En Route' && (
                      <button onClick={() => updateVisit(visit.id, 'On Site', 'Marked Arrived')}
                        disabled={busy} className="w-full bg-amber-500 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                        <CheckCircle2 className="w-5 h-5" /> ARRIVED
                      </button>
                    )}
                    {visit.status === 'On Site' && (
                      <>
                        {!showDiagnosis && (
                          <button onClick={() => setShowDiagnosis(true)} className="w-full border-2 border-slate-300 text-slate-700 font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2">
                            <ClipboardList className="w-5 h-5" /> DIAGNOSIS
                          </button>
                        )}
                        <button onClick={() => setCompleteOpen(true)} disabled={busy}
                          className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                          <CheckCircle2 className="w-5 h-5" /> COMPLETE VISIT
                        </button>
                      </>
                    )}
                    {visit.status === 'Complete' && (
                      <div className="text-center text-sm text-green-600 font-semibold">
                        ✓ Visit Complete — {visit.visit_outcome || 'Done'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <CompleteVisitDialog
        open={completeOpen}
        onClose={() => { setCompleteOpen(false); loadData(viewDate); }}
        visit={visits.find(v => v.id === expandedVisit)}
        job={expandedVisit ? jobs[visits.find(v => v.id === expandedVisit)?.job_id] : null}
        functionName="completeMyVisit"
      />
    </div>
  );
}