import { useState, useEffect, useCallback } from 'react';
import { X, AlertTriangle, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { normalizePhone, normalizeApplianceType } from '@/lib/crmUtils';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { crmVocabulary, isProjectQuoteModel } from '@/lib/businessModel';

const APPLIANCE_TYPES = ['Dishwasher', 'Refrigerator', 'Freezer', 'Washer', 'Dryer', 'Oven', 'Range', 'Cooktop', 'Ice Maker', 'Other'];
const GAS_ELECTRIC = ['N/A', 'Gas', 'Electric'];

export default function NewServiceCallDrawer({ open, onClose, prefillLead, prefillCustomer, defaultSource }) {
  const { settings } = useBusinessSettings();
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isProjectQuote = isProjectQuoteModel(settings);
  const terms = crmVocabulary(settings);
  const assetTrackingEnabled = settings?.asset_tracking_enabled === true && !isApplianceModule;
  const assetLabel = settings?.asset_label_singular || 'Equipment';
  const manufacturerLabel = settings?.manufacturer_label || 'Manufacturer / Brand';
  const [allCustomers, setAllCustomers] = useState([]);
  const [phone, setPhone] = useState('');
  const [matches, setMatches] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ first_name: '', last_name: '', email: '' });
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLoc, setNewLoc] = useState({ location_name: '', location_type: 'Home', address_line_1: '', address_line_2: '', city: '', state: 'TX', zip: '' });
  const [appliances, setAppliances] = useState([]);
  const [selectedApplianceId, setSelectedApplianceId] = useState(null);
  const [showNewAppliance, setShowNewAppliance] = useState(false);
  const [newApp, setNewApp] = useState({ appliance_type: '', brand: '', model_number: '', serial_number: '', approximate_age: '', gas_or_electric: 'N/A' });
  const [equipmentAssets, setEquipmentAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [showNewAsset, setShowNewAsset] = useState(false);
  const [newAsset, setNewAsset] = useState({ asset_type: '', manufacturer: '', model_number: '', serial_number: '', approximate_age: '', location_in_property: '', notes: '' });
  const [openJobs, setOpenJobs] = useState([]);
  const [ignoreOpenJob, setIgnoreOpenJob] = useState(false);
  const [svc, setSvc] = useState({ service_type: '', problem_description: '', error_code: '', when_started: '', frequency: '', previous_repair: '', customer_notes: '' });
  const [apptMode, setApptMode] = useState('unscheduled');
  const [requestedDate, setRequestedDate] = useState('');
  const [requestedWindow, setRequestedWindow] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [projectFulfillment, setProjectFulfillment] = useState('Not Set');
  const [artworkStatus, setArtworkStatus] = useState('');
  const [productionNotes, setProductionNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset and prefill when drawer opens
  useEffect(() => {
    if (!open) return;
    setError('');
    setIgnoreOpenJob(false);
    base44.entities.Customer.list('-created_date', 500).then(list => setAllCustomers(list.filter(c => !c.is_test_data))).catch(() => {});

    if (prefillLead) {
      setPhone(prefillLead.phone || '');
      setCustomerForm({ first_name: prefillLead.first_name || '', last_name: prefillLead.last_name || '', email: prefillLead.email || '' });
      setSvc({ service_type: prefillLead.service_type || prefillLead.appliance_type || '', problem_description: prefillLead.problem_description || '', error_code: prefillLead.error_code || '', when_started: '', frequency: '', previous_repair: '', customer_notes: '' });
      setNewApp({ appliance_type: normalizeApplianceType(prefillLead.appliance_type) || '', brand: prefillLead.brand || '', model_number: prefillLead.model_number || '', serial_number: prefillLead.serial_number || '', approximate_age: prefillLead.approximate_age || '', gas_or_electric: 'N/A' });
      setNewAsset({ asset_type: prefillLead.asset_type || '', manufacturer: prefillLead.manufacturer || prefillLead.brand || '', model_number: prefillLead.model_number || '', serial_number: prefillLead.serial_number || '', approximate_age: prefillLead.approximate_age || '', location_in_property: '', notes: prefillLead.equipment_information || '' });
      setNewLoc({ location_name: 'Service Location', location_type: 'Home', address_line_1: prefillLead.service_address || '', address_line_2: '', city: prefillLead.city || '', state: prefillLead.state || 'TX', zip: prefillLead.zip || '' });
      setRequestedDate(isProjectQuote ? (prefillLead.intake_answers?.desired_completion_date || prefillLead.requested_date || '') : (prefillLead.requested_date || ''));
      setRequestedWindow(prefillLead.requested_window || '');
      const rawFulfillment = String(prefillLead.intake_answers?.fulfillment_preference || '');
      setProjectFulfillment(/pickup/i.test(rawFulfillment) ? 'Local Pickup' : /ship/i.test(rawFulfillment) ? 'Shipping' : 'Not Set');
      setArtworkStatus(prefillLead.intake_answers?.artwork_status || '');
      setProductionNotes(prefillLead.intake_answers?.approximate_quantity ? `Approximate quantity: ${prefillLead.intake_answers.approximate_quantity}` : '');
      setShowNewLocation(!isProjectQuote && !prefillLead.customer_id);
      setShowNewAppliance(isApplianceModule);
      setShowNewAsset(assetTrackingEnabled);
      // Try to find existing customer by phone
      if (prefillLead.phone) {
        const normalized = normalizePhone(prefillLead.phone);
        const found = allCustomers.find(c => normalizePhone(c.primary_phone) === normalized);
        if (found) setSelectedCustomer(found);
        else setSelectedCustomer(null);
      } else {
        setSelectedCustomer(null);
      }
    } else if (prefillCustomer) {
      setSelectedCustomer(prefillCustomer);
      setPhone(prefillCustomer.primary_phone || '');
      setCustomerForm({ first_name: prefillCustomer.first_name || '', last_name: prefillCustomer.last_name || '', email: prefillCustomer.email || '' });
    } else {
      // Fresh form
      setPhone('');
      setCustomerForm({ first_name: '', last_name: '', email: '' });
      setSvc({ service_type: '', problem_description: '', error_code: '', when_started: '', frequency: '', previous_repair: '', customer_notes: '' });
      setNewApp({ appliance_type: '', brand: '', model_number: '', serial_number: '', approximate_age: '', gas_or_electric: 'N/A' });
      setNewAsset({ asset_type: '', manufacturer: '', model_number: '', serial_number: '', approximate_age: '', location_in_property: '', notes: '' });
      setNewLoc({ location_name: '', location_type: 'Home', address_line_1: '', address_line_2: '', city: '', state: 'TX', zip: '' });
      setContacts([]);
      setSelectedContactId(null);
      setRequestedDate('');
      setRequestedWindow('');
      setScheduledStart('');
      setSelectedCustomer(null);
      setShowNewLocation(!isProjectQuote);
      setShowNewAppliance(isApplianceModule);
      setShowNewAsset(assetTrackingEnabled);
      setSelectedAssetId(null);
      setApptMode('unscheduled');
      setProjectFulfillment('Not Set');
      setArtworkStatus('');
      setProductionNotes('');
    }
  }, [open]); // eslint-disable-line

  // Once the customer list finishes loading, resolve a prefilled lead to an
  // existing customer by normalized phone. This avoids showing a duplicate-new-customer
  // form just because Customer.list() had not finished on the first render.
  useEffect(() => {
    if (!open || !prefillLead?.phone || selectedCustomer || allCustomers.length === 0) return;
    const normalized = normalizePhone(prefillLead.phone);
    const found = allCustomers.find(c => normalizePhone(c.primary_phone) === normalized);
    if (found) setSelectedCustomer(found);
  }, [open, prefillLead, selectedCustomer, allCustomers]);

  // Phone/name search
  useEffect(() => {
    if (!open || selectedCustomer) { setMatches([]); return; }
    if (!phone || phone.length < 3) { setMatches([]); return; }
    const normalized = normalizePhone(phone);
    const q = phone.toLowerCase();
    const found = allCustomers.filter(c =>
      normalizePhone(c.primary_phone) === normalized ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    ).slice(0, 5);
    setMatches(found);
  }, [phone, allCustomers, open, selectedCustomer]);

  // Load customer data when selected
  const loadCustomerData = useCallback(async (custId) => {
    if (!custId) { setContacts([]); setLocations([]); setEquipmentAssets([]); setAppliances([]); setOpenJobs([]); return; }
    try {
      const [contactList, locs, assets, apps, jobs] = await Promise.all([
        base44.entities.CustomerContact.filter({ customer_id: custId }).catch(() => []),
        base44.entities.ServiceLocation.filter({ customer_id: custId }),
        base44.entities.EquipmentAsset.filter({ customer_id: custId }),
        base44.entities.ApplianceUnit.filter({ customer_id: custId }),
        base44.entities.Job.filter({ customer_id: custId })
      ]);
      const liveContacts = contactList.filter(c => c.active !== false);
      setContacts(liveContacts);
      setSelectedContactId(prev => prev || liveContacts.find(c => c.is_primary)?.id || liveContacts[0]?.id || null);
      setLocations(locs.filter(l => !l.archived_at && l.active !== false));
      setEquipmentAssets(assets.filter(a => a.active !== false));
      setAppliances(apps.filter(a => a.active !== false));
      setOpenJobs(jobs.filter(j => j.status !== 'Completed' && j.status !== 'Canceled'));
    } catch {}
  }, []);

  useEffect(() => {
    if (selectedCustomer) loadCustomerData(selectedCustomer.id);
    else { setContacts([]); setSelectedContactId(null); setLocations([]); setEquipmentAssets([]); setAppliances([]); setOpenJobs([]); }
  }, [selectedCustomer, loadCustomerData]);

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setPhone(c.primary_phone || '');
    setCustomerForm({ first_name: c.first_name, last_name: c.last_name, email: c.email || '' });
    setMatches([]);
    setShowNewLocation(false);
    setShowNewAppliance(false);
    setShowNewAsset(false);
    setSelectedLocationId(null);
    setSelectedContactId(null);
    setSelectedAssetId(null);
    setSelectedApplianceId(null);
  };

  const handleSave = async () => {
    setError('');
    if (!selectedCustomer && (!customerForm.first_name || !customerForm.last_name)) { setError('Customer first and last name are required.'); return; }
    if (!selectedCustomer && !phone) { setError('Phone number is required for new customers.'); return; }
    if (!isProjectQuote && !selectedLocationId && (!showNewLocation || !newLoc.address_line_1 || !newLoc.city || !newLoc.zip)) {
      setError('A complete service address is required.'); return;
    }
    if (isApplianceModule && !selectedApplianceId && (!showNewAppliance || !newApp.appliance_type)) {
      setError('Appliance type is required.'); return;
    }
    if (assetTrackingEnabled && !selectedAssetId && (!showNewAsset || !newAsset.asset_type)) {
      setError(`${assetLabel} type is required.`); return;
    }
    if (!svc.service_type && !(isApplianceModule && (newApp.appliance_type || selectedApplianceId))) {
      setError('Service type is required.'); return;
    }
    if (!isProjectQuote && selectedCustomer && openJobs.length > 0 && !ignoreOpenJob) {
      setError('This customer already has an open job. Open it or choose “Continue Creating New Job” first.'); return;
    }
    if (!isProjectQuote && apptMode === 'confirmed' && !scheduledStart) { setError('Confirmed appointment date and time are required.'); return; }

    setSaving(true);
    try {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        customer_contact_id: selectedCustomer ? (selectedContactId || null) : null,
        first_name: selectedCustomer ? null : customerForm.first_name,
        last_name: selectedCustomer ? null : customerForm.last_name,
        phone: selectedCustomer ? null : phone,
        email: selectedCustomer ? null : (customerForm.email || null),
        service_location_id: selectedLocationId || null,
        location_name: selectedLocationId ? null : (showNewLocation ? (newLoc.location_name || null) : null),
        location_type: selectedLocationId ? null : (showNewLocation ? (newLoc.location_type || 'Home') : null),
        primary_location_contact_id: selectedLocationId ? null : (showNewLocation ? (selectedContactId || null) : null),
        address_line_1: selectedLocationId ? null : (showNewLocation ? newLoc.address_line_1 : null),
        address_line_2: selectedLocationId ? null : (showNewLocation ? newLoc.address_line_2 : null),
        loc_city: selectedLocationId ? null : (showNewLocation ? newLoc.city : null),
        state: selectedLocationId ? null : (showNewLocation ? newLoc.state : null),
        zip: selectedLocationId ? null : (showNewLocation ? newLoc.zip : null),
        equipment_asset_id: !isApplianceModule ? (selectedAssetId || null) : null,
        asset_type: !isApplianceModule && !selectedAssetId && showNewAsset ? newAsset.asset_type : null,
        manufacturer: !isApplianceModule && !selectedAssetId && showNewAsset ? newAsset.manufacturer : null,
        equipment_information: !isApplianceModule && !selectedAssetId && showNewAsset ? newAsset.notes : null,
        location_in_property: !isApplianceModule && !selectedAssetId && showNewAsset ? newAsset.location_in_property : null,
        appliance_id: isApplianceModule ? (selectedApplianceId || null) : null,
        appliance_type: isApplianceModule && !selectedApplianceId ? (showNewAppliance ? newApp.appliance_type : null) : null,
        brand: isApplianceModule && !selectedApplianceId ? (showNewAppliance ? newApp.brand : null) : null,
        model_number: isApplianceModule
          ? (selectedApplianceId ? null : (showNewAppliance ? newApp.model_number : null))
          : (selectedAssetId ? null : (showNewAsset ? newAsset.model_number : null)),
        serial_number: isApplianceModule
          ? (selectedApplianceId ? null : (showNewAppliance ? newApp.serial_number : null))
          : (selectedAssetId ? null : (showNewAsset ? newAsset.serial_number : null)),
        approximate_age: isApplianceModule
          ? (selectedApplianceId ? null : (showNewAppliance ? newApp.approximate_age : null))
          : (selectedAssetId ? null : (showNewAsset ? newAsset.approximate_age : null)),
        gas_or_electric: isApplianceModule && !selectedApplianceId ? (showNewAppliance ? newApp.gas_or_electric : null) : null,
        service_type: svc.service_type || (isApplianceModule ? (selectedAppliance?.appliance_type || newApp.appliance_type) : null) || null,
        problem_description: svc.problem_description || null,
        error_code: svc.error_code || null,
        when_started: svc.when_started || null,
        frequency: svc.frequency || null,
        previous_repair: svc.previous_repair || null,
        customer_notes: svc.customer_notes || null,
        requested_date: isProjectQuote ? (requestedDate || null) : (apptMode === 'unscheduled' ? (requestedDate || null) : null),
        requested_window: isProjectQuote ? null : (apptMode === 'unscheduled' ? (requestedWindow || null) : null),
        scheduled_start: !isProjectQuote && apptMode === 'confirmed' ? (scheduledStart ? new Date(scheduledStart).toISOString() : null) : null,
        workflow_stage: isProjectQuote ? 'Quote Needed' : null,
        fulfillment_method: isProjectQuote ? projectFulfillment : null,
        artwork_status: isProjectQuote ? (artworkStatus || null) : null,
        proof_status: isProjectQuote ? 'Not Started' : null,
        production_notes: isProjectQuote ? (productionNotes || null) : null,
        lead_id: prefillLead?.id || null,
        conversation_id: prefillLead?.conversation_id || null,
        source: prefillLead ? prefillLead.source : (defaultSource || 'Phone'),
        is_test_data: prefillLead?.is_test_data || false,
        allow_duplicate_open_job: !!ignoreOpenJob
      };

      const res = await base44.functions.invoke('createServiceCall', payload);
      if (res.data?.error) { setError(res.data.error); setSaving(false); return; }
      onClose();
      window.location.reload();
    } catch (e) {
      setError(e.message || 'Failed to create service call.');
    }
    setSaving(false);
  };

  if (!open) return null;

  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const selectedAsset = equipmentAssets.find(a => a.id === selectedAssetId);
  const selectedAppliance = appliances.find(a => a.id === selectedApplianceId);
  const hasOpenJobWarning = !isProjectQuote && openJobs.length > 0 && !ignoreOpenJob && selectedCustomer;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl overflow-y-auto h-full">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="font-bold text-slate-900 text-lg">+ {terms.createWork}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="p-4 space-y-5">
          {/* Customer Search */}
          <section>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Phone Number</label>
            <input
              value={phone}
              onChange={e => { setPhone(e.target.value); if (selectedCustomer) { setSelectedCustomer(null); setSelectedContactId(null); setSelectedLocationId(null); setSelectedAssetId(null); setSelectedApplianceId(null); } }}
              placeholder="(972) 442-1285"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none"
              autoFocus
            />
            {matches.length > 0 && !selectedCustomer && (
              <div className="mt-2 space-y-1">
                {matches.map(c => (
                  <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left border border-slate-200 rounded-lg p-2 hover:border-brand-accent transition-colors">
                    <div className="font-semibold text-sm text-slate-900">{c.first_name} {c.last_name}</div>
                    <div className="text-xs text-slate-500">{c.primary_phone} {c.email ? `· ${c.email}` : ''}</div>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{selectedCustomer.first_name} {selectedCustomer.last_name}</div>
                    <div className="text-xs text-slate-500">{selectedCustomer.primary_phone}</div>
                  </div>
                </div>
                <button onClick={() => { setSelectedCustomer(null); setSelectedContactId(null); setPhone(''); setSelectedLocationId(null); setSelectedAssetId(null); setSelectedApplianceId(null); setShowNewLocation(true); setShowNewAsset(assetTrackingEnabled); setShowNewAppliance(isApplianceModule); }} className="text-xs text-slate-400 hover:text-slate-600">Change</button>
              </div>
            )}
            {!selectedCustomer && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input value={customerForm.first_name} onChange={e => setCustomerForm({...customerForm, first_name: e.target.value})} placeholder="First name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input value={customerForm.last_name} onChange={e => setCustomerForm({...customerForm, last_name: e.target.value})} placeholder="Last name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input value={customerForm.email} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} placeholder="Email (optional)" className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            )}
          </section>

          {/* Job / site contact */}
          {selectedCustomer && contacts.length > 0 && (
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{isProjectQuote ? 'Project Contact' : 'Job / Site Contact'}</label>
              <div className="space-y-1">
                {contacts.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedContactId(c.id)}
                    className={`w-full text-left border rounded-lg p-2 transition-colors ${selectedContactId === c.id ? 'border-brand-accent bg-yellow-50' : 'border-slate-200 hover:border-brand-accent'}`}
                  >
                    <div className="text-sm font-medium text-slate-900">{c.display_name}{c.is_primary ? ' · Primary' : ''}</div>
                    <div className="text-xs text-slate-500">{[c.title_or_relationship, c.phone, c.email].filter(Boolean).join(' · ')}</div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Service Location */}
          {!isProjectQuote && <>
          {selectedCustomer && locations.length > 0 && (
            <section>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Service Location</label>
              <div className="space-y-1">
                {locations.map(l => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedLocationId(l.id);
                      if (l.primary_contact_id && contacts.some(c => c.id === l.primary_contact_id)) setSelectedContactId(l.primary_contact_id);
                    }}
                    className={`w-full text-left border rounded-lg p-2 transition-colors ${selectedLocationId === l.id ? 'border-brand-accent bg-yellow-50' : 'border-slate-200 hover:border-brand-accent'}`}
                  >
                    <div className="text-sm font-medium text-slate-900">{l.location_name ? `${l.location_name} · ` : ''}{l.address_line_1}</div>
                    <div className="text-xs text-slate-500">{[l.location_type, `${l.city} ${l.state} ${l.zip}`, l.primary_location ? 'Primary' : null].filter(Boolean).join(' · ')}</div>
                  </button>
                ))}
              </div>
              {!showNewLocation && <button onClick={() => setShowNewLocation(true)} className="mt-2 text-sm text-brand-dark font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add New Location</button>}
            </section>
          )}
          {showNewLocation && !selectedLocationId && (
            <section className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase">New Location</div>
              <div className="grid grid-cols-2 gap-2">
                <input value={newLoc.location_name} onChange={e => setNewLoc({...newLoc, location_name: e.target.value})} placeholder="Location name (Home, Main Office…)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <select value={newLoc.location_type} onChange={e => setNewLoc({...newLoc, location_type: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                  <option>Home</option>
                  <option>Rental Property</option>
                  <option>Business</option>
                  <option>Office</option>
                  <option>Warehouse</option>
                  <option>Retail</option>
                  <option>HOA / Community</option>
                  <option>Church / Nonprofit</option>
                  <option>Other</option>
                </select>
              </div>
              <input value={newLoc.address_line_1} onChange={e => setNewLoc({...newLoc, address_line_1: e.target.value})} placeholder="Street address" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input value={newLoc.city} onChange={e => setNewLoc({...newLoc, city: e.target.value})} placeholder="City" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input value={newLoc.zip} onChange={e => setNewLoc({...newLoc, zip: e.target.value})} placeholder="ZIP" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </section>
          )}
          {selectedCustomer && locations.length === 0 && !showNewLocation && (
            <button onClick={() => setShowNewLocation(true)} className="text-sm text-brand-dark font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add Service Location</button>
          )}

          </>}

          {/* Appliance Repair niche asset */}
          {isApplianceModule && (
            <>
              {selectedCustomer && appliances.length > 0 && (
                <section>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Appliance</label>
                  <div className="space-y-1">
                    {appliances.map(a => (
                      <button key={a.id} onClick={() => setSelectedApplianceId(a.id)} className={`w-full text-left border rounded-lg p-2 transition-colors ${selectedApplianceId === a.id ? 'border-brand-accent bg-yellow-50' : 'border-slate-200 hover:border-brand-accent'}`}>
                        <div className="text-sm font-medium text-slate-900">{a.brand} {a.appliance_type}</div>
                        <div className="text-xs text-slate-500">Model: {a.model_number || '—'} {a.approximate_age ? `· ${a.approximate_age}` : ''}</div>
                      </button>
                    ))}
                  </div>
                  {!showNewAppliance && <button onClick={() => setShowNewAppliance(true)} className="mt-2 text-sm text-brand-dark font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add New Appliance</button>}
                </section>
              )}
              {showNewAppliance && !selectedApplianceId && (
                <section className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">New Appliance</div>
                  <select value={newApp.appliance_type} onChange={e => setNewApp({...newApp, appliance_type: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">Select appliance type...</option>
                    {APPLIANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newApp.brand} onChange={e => setNewApp({...newApp, brand: e.target.value})} placeholder="Brand" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={newApp.approximate_age} onChange={e => setNewApp({...newApp, approximate_age: e.target.value})} placeholder="Approx age" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={newApp.model_number} onChange={e => setNewApp({...newApp, model_number: e.target.value})} placeholder="Model number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={newApp.serial_number} onChange={e => setNewApp({...newApp, serial_number: e.target.value})} placeholder="Serial number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <select value={newApp.gas_or_electric} onChange={e => setNewApp({...newApp, gas_or_electric: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                    {GAS_ELECTRIC.map(g => <option key={g} value={g}>{g === 'N/A' ? 'Gas/Electric: N/A' : g}</option>)}
                  </select>
                  <button onClick={() => setShowNewAppliance(false)} className="text-xs text-slate-400">Cancel new appliance</button>
                </section>
              )}
              {selectedCustomer && appliances.length === 0 && !showNewAppliance && (
                <button onClick={() => setShowNewAppliance(true)} className="text-sm text-brand-dark font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add Appliance</button>
              )}
            </>
          )}

          {/* Generic Core asset */}
          {assetTrackingEnabled && (
            <>
              {selectedCustomer && equipmentAssets.length > 0 && (
                <section>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{assetLabel}</label>
                  <div className="space-y-1">
                    {equipmentAssets.map(asset => (
                      <button key={asset.id} onClick={() => setSelectedAssetId(asset.id)} className={`w-full text-left border rounded-lg p-2 transition-colors ${selectedAssetId === asset.id ? 'border-brand-accent bg-yellow-50' : 'border-slate-200 hover:border-brand-accent'}`}>
                        <div className="text-sm font-medium text-slate-900">{[asset.manufacturer, asset.asset_type].filter(Boolean).join(' ') || assetLabel}</div>
                        <div className="text-xs text-slate-500">Model: {asset.model_number || '—'} {asset.location_in_property ? `· ${asset.location_in_property}` : ''}</div>
                      </button>
                    ))}
                  </div>
                  {!showNewAsset && <button onClick={() => setShowNewAsset(true)} className="mt-2 text-sm text-brand-dark font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add New {assetLabel}</button>}
                </section>
              )}
              {showNewAsset && !selectedAssetId && (
                <section className="border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase">New {assetLabel}</div>
                  <input value={newAsset.asset_type} onChange={e => setNewAsset({...newAsset, asset_type: e.target.value})} placeholder={`${assetLabel} type`} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newAsset.manufacturer} onChange={e => setNewAsset({...newAsset, manufacturer: e.target.value})} placeholder={manufacturerLabel} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={newAsset.approximate_age} onChange={e => setNewAsset({...newAsset, approximate_age: e.target.value})} placeholder="Approx age" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={newAsset.model_number} onChange={e => setNewAsset({...newAsset, model_number: e.target.value})} placeholder="Model number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                    <input value={newAsset.serial_number} onChange={e => setNewAsset({...newAsset, serial_number: e.target.value})} placeholder="Serial number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <input value={newAsset.location_in_property} onChange={e => setNewAsset({...newAsset, location_in_property: e.target.value})} placeholder="Location on property (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <textarea value={newAsset.notes} onChange={e => setNewAsset({...newAsset, notes: e.target.value})} placeholder="Equipment notes (optional)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                  <button onClick={() => setShowNewAsset(false)} className="text-xs text-slate-400">Cancel new {assetLabel.toLowerCase()}</button>
                </section>
              )}
              {selectedCustomer && equipmentAssets.length === 0 && !showNewAsset && (
                <button onClick={() => setShowNewAsset(true)} className="text-sm text-brand-dark font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add {assetLabel}</button>
              )}
            </>
          )}

          {/* Open Job Warning */}
          {hasOpenJobWarning && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2"><AlertTriangle className="w-4 h-4" /> OPEN JOB FOUND</div>
              {openJobs.map(j => (
                <div key={j.id} className="text-sm text-slate-700 mb-2">{j.job_number} · {j.service_type} · {j.status}</div>
              ))}
              <div className="flex gap-2">
                <a href={`/admin/jobs?job=${openJobs[0].id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-400 text-amber-800 hover:bg-amber-100">Open Existing Job</a>
                <button onClick={() => setIgnoreOpenJob(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-400 text-white hover:bg-amber-500">Continue Creating New Job</button>
              </div>
            </div>
          )}

          {/* Service Details */}
          <section className="border-t pt-3 space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">{isProjectQuote ? 'Project Details' : 'Service Details'}</label>
            <input value={svc.service_type} onChange={e => setSvc({...svc, service_type: e.target.value})} placeholder={isProjectQuote ? 'Project type' : 'Service type (e.g. Dishwasher Repair)'} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            <textarea value={svc.problem_description} onChange={e => setSvc({...svc, problem_description: e.target.value})} placeholder={isProjectQuote ? 'Project description' : 'Problem description'} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            {!isProjectQuote && <div className="grid grid-cols-2 gap-2">
              <input value={svc.error_code} onChange={e => setSvc({...svc, error_code: e.target.value})} placeholder="Error code (optional)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input value={svc.when_started} onChange={e => setSvc({...svc, when_started: e.target.value})} placeholder="When started (optional)" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>}
            <textarea value={svc.customer_notes} onChange={e => setSvc({...svc, customer_notes: e.target.value})} placeholder="Customer notes (optional)" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </section>

          {isProjectQuote ? (
            <section className="border-t pt-3 space-y-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase">Project Planning</label>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-slate-500 mb-1">Desired completion date</label><input type="date" value={requestedDate} onChange={e => setRequestedDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs text-slate-500 mb-1">Fulfillment</label><select value={projectFulfillment} onChange={e => setProjectFulfillment(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><option>Not Set</option><option>Local Pickup</option><option>Shipping</option></select></div>
              </div>
              <input value={artworkStatus} onChange={e => setArtworkStatus(e.target.value)} placeholder="Artwork status (optional)" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <textarea value={productionNotes} onChange={e => setProductionNotes(e.target.value)} placeholder="Quantity, timing, production or project notes" rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </section>
          ) : (
          <>
          {/* Appointment */}
          <section className="border-t pt-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Appointment</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={apptMode === 'unscheduled'} onChange={() => setApptMode('unscheduled')} /> Create Unscheduled Job
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" checked={apptMode === 'confirmed'} onChange={() => setApptMode('confirmed')} /> Enter Confirmed Appointment
              </label>
            </div>
            {apptMode === 'unscheduled' ? (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={requestedDate} onChange={e => setRequestedDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
                <input value={requestedWindow} onChange={e => setRequestedWindow(e.target.value)} placeholder="Morning / Afternoon" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            ) : (
              <input type="datetime-local" value={scheduledStart} onChange={e => setScheduledStart(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            )}
          </section>
          </>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">{error}</div>}

          {/* Actions */}
          <div className="flex gap-2 border-t pt-3 sticky bottom-0 bg-white">
            <button onClick={onClose} className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 bg-brand-accent text-brand-dark rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {terms.createWork}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}