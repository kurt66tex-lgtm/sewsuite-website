import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Phone, Mail, MapPin, Wrench, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import NewServiceCallDrawer from '@/components/admin/NewServiceCallDrawer';
import CustomerContactsPanel from '@/components/admin/CustomerContactsPanel';
import ServiceLocationEditor from '@/components/admin/ServiceLocationEditor';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { crmVocabulary, isProjectQuoteModel } from '@/lib/businessModel';

export default function Customers() {
  const { settings } = useBusinessSettings();
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isProjectQuote = isProjectQuoteModel(settings);
  const terms = crmVocabulary(settings);
  const assetTrackingEnabled = settings?.asset_tracking_enabled === true && !isApplianceModule;
  const assetLabelPlural = settings?.asset_label_plural || 'Equipment';
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [expandedLoc, setExpandedLoc] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [expandedAsset, setExpandedAsset] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCustomer, setDrawerCustomer] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Customer.list('-created_date', 500).then(list => {
      let filtered = list.filter(c => !c.archived_at && !c.is_test_data);
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c => [c.first_name, c.last_name, c.primary_phone, c.email, c.company_name].filter(Boolean).join(' ').toLowerCase().includes(q));
      }
      setCustomers(filtered);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const openDetail = async (c) => {
    setSelected(c);
    try {
      const [locations, assets, appliances, jobs, activities] = await Promise.all([
        base44.entities.ServiceLocation.filter({ customer_id: c.id }),
        base44.entities.EquipmentAsset.filter({ customer_id: c.id }),
        base44.entities.ApplianceUnit.filter({ customer_id: c.id }),
        base44.entities.Job.filter({ customer_id: c.id }),
        base44.entities.CRMActivity.filter({ customer_id: c.id })
      ]);
      setDetail({ locations, assets, appliances, jobs: jobs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)), activities });
    } catch (e) { setDetail({}); }
  };

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <button onClick={() => { setDrawerCustomer(null); setDrawerOpen(true); }} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold px-4 py-2.5 rounded-lg text-sm">
          <Plus className="w-4 h-4" /> {terms.createWork}
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email…" className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none" />
      </div>
      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase"><tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Phone</th><th className="text-left px-4 py-3">Email</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Source</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(c => (
                <tr key={c.id} onClick={() => openDetail(c)} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{c.first_name} {c.last_name} {c.company_name ? `(${c.company_name})` : ''}</td>
                  <td className="px-4 py-3">{c.primary_phone || '—'}</td>
                  <td className="px-4 py-3">{c.email || '—'}</td>
                  <td className="px-4 py-3">{c.customer_type}</td>
                  <td className="px-4 py-3">{c.source || '—'}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No customers found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setSelected(null); setDetail(null); }} />
          <div className="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto h-full">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="font-bold text-slate-900">{selected.first_name} {selected.last_name}</h2>
              <button onClick={() => { setSelected(null); setDetail(null); }}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-5">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => { setDrawerCustomer(selected); setDrawerOpen(true); }} className="inline-flex items-center gap-1.5 bg-brand-accent text-brand-dark font-bold px-3 py-1.5 rounded-lg text-sm">
                  <Plus className="w-3.5 h-3.5" /> {terms.createWork}
                </button>
                {selected.primary_phone && <a href={`tel:${selected.primary_phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700"><Phone className="w-3.5 h-3.5" /> Call</a>}
                {selected.email && <a href={`mailto:${selected.email}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700"><Mail className="w-3.5 h-3.5" /> Email</a>}
              </div>
              <div>
                {selected.primary_phone && <a href={`tel:${selected.primary_phone}`} className="flex items-center gap-2 text-sm text-slate-600"><Phone className="w-4 h-4" /> {selected.primary_phone}</a>}
                {selected.email && <div className="flex items-center gap-2 text-sm text-slate-600"><Mail className="w-4 h-4" /> {selected.email}</div>}
                <div className="text-xs text-slate-500 mt-1">Type: {selected.customer_type} • Prefers {selected.preferred_contact_method}</div>
              </div>

              <CustomerContactsPanel customerId={selected.id} onChanged={() => {}} />

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">Service Locations</h3>
                  <button onClick={() => setEditingLocation({ customer_id: selected.id, location_type: 'Home', active: true, primary_location: !detail?.locations?.length })} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark">
                    <Plus className="w-3.5 h-3.5" /> Add Location
                  </button>
                </div>
                {detail?.locations?.length ? detail.locations.map(l => (
                  <div key={l.id} onClick={() => setExpandedLoc(expandedLoc === l.id ? null : l.id)} className="text-sm border border-slate-200 rounded-lg p-2 mb-1 w-full text-left hover:border-brand-accent transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span><MapPin className="w-3.5 h-3.5 inline text-slate-400" /> {l.location_name ? `${l.location_name} · ` : ''}{l.address_line_1}, {l.city} {l.zip}</span>
                      <span className="text-xs text-slate-400">{expandedLoc === l.id ? '−' : '+'}</span>
                    </div>
                    {expandedLoc === l.id && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                        {l.location_type && <div>Type: {l.location_type}</div>}
                        {l.address_line_2 && <div>Apt/Suite: {l.address_line_2}</div>}
                        <div>State: {l.state}</div>
                        {l.gate_access_instructions && <div>Gate access: {l.gate_access_instructions}</div>}
                        {l.parking_instructions && <div>Parking: {l.parking_instructions}</div>}
                        {l.pets_onsite_notes && <div>Pets: {l.pets_onsite_notes}</div>}
                        {l.location_notes && <div>Notes: {l.location_notes}</div>}
                        <div className="flex gap-3"><span>Primary: {l.primary_location ? 'Yes' : 'No'}</span><span>Active: {l.active !== false ? 'Yes' : 'No'}</span></div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setEditingLocation(l); }} className="mt-2 text-xs font-semibold text-brand-dark border border-slate-300 rounded px-2 py-1 hover:border-brand-accent">Edit Location</button>
                      </div>
                    )}
                  </div>
                )) : <p className="text-sm text-slate-400">None</p>}
              </div>

              {isApplianceModule && <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Appliances</h3>
                {detail?.appliances?.length ? detail.appliances.map(a => (
                  <button key={a.id} onClick={() => setExpandedApp(expandedApp === a.id ? null : a.id)} className="text-sm border border-slate-200 rounded-lg p-2 mb-1 w-full text-left hover:border-brand-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <span><Wrench className="w-3.5 h-3.5 inline text-slate-400" /> {a.brand} {a.appliance_type} — {a.model_number || 'no model'}</span>
                      <span className="text-xs text-slate-400">{expandedApp === a.id ? '−' : '+'}</span>
                    </div>
                    {expandedApp === a.id && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                        <div>Appliance: {a.appliance_type}</div>
                        {a.brand && <div>Brand: {a.brand}</div>}
                        <div>Model: {a.model_number || '—'}</div>
                        <div>Serial: {a.serial_number || '—'}</div>
                        {a.approximate_age && <div>Age: {a.approximate_age}</div>}
                        {a.gas_or_electric && a.gas_or_electric !== 'N/A' && <div>Gas/Electric: {a.gas_or_electric}</div>}
                        {a.built_in && <div>Built-in: Yes</div>}
                        {a.appliance_location && <div>Location: {a.appliance_location}</div>}
                        {a.notes && <div>Notes: {a.notes}</div>}
                        <div>Active: {a.active !== false ? 'Yes' : 'No'}</div>
                      </div>
                    )}
                  </button>
                )) : <p className="text-sm text-slate-400">None</p>}
              </div>}

              {assetTrackingEnabled && <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{assetLabelPlural}</h3>
                {detail?.assets?.length ? detail.assets.map(a => (
                  <button key={a.id} onClick={() => setExpandedAsset(expandedAsset === a.id ? null : a.id)} className="text-sm border border-slate-200 rounded-lg p-2 mb-1 w-full text-left hover:border-brand-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <span><Wrench className="w-3.5 h-3.5 inline text-slate-400" /> {[a.manufacturer, a.asset_type].filter(Boolean).join(' ') || 'Equipment'} — {a.model_number || 'no model'}</span>
                      <span className="text-xs text-slate-400">{expandedAsset === a.id ? '−' : '+'}</span>
                    </div>
                    {expandedAsset === a.id && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                        <div>Type: {a.asset_type || '—'}</div>
                        {a.manufacturer && <div>Manufacturer: {a.manufacturer}</div>}
                        <div>Model: {a.model_number || '—'}</div>
                        <div>Serial: {a.serial_number || '—'}</div>
                        {a.approximate_age && <div>Age: {a.approximate_age}</div>}
                        {a.location_in_property && <div>Location: {a.location_in_property}</div>}
                        {a.notes && <div>Notes: {a.notes}</div>}
                        <div>Active: {a.active !== false ? 'Yes' : 'No'}</div>
                      </div>
                    )}
                  </button>
                )) : <p className="text-sm text-slate-400">None</p>}
              </div>}

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{terms.workPlural}</h3>
                {detail?.jobs?.length ? detail.jobs.map(j => (
                  <Link key={j.id} to={`/admin/jobs?job=${j.id}`} onClick={() => { setSelected(null); setDetail(null); }} className="text-sm border border-slate-200 rounded-lg p-2 mb-1 flex justify-between hover:border-brand-accent transition-colors cursor-pointer">
                    <span className="font-medium text-brand-dark">{j.job_number || j.service_type || terms.workSingular} {j.service_type && <span className="text-slate-500 font-normal">· {j.service_type}</span>}</span>
                    <span className="text-xs font-medium text-slate-600">{isProjectQuote ? (j.workflow_stage || 'Quote Needed') : j.status}</span>
                  </Link>
                )) : <p className="text-sm text-slate-400">None</p>}
              </div>

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Activity</h3>
                {detail?.activities?.length ? detail.activities.slice(0, 10).map((a, i) => (
                  <div key={i} className="text-xs text-slate-600 border-b border-slate-100 py-1"><span className="font-medium">{a.event_type}</span> — {a.description}</div>
                )) : <p className="text-sm text-slate-400">None</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {editingLocation && selected && (
        <ServiceLocationEditor
          customerId={selected.id}
          location={editingLocation?.id ? editingLocation : null}
          onClose={() => setEditingLocation(null)}
          onSaved={async () => {
            setEditingLocation(null);
            await openDetail(selected);
          }}
        />
      )}

      <NewServiceCallDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} prefillCustomer={drawerCustomer} defaultSource="Phone" />
    </div>
  );
}