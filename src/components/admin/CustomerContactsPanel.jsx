import { useEffect, useState } from 'react';
import { Plus, Edit3, Star, Phone, Mail, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const RELATIONSHIPS = ['Owner', 'Spouse', 'Property Manager', 'Tenant', 'Site Contact', 'Maintenance', 'Office Manager', 'Other'];

const emptyForm = {
  first_name: '',
  last_name: '',
  display_name: '',
  title_or_relationship: '',
  phone: '',
  email: '',
  preferred_contact_method: 'Phone',
  is_primary: false,
  active: true,
  notes: ''
};

export default function CustomerContactsPanel({ customerId, onChanged }) {
  const [contacts, setContacts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const list = await base44.entities.CustomerContact.filter({ customer_id: customerId });
      setContacts((list || []).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || String(a.display_name || '').localeCompare(String(b.display_name || ''))));
    } catch (e) {
      setError(e.message || 'Unable to load contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [customerId]);

  const save = async (form) => {
    setError('');
    try {
      const displayName = String(form.display_name || '').trim() || [form.first_name, form.last_name].filter(Boolean).join(' ').trim();
      if (!displayName) throw new Error('Contact name is required.');
      const payload = {
        customer_id: customerId,
        first_name: form.first_name || '',
        last_name: form.last_name || '',
        display_name: displayName,
        title_or_relationship: form.title_or_relationship || null,
        phone: form.phone || null,
        email: form.email || null,
        preferred_contact_method: form.preferred_contact_method || 'Phone',
        is_primary: !!form.is_primary || contacts.length === 0,
        active: form.active !== false,
        notes: form.notes || null
      };
      let saved;
      if (form.id) saved = await base44.entities.CustomerContact.update(form.id, payload);
      else saved = await base44.entities.CustomerContact.create(payload);

      if (payload.is_primary) {
        await Promise.all(contacts.filter(c => c.id !== saved.id && c.is_primary).map(c => base44.entities.CustomerContact.update(c.id, { is_primary: false })));
      }

      await base44.entities.CRMActivity.create({
        entity_type: 'Customer',
        entity_id: customerId,
        customer_id: customerId,
        event_type: form.id ? 'Customer contact updated' : 'Customer contact added',
        description: `${displayName}${payload.title_or_relationship ? ` · ${payload.title_or_relationship}` : ''}`,
        performed_at: new Date().toISOString()
      }).catch(() => {});

      setEditing(null);
      await load();
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to save contact.');
    }
  };

  const setPrimary = async (contact) => {
    await Promise.all(contacts.map(c => base44.entities.CustomerContact.update(c.id, { is_primary: c.id === contact.id })));
    await load();
    onChanged?.();
  };

  const toggleActive = async (contact) => {
    await base44.entities.CustomerContact.update(contact.id, { active: !contact.active });
    await load();
    onChanged?.();
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase">Contacts</h3>
        <button onClick={() => setEditing({ ...emptyForm, is_primary: contacts.length === 0 })} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:text-slate-700">
          <Plus className="w-3.5 h-3.5" /> Add Contact
        </button>
      </div>

      {error && <div className="mb-2 border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-xs">{error}</div>}

      {loading ? <div className="text-sm text-slate-400">Loading contacts…</div> : contacts.length ? (
        <div className="space-y-2">
          {contacts.map(c => (
            <div key={c.id} className={`border rounded-lg p-3 ${c.active === false ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-slate-900">{c.display_name}</span>
                    {c.is_primary && <span className="text-[10px] rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 font-semibold">Primary</span>}
                    {c.active === false && <span className="text-[10px] rounded bg-slate-200 text-slate-500 px-1.5 py-0.5 font-semibold">Inactive</span>}
                  </div>
                  {c.title_or_relationship && <div className="text-xs text-slate-500">{c.title_or_relationship}</div>}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                    {c.phone && <a href={`tel:${String(c.phone).replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</a>}
                    <span>Prefers {c.preferred_contact_method || 'Phone'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!c.is_primary && c.active !== false && <button title="Make primary" onClick={() => setPrimary(c)} className="text-slate-300 hover:text-amber-500"><Star className="w-4 h-4" /></button>}
                  <button onClick={() => setEditing({ ...emptyForm, ...c })} className="text-slate-400 hover:text-slate-700"><Edit3 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-2 flex gap-3 text-[11px]">
                <button onClick={() => toggleActive(c)} className="text-slate-500 hover:text-slate-800">{c.active === false ? 'Reactivate' : 'Make inactive'}</button>
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-400">No additional contacts yet. The customer record remains the default contact until one is added.</p>}

      {editing && <ContactEditor contact={editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ContactEditor({ contact, onSave, onClose }) {
  const [form, setForm] = useState(contact);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-xl w-full space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">{contact.id ? 'Edit Contact' : 'Add Contact'}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="First name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          <input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Last name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <input value={form.display_name || ''} onChange={e => setForm({ ...form, display_name: e.target.value })} placeholder="Display name (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <select value={form.title_or_relationship || ''} onChange={e => setForm({ ...form, title_or_relationship: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Relationship / title…</option>
          {RELATIONSHIPS.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <select value={form.preferred_contact_method || 'Phone'} onChange={e => setForm({ ...form, preferred_contact_method: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
          <option>Phone</option><option>SMS</option><option>Email</option>
        </select>
        <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Contact notes (optional)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={!!form.is_primary} onChange={e => setForm({ ...form, is_primary: e.target.checked })} />
          Primary customer contact
        </label>

        <div className="flex gap-2 border-t pt-3">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold">Save Contact</button>
        </div>
      </div>
    </div>
  );
}
