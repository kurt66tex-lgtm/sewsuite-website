import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, X, Phone, Mail, MapPin, Camera, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { hasMeaningfulPreDiagnosis } from '@/lib/crmUtils';
import NewServiceCallDrawer from '@/components/admin/NewServiceCallDrawer';

const STATUSES = ['New', 'Working', 'Waiting on Customer', 'Ready to Schedule', 'Converted', 'Closed'];
const CLOSE_REASONS = ['', 'Out of Area', 'Duplicate', 'Spam', 'No Response', 'Customer Declined', 'Other'];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [safetyOnly, setSafetyOnly] = useState(false);
  const [selected, setSelected] = useState(null);
  const [converting, setConverting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.Lead.list('-created_date', 500).then(list => {
      let filtered = list;
      if (statusFilter) filtered = filtered.filter(l => l.status === statusFilter);
      if (safetyOnly) filtered = filtered.filter(l => l.safety_flag);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(l => [l.first_name, l.last_name, l.phone, l.email, l.city, l.service_type, l.asset_type, l.manufacturer, l.appliance_type, l.brand, l.model_number].filter(Boolean).join(' ').toLowerCase().includes(q));
      }
      setLeads(filtered);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, safetyOnly]);

  const updateStatus = async (id, status, closeReason) => {
    const data = { status };
    if (status === 'Closed' && closeReason) data.close_reason = closeReason;
    await base44.entities.Lead.update(id, data);
    await base44.entities.CRMActivity.create({ entity_type: 'Lead', entity_id: id, lead_id: id, event_type: 'Status changed', description: `Lead status changed to ${status}${closeReason ? ` (${closeReason})` : ''}` });
    load();
    if (selected?.id === id) setSelected({ ...selected, ...data });
  };

  const convertToCustomer = async (lead) => {
    setConverting(true);
    try {
      const res = await base44.functions.invoke('createServiceCall', {
        lead_id: lead.id,
        conversation_id: lead.conversation_id || null,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        email: lead.email,
        preferred_contact_method: lead.preferred_contact_method,
        address_line_1: lead.service_address,
        loc_city: lead.city,
        state: lead.state,
        zip: lead.zip,
        service_type: lead.service_type || lead.appliance_type,
        asset_type: lead.asset_type || lead.appliance_type,
        manufacturer: lead.manufacturer || lead.brand,
        equipment_information: lead.equipment_information,
        niche_data: lead.niche_data,
        appliance_type: lead.appliance_type,
        brand: lead.brand,
        model_number: lead.model_number,
        serial_number: lead.serial_number,
        approximate_age: lead.approximate_age,
        problem_description: lead.problem_description,
        error_code: lead.error_code,
        requested_date: lead.requested_date,
        requested_window: lead.requested_window,
        source: lead.source,
        is_test_data: !!lead.is_test_data
      });
      const data = res?.data || res || {};
      if (data.error) throw new Error(data.error);
      load();
      setSelected(null);
      alert(`Converted! Customer and Job created.`);
    } catch (e) {
      alert('Conversion failed: ' + e.message);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <span className="text-sm text-slate-500">{leads.length} leads</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, service, equipment, model…" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm border border-slate-300 rounded-lg px-3 py-2 cursor-pointer">
          <input type="checkbox" checked={safetyOnly} onChange={e => setSafetyOnly(e.target.checked)} /> Safety only
        </label>
      </div>

      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Service / Equipment</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Source</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(l => (
                <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                      {l.safety_flag && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {l.first_name} {l.last_name}
                    </div>
                    <div className="text-xs text-slate-500">{l.phone || l.email || 'No contact'}</div>
                  </td>
                  <td className="px-4 py-3"><div>{l.service_type || l.appliance_type || '—'}</div><div className="text-xs text-slate-500">{[l.manufacturer || l.brand, l.asset_type && l.asset_type !== l.service_type ? l.asset_type : null, l.model_number].filter(Boolean).join(' ')}</div></td>
                  <td className="px-4 py-3">{l.city || '—'} {l.zip}</td>
                  <td className="px-4 py-3">{l.source}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded ${l.status === 'New' ? 'bg-blue-100 text-blue-700' : l.status === 'Converted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{l.status}</span></td>
                  <td className="px-4 py-3">{l.photo_count > 0 ? <span className="flex items-center gap-1 text-slate-600"><Camera className="w-3.5 h-3.5" /> {l.photo_count}</span> : '—'}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No leads found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-slate-900">Lead Details</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-4">
              {selected.safety_flag && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" /> <div><div className="font-semibold">Safety Flagged</div><div className="text-xs">{selected.safety_reason}</div></div>
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900 text-lg">{selected.first_name} {selected.last_name}</div>
                {selected.phone && <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-slate-600 mt-1"><Phone className="w-4 h-4" /> {selected.phone}</a>}
                {selected.email && <div className="flex items-center gap-2 text-sm text-slate-600 mt-1"><Mail className="w-4 h-4" /> {selected.email}</div>}
                {selected.service_address && <div className="flex items-start gap-2 text-sm text-slate-600 mt-1"><MapPin className="w-4 h-4 mt-0.5" /> {selected.service_address}, {selected.city} {selected.state} {selected.zip}</div>}
              </div>
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Service / Equipment Info</div>
                <dl className="text-sm space-y-1">
                  <div className="flex justify-between"><dt className="text-slate-500">Service</dt><dd className="font-medium">{selected.service_type || selected.appliance_type || '—'}</dd></div>
                  {(selected.asset_type || selected.appliance_type) && <div className="flex justify-between"><dt className="text-slate-500">Equipment / Asset</dt><dd className="font-medium">{selected.asset_type || selected.appliance_type}</dd></div>}
                  <div className="flex justify-between"><dt className="text-slate-500">Manufacturer / Brand</dt><dd className="font-medium">{selected.manufacturer || selected.brand || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Model</dt><dd className="font-medium">{selected.model_number || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Serial</dt><dd className="font-medium">{selected.serial_number || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Error code</dt><dd className="font-medium">{selected.error_code || '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Age</dt><dd className="font-medium">{selected.approximate_age || '—'}</dd></div>
                </dl>
                {selected.problem_description && <div className="mt-2 text-sm"><div className="text-slate-500 text-xs">Problem</div><p className="text-slate-800">{selected.problem_description}</p></div>}
                <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded p-2">
                  {hasMeaningfulPreDiagnosis(selected.ai_pre_diagnosis, selected.problem_description) ? (
                    <>
                      <div className="text-amber-800 text-xs font-semibold">AI suggestion — technician verification required</div>
                      <p className="text-amber-900 text-xs mt-1">{selected.ai_pre_diagnosis}</p>
                    </>
                  ) : (
                    <div className="text-amber-800 text-xs font-medium">Pre-diagnosis not yet completed</div>
                  )}
                </div>
              </div>
              {selected.requested_date && (
                <div className="border-t pt-3 text-sm">
                  <div className="text-slate-500 text-xs">Requested appointment</div>
                  <div className="font-medium">{selected.requested_date} {selected.requested_window}</div>
                  <div className="text-xs text-slate-400">Not confirmed until scheduled</div>
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                  <select value={selected.status} onChange={e => updateStatus(selected.id, e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {selected.status === 'Closed' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Close Reason</label>
                    <select value={selected.close_reason || ''} onChange={e => updateStatus(selected.id, 'Closed', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                      {CLOSE_REASONS.map(r => <option key={r} value={r}>{r || '—'}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {selected.status !== 'Converted' && selected.status !== 'Closed' && (
                <button onClick={() => setDrawerOpen(true)} className="w-full inline-flex items-center justify-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg text-sm">
                  <Calendar className="w-4 h-4" /> Book Service
                </button>
              )}
              {selected.status === 'Converted' && selected.job_id && (
                <Link to={`/admin/jobs?job=${selected.job_id}`} className="w-full inline-flex items-center justify-center gap-2 text-brand-dark font-semibold px-4 py-2.5 rounded-lg border border-brand-accent">View Job</Link>
              )}
            </div>
          </div>
        </div>
      )}

      <NewServiceCallDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} prefillLead={selected} defaultSource={selected?.source} />
    </div>
  );
}