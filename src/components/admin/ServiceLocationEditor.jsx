import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LOCATION_TYPES = ['Home', 'Rental Property', 'Business', 'Office', 'Warehouse', 'Retail', 'HOA / Community', 'Church / Nonprofit', 'Other'];

const emptyLocation = {
  location_name: '',
  location_type: 'Home',
  active: true,
  primary_location: false,
  primary_contact_id: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: 'TX',
  zip: '',
  gate_access_instructions: '',
  parking_instructions: '',
  pets_onsite_notes: '',
  location_notes: ''
};

export default function ServiceLocationEditor({ customerId, location, onClose, onSaved }) {
  const [form, setForm] = useState({ ...emptyLocation, ...(location || {}), primary_contact_id: location?.primary_contact_id || '' });
  const [contacts, setContacts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.CustomerContact.filter({ customer_id: customerId })
      .then(list => setContacts((list || []).filter(c => c.active !== false)))
      .catch(() => setContacts([]));
  }, [customerId]);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    if (!form.address_line_1?.trim() || !form.city?.trim() || !form.zip?.trim()) {
      setError('Street address, city, and ZIP are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        customer_id: customerId,
        location_name: form.location_name?.trim() || null,
        location_type: form.location_type || 'Home',
        active: form.active !== false,
        primary_location: !!form.primary_location,
        primary_contact_id: form.primary_contact_id || null,
        address_line_1: form.address_line_1.trim(),
        address_line_2: form.address_line_2?.trim() || null,
        city: form.city.trim(),
        state: (form.state || 'TX').trim().toUpperCase(),
        zip: form.zip.trim(),
        gate_access_instructions: form.gate_access_instructions?.trim() || null,
        parking_instructions: form.parking_instructions?.trim() || null,
        pets_onsite_notes: form.pets_onsite_notes?.trim() || null,
        location_notes: form.location_notes?.trim() || null
      };

      let saved;
      if (location?.id) saved = await base44.entities.ServiceLocation.update(location.id, payload);
      else saved = await base44.entities.ServiceLocation.create(payload);

      if (payload.primary_location) {
        const all = await base44.entities.ServiceLocation.filter({ customer_id: customerId });
        await Promise.all((all || []).filter(l => l.id !== saved.id && l.primary_location).map(l => base44.entities.ServiceLocation.update(l.id, { primary_location: false })));
      }

      await base44.entities.CRMActivity.create({
        entity_type: 'Customer',
        entity_id: customerId,
        customer_id: customerId,
        event_type: location?.id ? 'Service location updated' : 'Service location added',
        performed_at: new Date().toISOString(),
        description: `${payload.location_name || 'Service Location'} · ${payload.address_line_1}, ${payload.city}`
      }).catch(() => {});

      onSaved?.(saved);
    } catch (e) {
      setError(e.message || 'Unable to save service location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-5 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">{location?.id ? 'Edit Service Location' : 'Add Service Location'}</h3>
            <p className="text-xs text-slate-500 mt-1">Location names, access details, and site contacts follow the customer across future jobs.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location Name</label>
            <input value={form.location_name || ''} onChange={e => update('location_name', e.target.value)} placeholder="Home, Rental #2, Main Office…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location Type</label>
            <select value={form.location_type || 'Home'} onChange={e => update('location_type', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {LOCATION_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Primary Site Contact</label>
          <select value={form.primary_contact_id || ''} onChange={e => update('primary_contact_id', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Use customer/default contact</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.display_name}{c.title_or_relationship ? ` · ${c.title_or_relationship}` : ''}</option>)}
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input value={form.address_line_1 || ''} onChange={e => update('address_line_1', e.target.value)} placeholder="Street address *" className="sm:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input value={form.address_line_2 || ''} onChange={e => update('address_line_2', e.target.value)} placeholder="Suite / unit" className="sm:col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <input value={form.city || ''} onChange={e => update('city', e.target.value)} placeholder="City *" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-2">
            <input value={form.state || 'TX'} onChange={e => update('state', e.target.value)} placeholder="State" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <input value={form.zip || ''} onChange={e => update('zip', e.target.value)} placeholder="ZIP *" className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <textarea value={form.gate_access_instructions || ''} onChange={e => update('gate_access_instructions', e.target.value)} placeholder="Gate / access instructions" rows={2} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <textarea value={form.parking_instructions || ''} onChange={e => update('parking_instructions', e.target.value)} placeholder="Parking instructions" rows={2} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <textarea value={form.pets_onsite_notes || ''} onChange={e => update('pets_onsite_notes', e.target.value)} placeholder="Pets / onsite notes" rows={2} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <textarea value={form.location_notes || ''} onChange={e => update('location_notes', e.target.value)} placeholder="Other location notes" rows={2} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={!!form.primary_location} onChange={e => update('primary_location', e.target.checked)} /> Primary location</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.active !== false} onChange={e => update('active', e.target.checked)} /> Active</label>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50">{saving ? 'Saving…' : 'Save Location'}</button>
        </div>
      </div>
    </div>
  );
}
