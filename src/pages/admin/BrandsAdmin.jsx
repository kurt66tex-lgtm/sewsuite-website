import { useEffect, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, Star, Edit3, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BrandsAdmin() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => { setLoading(true); base44.entities.Brand.list('display_order', 200).then(setBrands).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const toggle = async (b, field) => {
    await base44.entities.Brand.update(b.id, { [field]: !b[field] });
    load();
  };

  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= brands.length) return;
    const a = brands[idx]; const b = brands[target];
    await base44.entities.Brand.bulkUpdate([{ id: a.id, display_order: b.display_order }, { id: b.id, display_order: a.display_order }]);
    load();
  };

  const save = async (data) => {
    if (data.id) await base44.entities.Brand.update(data.id, data);
    else await base44.entities.Brand.create({ ...data, slug: (data.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'), display_order: 999 });
    setEditing(null); load();
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-brand-dark">Brands</h1>
        <button onClick={() => setEditing({ name: '', active: true, featured: false })} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark text-sm font-bold px-4 py-2 rounded-lg"><Plus className="w-4 h-4" /> Add Brand</button>
      </div>
      <p className="text-xs text-slate-400 mb-4">Brands management is also available in Settings → Services & Coverage.</p>
      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase"><tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Active</th><th className="text-left px-4 py-3">Featured</th><th className="text-left px-4 py-3">Order</th><th></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {brands.map((b, i) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{b.name}</td>
                  <td className="px-4 py-3"><button onClick={() => toggle(b, 'active')} className={`text-xs px-2 py-0.5 rounded ${b.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{b.active ? 'Active' : 'Inactive'}</button></td>
                  <td className="px-4 py-3"><button onClick={() => toggle(b, 'featured')} className={b.featured ? 'text-amber-500' : 'text-slate-300'}><Star className="w-4 h-4" fill={b.featured ? 'currentColor' : 'none'} /></button></td>
                  <td className="px-4 py-3"><div className="flex gap-0.5"><button onClick={() => move(i, -1)} disabled={i === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button><button onClick={() => move(i, 1)} disabled={i === brands.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button></div></td>
                  <td className="px-4 py-3"><button onClick={() => setEditing(b)} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <div className="flex items-center justify-between"><h3 className="font-bold text-brand-dark">{brand.id ? 'Edit Brand' : 'Add Brand'}</h3><button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button></div>
        <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Brand name" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
        <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2"><button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button onClick={() => onSave(form)} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Save</button></div>
      </div>
    </div>
  );
}