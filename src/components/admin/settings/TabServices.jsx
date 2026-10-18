import { useEffect, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Star, Edit3, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import IntakeQuestionsManager from './IntakeQuestionsManager';

async function catalog(action, payload = {}) {
  const res = await base44.functions.invoke('manageBusinessCatalog', { action, ...payload });
  const data = res?.data || res || {};
  if (data.error) throw new Error(data.error);
  return data;
}

export default function TabServices({ settings }) {
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  return (
    <div className="space-y-4">
      <ServicesManager />
      <IntakeQuestionsManager />
      {isApplianceModule && <BrandsManager />}
      <ServiceAreasManager />
    </div>
  );
}

function ServicesManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    catalog('list').then(data => setServices(data.services || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (service, field) => {
    await catalog('toggle_service', { id: service.id, field });
    load();
  };

  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= services.length) return;
    const next = [...services];
    [next[idx], next[target]] = [next[target], next[idx]];
    await catalog('reorder_services', { ids: next.map(s => s.id) });
    load();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h2 className="font-bold text-brand-dark">Services</h2>
        <p className="text-xs text-slate-500">Control which services this client offers and which ones appear on the public website.</p>
      </div>
      {loading ? <div className="p-4 text-slate-400">Loading…</div> : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Service</th>
              <th className="text-left px-4 py-2">Active</th>
              <th className="text-left px-4 py-2">Public Website</th>
              <th className="text-left px-4 py-2">Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((s, i) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-2">
                  <button onClick={() => toggle(s, 'active')} className={`text-xs px-2 py-0.5 rounded ${s.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => toggle(s, 'publicly_advertised')} className={`text-xs px-2 py-0.5 rounded ${s.publicly_advertised ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.publicly_advertised ? 'Shown' : 'Hidden'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === services.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {services.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No services configured.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BrandsManager() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    catalog('list').then(data => setBrands(data.brands || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (b, field) => {
    await catalog('toggle_brand', { id: b.id, field });
    load();
  };

  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= brands.length) return;
    const next = [...brands];
    [next[idx], next[target]] = [next[target], next[idx]];
    await catalog('reorder_brands', { ids: next.map(b => b.id) });
    load();
  };

  const save = async (data) => {
    await catalog('save_brand', { brand: data });
    setEditing(null);
    load();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-brand-dark">Brands</h2>
          <p className="text-xs text-slate-500">Deactivate instead of deleting — preserves historical references.</p>
        </div>
        <button onClick={() => setEditing({ name: '', active: true, featured: false })} className="inline-flex items-center gap-1 bg-brand-accent text-brand-dark text-sm font-bold px-3 py-1.5 rounded-lg">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {loading ? <div className="p-4 text-slate-400">Loading…</div> : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">Featured</th><th className="text-left px-4 py-2">Order</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {brands.map((b, i) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{b.name}</td>
                <td className="px-4 py-2">
                  <button onClick={() => toggle(b, 'active')} className={`text-xs px-2 py-0.5 rounded ${b.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {b.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => toggle(b, 'featured')} className={b.featured ? 'text-amber-500' : 'text-slate-300'}>
                    <Star className="w-4 h-4" fill={b.featured ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === brands.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => setEditing(b)} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No brands yet.</td></tr>}
          </tbody>
        </table>
      )}
      {editing && <BrandEditor brand={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BrandEditor({ brand, onSave, onClose }) {
  const [form, setForm] = useState(brand);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-brand-dark">{brand.id ? 'Edit Brand' : 'Add Brand'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Brand name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
        <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Save</button>
        </div>
      </div>
    </div>
  );
}

function ServiceAreasManager() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    catalog('list').then(data => setAreas(data.areas || [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (a) => {
    await catalog('toggle_area', { id: a.id });
    load();
  };

  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= areas.length) return;
    const next = [...areas];
    [next[idx], next[target]] = [next[target], next[idx]];
    await catalog('reorder_areas', { ids: next.map(a => a.id) });
    load();
  };

  const save = async (data) => {
    await catalog('save_area', { area: data });
    setEditing(null);
    load();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-brand-dark">Service Areas</h2>
          <p className="text-xs text-slate-500">Deactivate instead of deleting — preserves SEO pages and historical references.</p>
        </div>
        <button onClick={() => setEditing({ city: '', state: 'TX', active: true, zip_codes: [] })} className="inline-flex items-center gap-1 bg-brand-accent text-brand-dark text-sm font-bold px-3 py-1.5 rounded-lg">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {loading ? <div className="p-4 text-slate-400">Loading…</div> : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr><th className="text-left px-4 py-2">City</th><th className="text-left px-4 py-2">State</th><th className="text-left px-4 py-2">Status</th><th className="text-left px-4 py-2">ZIPs</th><th className="text-left px-4 py-2">Order</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {areas.map((a, i) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{a.city}</td>
                <td className="px-4 py-2 text-xs">{a.state}</td>
                <td className="px-4 py-2">
                  <button onClick={() => toggle(a)} className={`text-xs px-2 py-0.5 rounded ${a.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {a.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2 text-xs">{a.zip_codes?.length || 0}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-0.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === areas.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => setEditing(a)} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {areas.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No service areas yet.</td></tr>}
          </tbody>
        </table>
      )}
      {editing && <AreaEditor area={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function AreaEditor({ area, onSave, onClose }) {
  const [form, setForm] = useState(area);
  const [zips, setZips] = useState((area.zip_codes || []).join(', '));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-brand-dark">{area.id ? 'Edit Area' : 'Add Area'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          <input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="ST" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <textarea value={zips} onChange={(e) => setZips(e.target.value)} placeholder="ZIP codes (comma-separated)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <textarea value={form.page_content || ''} onChange={(e) => setForm({ ...form, page_content: e.target.value })} placeholder="SEO page content (optional)" rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button onClick={() => onSave({ ...form, zip_codes: zips.split(',').map((z) => z.trim()).filter(Boolean) })} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Save</button>
        </div>
      </div>
    </div>
  );
}