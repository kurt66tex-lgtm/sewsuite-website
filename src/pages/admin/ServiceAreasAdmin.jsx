import { useEffect, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Edit3, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ServiceAreasAdmin() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => { setLoading(true); base44.entities.ServiceArea.list('display_order', 200).then(setAreas).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (a) => {
    await base44.entities.ServiceArea.update(a.id, { active: !a.active });
    load();
  };

  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= areas.length) return;
    const a = areas[idx]; const b = areas[target];
    await base44.entities.ServiceArea.bulkUpdate([{ id: a.id, display_order: b.display_order }, { id: b.id, display_order: a.display_order }]);
    load();
  };

  const save = async (data) => {
    if (data.id) await base44.entities.ServiceArea.update(data.id, data);
    else await base44.entities.ServiceArea.create({ ...data, slug: (data.city || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), display_order: 999, state: data.state || 'TX' });
    setEditing(null); load();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand-dark">Service Areas</h1>
        <button onClick={() => setEditing({ city: '', state: 'TX', active: true, zip_codes: [] })} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark text-sm font-bold px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Add Area</button>
      </div>
      <p className="text-xs text-slate-400 mb-4">Service Areas management is also available in Settings → Services & Coverage.</p>
      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase"><tr><th className="text-left px-4 py-3">City</th><th className="text-left px-4 py-3">State</th><th className="text-left px-4 py-3">Active</th><th className="text-left px-4 py-3">ZIPs</th><th className="text-left px-4 py-3">Order</th><th></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {areas.map((a, i) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.city}</td>
                  <td className="px-4 py-3 text-xs">{a.state}</td>
                  <td className="px-4 py-3"><button onClick={() => toggle(a)} className={`text-xs px-2 py-0.5 rounded ${a.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{a.active ? 'Active' : 'Inactive'}</button></td>
                  <td className="px-4 py-3 text-xs">{a.zip_codes?.length || 0}</td>
                  <td className="px-4 py-3"><div className="flex gap-0.5"><button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button><button onClick={() => move(i, 1)} disabled={i === areas.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button></div></td>
                  <td className="px-4 py-3"><button onClick={() => setEditing(a)} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <div className="flex items-center justify-between"><h3 className="font-bold text-brand-dark">{area.id ? 'Edit Area' : 'Add Area'}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>
        <div className="grid grid-cols-3 gap-2">
          <input value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          <input value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="ST" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <textarea value={zips} onChange={(e) => setZips(e.target.value)} placeholder="ZIP codes (comma-separated)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button onClick={() => onSave({ ...form, zip_codes: zips.split(',').map((z) => z.trim()).filter(Boolean) })} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Save</button></div>
      </div>
    </div>
  );
}