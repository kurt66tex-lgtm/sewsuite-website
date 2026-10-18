import { useEffect, useState } from 'react';
import { Plus, Edit3, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function TabTeam() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = () => {
    setLoading(true);
    base44.entities.Technician.list('-created_date', 200).then(setTechs).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (t) => {
    await base44.entities.Technician.update(t.id, { active: !t.active });
    load();
  };

  const save = async (data) => {
    if (data.id) await base44.entities.Technician.update(data.id, data);
    else await base44.entities.Technician.create({ ...data, active: true, color: data.color || COLORS[0] });
    setEditing(null);
    load();
  };

  return (
    <div className="space-y-4">
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-brand-dark">Technicians</h2>
          <p className="text-xs text-slate-500">Deactivate instead of deleting — preserves historical visit references.</p>
        </div>
        <button onClick={() => setEditing({ first_name: '', last_name: '', phone: '', email: '', color: COLORS[0], notes: '' })} className="inline-flex items-center gap-1 bg-brand-accent text-brand-dark text-sm font-bold px-3 py-1.5 rounded-lg">
          <Plus className="w-4 h-4" /> Add Technician
        </button>
      </div>
      {loading ? <div className="p-4 text-slate-400">Loading…</div> : (
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr><th className="text-left px-4 py-2">Name</th><th className="text-left px-4 py-2">Phone</th><th className="text-left px-4 py-2">Color</th><th className="text-left px-4 py-2">Status</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {techs.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{t.first_name} {t.last_name || ''}</td>
                <td className="px-4 py-2 text-xs">{t.phone || '—'}</td>
                <td className="px-4 py-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: t.color || '#3B82F6' }} />
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => toggleActive(t)} className={`text-xs px-2 py-0.5 rounded ${t.active !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {t.active !== false ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => setEditing(t)} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {techs.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No technicians yet.</td></tr>}
          </tbody>
        </table>
      )}
    </div>
    {editing && <TechEditor tech={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TechEditor({ tech, onSave, onClose }) {
  const [form, setForm] = useState(tech);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-md w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-brand-dark">{tech.id ? 'Edit Technician' : 'Add Technician'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.first_name || ''} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="First name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          <input value={form.last_name || ''} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email (optional)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Display Color</label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-7 h-7 rounded-full border-2 ${form.color === c ? 'border-slate-900' : 'border-transparent'}`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Save</button>
        </div>
      </div>
    </div>
  );
}