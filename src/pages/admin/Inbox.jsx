import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, AlertTriangle, Phone, Mail, MessageSquare, ArrowRight, Clock, MapPin, Wrench, Loader2, Plus, Calendar, Camera, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { buildInboxItems, filterInboxByTab, searchInboxItems } from '@/lib/inboxUtils';
import { isLocationInServiceArea } from '@/lib/serviceAreaCheck';
import NewServiceCallDrawer from '@/components/admin/NewServiceCallDrawer';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { crmVocabulary, isProjectQuoteModel, leadStatusesFor } from '@/lib/businessModel';
import { useAuth } from '@/lib/AuthContext';
import { isAgencyOwner } from '@/lib/accessControl';

const TABS = [
  { key: 'new', label: 'New Requests' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'follow_up', label: 'Follow-Up Due' },
  { key: 'waiting', label: 'Waiting on Customer' },
  { key: 'out_of_area', label: 'Out of Area' },
  { key: 'closed', label: 'Closed' }
];

const CLOSE_REASONS = ['', 'Out of Area', 'Duplicate', 'Spam', 'No Response', 'Customer Declined', 'Other'];

export default function Inbox() {
  const { settings } = useBusinessSettings();
  const { user } = useAuth();
  const agencyOwner = isAgencyOwner(user);
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isProjectQuote = isProjectQuoteModel(settings);
  const terms = crmVocabulary(settings);
  const leadStatuses = leadStatusesFor(settings).filter(s => s !== 'Converted');
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('new');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prefillLead, setPrefillLead] = useState(null);
  const [includeTest, setIncludeTest] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Lead.list('-created_date', 500),
      base44.entities.Conversation.list('-started_at', 200),
      base44.entities.Customer.list('-created_date', 500),
      base44.entities.ServiceArea.filter({ active: true }, 'display_order', 100),
      base44.functions.invoke('getLeadAssignees', {}).catch(() => ({ data: { users: [] } }))
    ]).then(([leads, convs, custs, areas, assigneeRes]) => {
      const showTest = agencyOwner && includeTest;
      const liveLeads = showTest ? leads : leads.filter(r => !r.is_test_data);
      const liveConvs = showTest ? convs : convs.filter(r => !r.is_test_data);
      const liveCustomers = showTest ? custs : custs.filter(r => !r.is_test_data);
      setCustomers(liveCustomers);
      setServiceAreas(areas);
      const assigneeData = assigneeRes?.data || assigneeRes || {};
      setAssignees(assigneeData.users || []);
      setItems(buildInboxItems(liveLeads, liveConvs, liveCustomers));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [agencyOwner, includeTest]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selected) {
      setSelectedAttachments([]);
      setAttachmentsLoading(false);
      return;
    }

    let active = true;
    const loadAttachments = async () => {
      setAttachmentsLoading(true);
      try {
        const requests = [];
        if (selected.type === 'lead') {
          requests.push(base44.functions.invoke('getOfficeAttachments', { lead_id: selected.id }));
          if (selected.record?.conversation_id) {
            requests.push(base44.functions.invoke('getOfficeAttachments', { conversation_id: selected.record.conversation_id }));
          }
        } else if (selected.type === 'conversation') {
          requests.push(base44.functions.invoke('getOfficeAttachments', { conversation_id: selected.id }));
        }

        const results = await Promise.all(requests);
        const merged = new Map();
        results.forEach(res => {
          const data = res?.data || res || {};
          (data.attachments || []).forEach(a => merged.set(a.id, a));
        });

        if (active) setSelectedAttachments([...merged.values()]);
      } catch {
        if (active) setSelectedAttachments([]);
      } finally {
        if (active) setAttachmentsLoading(false);
      }
    };

    loadAttachments();
    return () => { active = false; };
  }, [selected]);

  const filtered = searchInboxItems(filterInboxByTab(items, tab), search);
  const counts = TABS.reduce((acc, t) => { acc[t.key] = filterInboxByTab(items, t.key).length; return acc; }, {});

  const updateSelectedLeadRecord = (leadId, patch) => {
    if (selected?.type !== 'lead' || selected.id !== leadId) return;
    setSelected(prev => ({
      ...prev,
      ...('status' in patch ? { status: patch.status } : {}),
      ...('close_reason' in patch ? { close_reason: patch.close_reason } : {}),
      record: { ...prev.record, ...patch }
    }));
  };

  const updateLeadStatus = async (leadId, status, closeReason) => {
    const currentItem = items.find(item => item.type === 'lead' && item.id === leadId);
    const fromStatus = currentItem?.record?.status || selected?.record?.status || selected?.status || null;
    const now = new Date().toISOString();
    const data = { status };

    if (status === 'Closed') {
      data.close_reason = closeReason || currentItem?.record?.close_reason || 'Other';
      if (fromStatus !== 'Closed' || !(currentItem?.record?.closed_at || selected?.record?.closed_at)) {
        data.closed_at = now;
      }
      data.follow_up_date = null;
    } else if (fromStatus === 'Closed') {
      data.close_reason = null;
      data.closed_at = null;
      data.reopened_at = now;
    }

    await base44.entities.Lead.update(leadId, data);
    await base44.entities.CRMActivity.create({
      entity_type: 'Lead',
      entity_id: leadId,
      lead_id: leadId,
      event_type: fromStatus === 'Closed' && status !== 'Closed' ? 'Lead reopened' : 'Status changed',
      from_status: fromStatus,
      to_status: status,
      performed_at: now,
      description: `Lead status changed from ${fromStatus || 'Unknown'} to ${status}${data.close_reason ? ` (${data.close_reason})` : ''}`
    });
    updateSelectedLeadRecord(leadId, data);
    load();
  };

  const updateLeadField = async (leadId, patch, eventType, description) => {
    const now = new Date().toISOString();
    await base44.entities.Lead.update(leadId, patch);
    await base44.entities.CRMActivity.create({
      entity_type: 'Lead',
      entity_id: leadId,
      lead_id: leadId,
      event_type: eventType,
      performed_at: now,
      description
    });
    updateSelectedLeadRecord(leadId, patch);
    load();
  };

  const markLeadContacted = async (leadId) => {
    const now = new Date().toISOString();
    await updateLeadField(leadId, { last_contacted_at: now }, 'Customer contacted', 'Lead marked as contacted by office staff');
  };

  const bookService = (item) => {
    setPrefillLead(item.type === 'lead' ? item.record : null);
    setDrawerOpen(true);
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatRequested = (date, window) => {
    if (!date) return null;
    try {
      const d = new Date(date + 'T00:00:00');
      const fmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return window ? `${fmt} · ${window}` : fmt;
    } catch { return `${date} ${window || ''}`.trim(); }
  };

  const isConversationBookable = (item) => {
    const cd = item.record?.collected_data || {};
    const hasPhone = !!(cd.phone || cd.phone_number);
    const hasName = !!(cd.first_name || cd.last_name || cd.name || cd.customer_name);
    const hasServiceContext = !!(cd.service_type || cd.asset_type || cd.appliance_type || cd.appliance);
    const hasProblem = !!(cd.problem_description || cd.issue || cd.symptom || cd.problem || cd.description);
    const city = cd.city || cd.service_city;
    const zip = cd.zip || cd.zip_code;
    if (isProjectQuote) return hasPhone && hasName && hasServiceContext && hasProblem;
    const inServiceArea = isLocationInServiceArea(city, zip, serviceAreas);
    return hasPhone && hasName && hasServiceContext && hasProblem && inServiceArea;
  };

  const getLeadAction = (item) => {
    // Converted leads → OPEN JOB
    if (item.type === 'lead' && (item.status === 'Converted' || item.job_id)) {
      return { type: 'open_job', job_id: item.job_id };
    }
    // Closed / out of area / spam / duplicate → REVIEW only
    if (item.status === 'Closed' || item.close_reason || item.disposition === 'Out of Area') {
      return { type: 'review' };
    }
    // Conversations: BOOK SERVICE only if enough collected info
    if (item.type === 'conversation') {
      if (item.status === 'active' && isConversationBookable(item)) {
        return { type: 'book' };
      }
      return { type: 'review' };
    }
    // Leads with contact info → BOOK SERVICE
    if (item.type === 'lead' && (item.phone || item.email)) {
      return { type: 'book' };
    }
    // Not enough info → REVIEW
    return { type: 'review' };
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inbox</h1>
          <p className="text-sm text-slate-500 mt-0.5">Unified intake — leads & conversations</p>
        </div>
        <div className="flex items-center gap-3">
          {agencyOwner && <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer"><input type="checkbox" checked={includeTest} onChange={e => setIncludeTest(e.target.checked)} /> Test Data</label>}
          <button onClick={() => { setPrefillLead(null); setDrawerOpen(true); }} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg text-sm hover:bg-brand-accent-dark">
            <Plus className="w-4 h-4" /> {terms.createWork}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${tab === t.key ? 'border-brand-accent text-brand-dark' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {t.label} {counts[t.key] > 0 && <span className="ml-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isApplianceModule ? 'Search name, phone, email, appliance, city, source…' : 'Search name, phone, email, service, city, source…'} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-accent focus:outline-none" />
      </div>

      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Customer / Visitor</th>
                <th className="text-left px-4 py-3">{isProjectQuote ? terms.serviceType : (isApplianceModule ? 'Appliance' : 'Service / Asset')}</th>
                <th className="text-left px-4 py-3">{isProjectQuote ? 'Company' : 'City'}</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">{isProjectQuote ? 'Desired Date' : 'Requested'}</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={`${item.type}-${item.id}`} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {item.safety_flag && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                      <div>
                        <div className="font-medium text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500">{formatTime(item.last_activity)}{item.type === 'conversation' ? ' · Chat' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.appliance || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{isProjectQuote ? (item.record?.company_name || item.record?.intake_answers?.company_organization || '—') : (item.city || '—')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.source === 'Website Form' ? 'bg-brand-accent/15 text-brand-dark' : 'bg-slate-100 text-slate-600'}`}>{item.source}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{isProjectQuote ? (item.record?.intake_answers?.desired_completion_date || '—') : (formatRequested(item.requested_date, item.requested_window) || '—')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.status === 'New' ? 'bg-blue-100 text-blue-700' : item.status === 'Converted' || item.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                      {item.close_reason === 'Out of Area' || item.disposition === 'Out of Area' ? 'Out of Area' : item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {getLeadAction(item).type === 'book' && (
                      <button onClick={(e) => { e.stopPropagation(); bookService(item); }} className="inline-flex items-center gap-1.5 bg-brand-accent text-brand-dark font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-brand-accent-dark whitespace-nowrap">
                        {isProjectQuote ? <Plus className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />} {terms.conversionAction}
                      </button>
                    )}
                    {getLeadAction(item).type === 'open_job' && (
                      <Link to={`/admin/jobs?job=${getLeadAction(item).job_id}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 border border-slate-300 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs hover:border-brand-accent whitespace-nowrap">
                        <ArrowRight className="w-3.5 h-3.5" /> {terms.openWork}
                      </Link>
                    )}
                    {getLeadAction(item).type === 'review' && (
                      <button onClick={(e) => { e.stopPropagation(); setSelected(item); }} className="inline-flex items-center gap-1 border border-slate-300 text-slate-600 font-semibold px-3 py-1.5 rounded-lg text-xs hover:border-brand-accent whitespace-nowrap">
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No items in this tab.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto h-full">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-4">
              {/* Primary action — prominent at top */}
              {getLeadAction(selected).type === 'book' && (
                <button onClick={() => bookService(selected)} className="w-full inline-flex items-center justify-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-3 rounded-lg text-sm hover:bg-brand-accent-dark shadow-sm">
                  {isProjectQuote ? <Plus className="w-4 h-4" /> : <Calendar className="w-4 h-4" />} {terms.conversionAction}
                </button>
              )}
              {getLeadAction(selected).type === 'open_job' && selected.job_id && (
                <Link to={`/admin/jobs?job=${selected.job_id}`} className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 text-brand-dark font-bold px-4 py-3 rounded-lg text-sm hover:bg-slate-200">
                  <ArrowRight className="w-4 h-4" /> {terms.openWork}
                </Link>
              )}
              {selected.safety_flag && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" /> <div><div className="font-semibold">SAFETY FLAG</div></div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {selected.phone && <a href={`tel:${selected.phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-brand-accent"><Phone className="w-3.5 h-3.5" /> Call</a>}
                {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-brand-accent"><Mail className="w-3.5 h-3.5" /> Email</a>}
                {(selected.conversation_id || selected.type === 'conversation') && (
                  <Link to={`/admin/conversations?conversation=${selected.conversation_id || selected.id}`} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-brand-accent"><MessageSquare className="w-3.5 h-3.5" /> Open Conversation</Link>
                )}
                {selected.customer_id && (
                  <Link to="/admin/customers" className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-brand-accent">Open Customer</Link>
                )}
              </div>

              {/* Details */}
              {selected.type === 'lead' && (
                <>
                  <div className="text-sm space-y-1">
                    {selected.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5" /> {selected.phone}</div>}
                    {selected.email && <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5" /> {selected.email}</div>}
                    {selected.city && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-3.5 h-3.5" /> {selected.city} {selected.record?.zip || ''}</div>}
                    {selected.appliance && <div className="flex items-center gap-2 text-slate-600"><Wrench className="w-3.5 h-3.5" /> {selected.appliance} {selected.record?.manufacturer || selected.record?.brand || ''}</div>}
                  </div>
                  {selected.record?.problem_description && <div className="text-sm border-t pt-2"><div className="text-xs text-slate-500">{isProjectQuote ? 'Project Description' : 'Problem'}</div><p className="text-slate-800">{selected.record.problem_description}</p></div>}
                  {formatRequested(selected.requested_date, selected.requested_window) && (
                    <div className="text-sm border-t pt-2"><div className="text-xs text-slate-500">{isProjectQuote ? 'Requested Timing' : 'Requested Appointment'}</div><div className="font-medium text-slate-900">{formatRequested(selected.requested_date, selected.requested_window)}</div></div>
                  )}
                  {selected.record?.intake_answers && Object.keys(selected.record.intake_answers).length > 0 && (
                    <div className="text-sm border-t pt-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Intake Answers</div>
                      <div className="space-y-1">
                        {Object.entries(selected.record.intake_answers).map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-3 text-xs">
                            <span className="text-slate-500">{key.replace(/_/g, ' ')}</span>
                            <span className="font-medium text-slate-800 text-right">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selected.record?.ai_pre_diagnosis && (
                    <div className="text-sm bg-amber-50 border border-amber-200 rounded p-2"><div className="text-amber-800 text-xs font-semibold">AI Pre-Diagnosis</div><p className="text-amber-900 text-xs mt-1">{selected.record.ai_pre_diagnosis}</p></div>
                  )}
                </>
              )}

              {selected.type === 'conversation' && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-slate-600"><MessageSquare className="w-3.5 h-3.5" /> {selected.record.message_count} messages</div>
                  {selected.record.source_page && <div className="text-xs text-slate-500">From: {selected.record.source_page}</div>}
                  {selected.record.collected_data && Object.keys(selected.record.collected_data).length > 0 && (
                    <div className="border-t pt-2"><div className="text-xs text-slate-500 mb-1">Collected Info</div>
                      <pre className="text-xs text-slate-700 bg-slate-50 rounded p-2 overflow-x-auto">{JSON.stringify(selected.record.collected_data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Customer attachments */}
              {(attachmentsLoading || selectedAttachments.length > 0) && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <div className="text-xs font-semibold text-slate-500 uppercase">
                      Customer Attachments{selectedAttachments.length > 0 ? ' (' + selectedAttachments.length + ')' : ''}
                    </div>
                  </div>

                  {attachmentsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading attachments…
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedAttachments.map(a => {
                        const isImage = a.file_type?.startsWith('image/');
                        return (
                          <a
                            key={a.id}
                            href={a.signed_url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-lg border border-slate-200 bg-slate-50 hover:border-brand-accent hover:shadow-sm"
                          >
                            {isImage && a.signed_url ? (
                              <img
                                src={a.signed_url}
                                alt={a.file_name || a.attachment_type || 'Customer upload'}
                                className="w-full h-28 object-cover"
                              />
                            ) : (
                              <div className="h-28 flex items-center justify-center">
                                <FileText className="w-8 h-8 text-slate-400" />
                              </div>
                            )}
                            <div className="px-2 py-1.5 bg-white">
                              <div className="text-[11px] font-medium text-slate-700 truncate">{a.file_name || 'Attachment'}</div>
                              <div className="text-[10px] text-slate-400">{a.attachment_type || 'Customer upload'}</div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Ownership / Follow-up / Status */}
              {selected.type === 'lead' && selected.status !== 'Converted' && (
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Assigned To</label>
                      <select
                        value={selected.record?.assigned_to_user_id || ''}
                        onChange={e => {
                          const userId = e.target.value || null;
                          const assignee = assignees.find(u => u.id === userId);
                          updateLeadField(
                            selected.id,
                            { assigned_to_user_id: userId },
                            'Lead assigned',
                            userId ? `Lead assigned to ${assignee?.full_name || assignee?.email || 'staff'}` : 'Lead assignment cleared'
                          );
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Unassigned</option>
                        {assignees.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Follow-Up Date</label>
                      <input
                        type="date"
                        value={selected.record?.follow_up_date || ''}
                        onChange={e => updateLeadField(
                          selected.id,
                          { follow_up_date: e.target.value || null },
                          e.target.value ? 'Follow-up scheduled' : 'Follow-up cleared',
                          e.target.value ? `Follow-up scheduled for ${e.target.value}` : 'Follow-up date cleared'
                        )}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                    <div className="text-xs text-slate-600">
                      <div className="font-semibold text-slate-700">Last Contacted</div>
                      <div>{selected.record?.last_contacted_at ? new Date(selected.record.last_contacted_at).toLocaleString() : 'Not recorded'}</div>
                    </div>
                    <button onClick={() => markLeadContacted(selected.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-brand-accent">
                      <Clock className="w-3.5 h-3.5" /> Mark Contacted
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                    <select value={selected.status} onChange={e => updateLeadStatus(selected.id, e.target.value, selected.close_reason)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                      {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  {selected.status === 'Closed' && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Close Reason</label>
                        <select value={selected.close_reason || ''} onChange={e => updateLeadStatus(selected.id, 'Closed', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                          {CLOSE_REASONS.map(r => <option key={r} value={r}>{r || '—'}</option>)}
                        </select>
                      </div>
                      <button onClick={() => updateLeadStatus(selected.id, 'Working')} className="w-full text-sm font-semibold px-4 py-2 rounded-lg border border-brand-accent text-brand-dark hover:bg-yellow-50">Reopen Request</button>
                    </>
                  )}
                  {(selected.record?.closed_at || selected.record?.reopened_at) && (
                    <div className="text-[11px] text-slate-400">
                      {selected.record?.closed_at && <div>Closed: {new Date(selected.record.closed_at).toLocaleString()}</div>}
                      {selected.record?.reopened_at && <div>Last reopened: {new Date(selected.record.reopened_at).toLocaleString()}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Close */}
              <div className="border-t pt-3 flex flex-col gap-2">
                {selected.type === 'lead' && selected.status !== 'Closed' && selected.status !== 'Converted' && (
                  <button onClick={() => updateLeadStatus(selected.id, 'Closed', 'Other')} className="w-full text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:border-red-300 hover:text-red-600">Close Request</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <NewServiceCallDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} prefillLead={prefillLead} defaultSource="Phone" />
    </div>
  );
}