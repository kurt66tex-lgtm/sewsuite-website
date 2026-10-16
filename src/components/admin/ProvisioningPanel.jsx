import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Circle, Loader2, PlayCircle, RefreshCw, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BUILD_PACK_TEMPLATE = JSON.stringify({
  foundation: {
    business_name: "",
    client_name: "",
    primary_domain: "",
    website_url: "",
    industry_module: "generic_service",
    phone: "",
    email: "",
    customer_support_email: "",
    timezone: "America/Chicago",
    primary_business_category: "Home service",
    service_region_label: "",
    asset_tracking_enabled: false,
    enabled_modules: [],
    plan_name: "Website + CRM",
    base_price: 0,
    billing_frequency: "Monthly",
    billing_email: "",
    reputation_management_enabled: false,
    reputation_management_billing_enabled: true,
    reputation_management_monthly_fee: 0,
    google_local_leads_enabled: false,
    google_local_leads_billing_enabled: true,
    google_local_leads_monthly_fee: 0,
    voice_ai_enabled: false,
    voice_ai_monthly_fee: 0,
    voice_ai_per_minute_billing_enabled: true,
    voice_ai_provider_cost_per_minute: 0.05,
    voice_ai_telephony_cost_per_minute: 0,
    voice_ai_backend_cost_allowance_per_minute: 0,
    voice_ai_markup_percent: 25,
    voice_ai_voice: "Gleam",
    voice_ai_openai_project_id: "",
    voice_ai_qualification_enabled: false,
    voice_ai_target_customer_types: [],
    voice_ai_decline_personal_orders: false,
    voice_ai_local_sports_only: false,
    voice_ai_minimum_quantity: 0,
    voice_ai_qualification_notes: ""
  },
  settings: {
    primary_message: "",
    about_copy: "",
    established_year: null,
    credentials: [],
    trust_highlights: [],
    emergency_service_enabled: false,
    emergency_service_text: "",
    seo_default_meta_title: "",
    seo_default_meta_description: ""
  },
  seo: {
    legacy_redirects: [],
    launch_notes: ""
  },
  services: [],
  service_areas: [],
  intake_questions: [],
  knowledge: []
}, null, 2);

const INDUSTRIES = [
  ['generic_service', 'Generic Service Business'],
  ['appliance_repair', 'Appliance Repair'],
  ['plumbing', 'Plumbing'],
  ['hvac', 'HVAC'],
  ['electrical', 'Electrical'],
  ['landscaping', 'Landscaping'],
  ['garage_door', 'Garage Door'],
  ['roofing', 'Roofing'],
  ['custom', 'Custom']
];

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent" />
    </label>
  );
}

function StatusIcon({ status }) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />;
  if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  return <Circle className="w-4 h-4 text-red-500 flex-shrink-0" />;
}

export default function ProvisioningPanel({ onChanged }) {
  const [state, setState] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [onboardingIntake, setOnboardingIntake] = useState({});
  const [onboardingContact, setOnboardingContact] = useState({ name:'', email:'', phone:'' });
  const [onboardingNotes, setOnboardingNotes] = useState('');
  const [agencyWork, setAgencyWork] = useState({});
  const [agencyWorkNotes, setAgencyWorkNotes] = useState('');
  const [manualQa, setManualQa] = useState({});
  const [launchNotes, setLaunchNotes] = useState('');
  const [moduleText, setModuleText] = useState('');
  const [buildPackText, setBuildPackText] = useState('');
  const [buildPackPreview, setBuildPackPreview] = useState(null);
  const [rehearsal, setRehearsal] = useState(null);
  const [workflowResult, setWorkflowResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const call = async (action, payload = {}) => {
    const res = await base44.functions.invoke('manageProvisioning', { action, ...payload });
    const data = res?.data || res || {};
    if (data.error) {
      const err = new Error(data.error);
      err.readiness = data.readiness;
      throw err;
    }
    return data;
  };

  const hydrate = (data) => {
    const s = data.settings || {};
    const c = data.control || {};
    const source = c.provisioning_manifest || {};
    const next = {
      business_name: source.business_name || s.business_name || '',
      client_name: source.client_name || c.client_name || '',
      tenant_key: source.tenant_key || c.tenant_key || '',
      primary_domain: source.primary_domain || c.primary_domain || '',
      website_url: source.website_url || s.website_url || '',
      industry_module: source.industry_module || s.industry_module || 'generic_service',
      asset_tracking_enabled: source.asset_tracking_enabled ?? s.asset_tracking_enabled ?? false,
      asset_label_singular: source.asset_label_singular || s.asset_label_singular || 'Equipment',
      asset_label_plural: source.asset_label_plural || s.asset_label_plural || 'Equipment',
      manufacturer_label: source.manufacturer_label || s.manufacturer_label || 'Manufacturer / Brand',
      phone: source.phone || s.phone || '',
      email: source.email || s.email || '',
      customer_support_email: source.customer_support_email || s.customer_support_email || '',
      timezone: source.timezone || s.timezone || 'America/Chicago',
      primary_business_category: source.primary_business_category || s.primary_business_category || 'Home service',
      service_region_label: source.service_region_label || s.service_region_label || '',
      plan_name: source.plan_name || c.plan_name || 'Website + CRM',
      base_price: source.base_price ?? c.base_price ?? 0,
      billing_frequency: source.billing_frequency || c.billing_frequency || 'Monthly',
      billing_email: source.billing_email || c.billing_email || s.email || '',
      reputation_management_enabled: source.reputation_management_enabled ?? c.reputation_management_enabled ?? false,
      reputation_management_billing_enabled: source.reputation_management_billing_enabled ?? c.reputation_management_billing_enabled ?? true,
      reputation_management_monthly_fee: source.reputation_management_monthly_fee ?? c.reputation_management_monthly_fee ?? 0,
      google_local_leads_enabled: source.google_local_leads_enabled ?? c.google_local_leads_enabled ?? false,
      google_local_leads_billing_enabled: source.google_local_leads_billing_enabled ?? c.google_local_leads_billing_enabled ?? true,
      google_local_leads_monthly_fee: source.google_local_leads_monthly_fee ?? c.google_local_leads_monthly_fee ?? 0,
      voice_ai_enabled: source.voice_ai_enabled ?? c.voice_ai_enabled ?? false,
      voice_ai_monthly_fee: source.voice_ai_monthly_fee ?? c.voice_ai_monthly_fee ?? 0,
      voice_ai_per_minute_billing_enabled: source.voice_ai_per_minute_billing_enabled ?? c.voice_ai_per_minute_billing_enabled ?? true,
      voice_ai_provider_cost_per_minute: source.voice_ai_provider_cost_per_minute ?? c.voice_ai_provider_cost_per_minute ?? 0.05,
      voice_ai_telephony_cost_per_minute: source.voice_ai_telephony_cost_per_minute ?? c.voice_ai_telephony_cost_per_minute ?? 0,
      voice_ai_backend_cost_allowance_per_minute: source.voice_ai_backend_cost_allowance_per_minute ?? c.voice_ai_backend_cost_allowance_per_minute ?? 0,
      voice_ai_markup_percent: source.voice_ai_markup_percent ?? c.voice_ai_markup_percent ?? 25,
      voice_ai_voice: source.voice_ai_voice || c.voice_ai_voice || 'Gleam',
      voice_ai_openai_project_id: source.voice_ai_openai_project_id || c.voice_ai_openai_project_id || '',
      voice_ai_qualification_enabled: source.voice_ai_qualification_enabled ?? c.voice_ai_qualification_enabled ?? false,
      voice_ai_target_customer_types: source.voice_ai_target_customer_types || c.voice_ai_target_customer_types || [],
      voice_ai_decline_personal_orders: source.voice_ai_decline_personal_orders ?? c.voice_ai_decline_personal_orders ?? false,
      voice_ai_local_sports_only: source.voice_ai_local_sports_only ?? c.voice_ai_local_sports_only ?? false,
      voice_ai_minimum_quantity: source.voice_ai_minimum_quantity ?? c.voice_ai_minimum_quantity ?? 0,
      voice_ai_qualification_notes: source.voice_ai_qualification_notes || c.voice_ai_qualification_notes || ''
    };
    setManifest(next);
    setModuleText((source.enabled_modules || s.enabled_modules || []).join(', '));
    setOnboardingIntake(c.onboarding_intake || {});
    setOnboardingContact({
      name:c.onboarding_primary_contact_name || '',
      email:c.onboarding_primary_contact_email || '',
      phone:c.onboarding_primary_contact_phone || ''
    });
    setOnboardingNotes(c.onboarding_notes || '');
    setAgencyWork(c.agency_work || {});
    setAgencyWorkNotes(c.agency_work_notes || '');
    setManualQa(c.manual_qa || {});
    setLaunchNotes(c.launch_notes || '');
    setState(data);
  };

  const load = async () => {
    setBusy(true);
    setError('');
    try {
      hydrate(await call('get'));
    } catch (e) {
      setError(e.message || 'Unable to load provisioning.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setManifest(m => ({ ...m, [key]: value }));

  const apply = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const enabled_modules = moduleText.split(',').map(v => v.trim()).filter(Boolean);
      const data = await call('apply_manifest', { manifest: { ...manifest, enabled_modules } });
      hydrate({ ...state, ...data, manual_qa_items: state?.manual_qa_items });
      setNotice('Client foundation configuration applied. No fake services, areas, reviews, or customers were seeded.');
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to apply client configuration.');
    } finally {
      setBusy(false);
    }
  };

  const saveAgencyWork = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await call('save_agency_work', { agency_work:agencyWork, agency_work_notes:agencyWorkNotes });
      hydrate({ ...state, control:data.control || state.control });
      const progress = data.agency_work || {};
      setNotice(progress.complete
        ? 'Agency work queue is complete for the currently selected package and add-ons.'
        : `Agency work saved: ${progress.completed || 0}/${progress.total || 0} applicable tasks complete.`);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to save agency work.');
    } finally {
      setBusy(false);
    }
  };

  const saveOnboardingIntake = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await call('save_onboarding_intake', {
        onboarding_intake: onboardingIntake,
        primary_contact_name: onboardingContact.name,
        primary_contact_email: onboardingContact.email,
        primary_contact_phone: onboardingContact.phone,
        onboarding_notes: onboardingNotes
      });
      setState(s => ({ ...s, control:data.control }));
      const progress = data.onboarding || {};
      setNotice(progress.completed
        ? 'Client intake is complete. All currently applicable onboarding items are ready.'
        : `Client intake saved: ${progress.completed_count || 0}/${progress.total_count || 0} applicable item(s) complete.`);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to save client intake checklist.');
    } finally {
      setBusy(false);
    }
  };

  const parseBuildPack = () => {
    const text = buildPackText.trim();
    if (!text) throw new Error('Paste or load a Client Build Pack first.');
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Build Pack must be a JSON object.');
      return parsed;
    } catch (e) {
      throw new Error(e.message?.startsWith('Build Pack') ? e.message : 'Client Build Pack is not valid JSON.');
    }
  };

  const previewPack = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await call('preview_build_pack', { build_pack: parseBuildPack() });
      setBuildPackPreview(data.preview || null);
      setNotice(data.preview?.valid ? 'Client Build Pack validated. Review counts and warnings before applying.' : 'Build Pack validation found blocking errors.');
    } catch (e) {
      setBuildPackPreview(null);
      setError(e.message || 'Unable to validate Client Build Pack.');
    } finally {
      setBusy(false);
    }
  };

  const applyPack = async () => {
    let pack;
    try {
      pack = parseBuildPack();
    } catch (e) {
      setError(e.message);
      return;
    }
    if (!window.confirm('Apply this Client Build Pack? Matching services, service areas, intake questions, and knowledge entries will be updated by stable key instead of duplicated.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await call('apply_build_pack', { build_pack: pack, confirmation: 'APPLY BUILD PACK' });
      setBuildPackPreview(data.preview || null);
      hydrate({ ...state, ...data, manual_qa_items: state?.manual_qa_items });
      const s = data.stats || {};
      const totalCreated = Object.values(s).reduce((sum, x) => sum + Number(x?.created || 0), 0);
      const totalUpdated = Object.values(s).reduce((sum, x) => sum + Number(x?.updated || 0), 0);
      setNotice(`Client Build Pack applied: ${totalCreated} record(s) created, ${totalUpdated} updated. Public site remains in Setup.`);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to apply Client Build Pack.');
    } finally {
      setBusy(false);
    }
  };

  const saveQa = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await call('save_manual_qa', { manual_qa: manualQa, launch_notes: launchNotes });
      setState(s => ({ ...s, control: data.control, readiness: data.readiness }));
      setNotice('Manual QA checklist saved.');
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to save QA checklist.');
    } finally {
      setBusy(false);
    }
  };

  const runCheck = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await call('run_launch_check');
      setState(s => ({ ...s, control: data.control, readiness: data.readiness }));
      setNotice(data.readiness?.passed ? 'Launch readiness passed. The site is eligible for Agency Owner activation.' : 'Launch check completed with blocking items.');
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Launch check failed.');
    } finally {
      setBusy(false);
    }
  };

  const runWorkflowTest = async () => {
    if (!window.confirm('Run a full test workflow? This creates clearly marked test records through the same public lead, CRM conversion, scheduling, and completion functions used in normal operation.')) return;

    setBusy(true);
    setError('');
    setNotice('');
    setWorkflowResult(null);
    let stage = 'preparing test data';

    try {
      const [services, areas] = await Promise.all([
        base44.entities.ServiceType.filter({ active: true, publicly_advertised: true }, 'display_order', 100),
        base44.entities.ServiceArea.filter({ active: true }, 'display_order', 100)
      ]);
      if (!services?.length) throw new Error('No active public service is available for the workflow test.');
      if (!areas?.length) throw new Error('No active service area is available for the workflow test.');

      const service = services.find(s => s.slug === 'drain-cleaning') || services[0];
      const area = areas.find(a => String(a.city || '').toLowerCase() === 'allen') || areas[0];
      const now = Date.now();
      const fictionalSuffix = String(100 + (now % 100)).padStart(4, '0');
      const testPhone = `214-555-${fictionalSuffix}`;
      const testEmail = `rrs-workflow-${now}@example.com`;
      const testAddress = '100 RRS Workflow Test Ln';
      const scheduled = new Date(now + 86400000).toISOString().slice(0, 10);
      const zip = area.zip_codes?.[0] || (String(area.city || '').toLowerCase() === 'allen' ? '75002' : '00000');
      const industry = manifest?.industry_module || state?.settings?.industry_module || 'generic_service';
      const isAppliance = industry === 'appliance_repair';

      stage = 'submitting the public service request';
      const publicPayload = {
        source: 'Website Form',
        first_name: 'RRS',
        last_name: 'Workflow Test',
        phone: testPhone,
        email: testEmail,
        preferred_contact_method: 'Email',
        service_address: testAddress,
        city: area.city,
        state: area.state || 'TX',
        zip,
        service_type: service.name,
        problem_description: 'Automated RRS workflow rehearsal for a routine service request.',
        requested_date: scheduled,
        requested_window: 'Morning (8AM-12PM)',
        sms_consent: false,
        email_consent: false,
        consent_source: 'Website Book Service Form — Agency QA',
        landing_page: '/book-service',
        website_company: '',
        is_test_data: true,
        attachments: [],
        ...(isAppliance ? {
          appliance_type: service.name,
          asset_type: String(service.name || '').replace(/\s+Repair$/i, ''),
          brand: 'RRS Test Brand',
          manufacturer: 'RRS Test Brand',
          model_number: 'RRS-TEST-001',
          serial_number: 'RRS-TEST-SN',
          approximate_age: '1 year'
        } : {})
      };
      const leadRes = await base44.functions.invoke('submitLead', publicPayload);
      const leadData = leadRes?.data || leadRes || {};
      if (!leadData.success || !leadData.lead_id) throw new Error(leadData.error || 'Public lead submission did not return a lead ID.');

      stage = 'converting the lead to a customer and job';
      const conversionPayload = {
        lead_id: leadData.lead_id,
        first_name: publicPayload.first_name,
        last_name: publicPayload.last_name,
        phone: publicPayload.phone,
        email: publicPayload.email,
        preferred_contact_method: publicPayload.preferred_contact_method,
        address_line_1: publicPayload.service_address,
        loc_city: publicPayload.city,
        state: publicPayload.state,
        zip: publicPayload.zip,
        service_type: publicPayload.service_type,
        problem_description: publicPayload.problem_description,
        requested_date: publicPayload.requested_date,
        requested_window: publicPayload.requested_window,
        source: 'Website Form',
        is_test_data: true,
        allow_duplicate_open_job: true,
        ...(isAppliance ? {
          appliance_type: publicPayload.appliance_type,
          brand: publicPayload.brand,
          model_number: publicPayload.model_number,
          serial_number: publicPayload.serial_number,
          approximate_age: publicPayload.approximate_age
        } : {})
      };
      const jobRes = await base44.functions.invoke('createServiceCall', conversionPayload);
      const jobData = jobRes?.data || jobRes || {};
      if (!jobData.success || !jobData.job_id) throw new Error(jobData.error || 'Lead conversion did not return a job ID.');

      stage = 'scheduling the service visit';
      const visitRes = await base44.functions.invoke('scheduleVisit', {
        job_id: jobData.job_id,
        visit_type: 'Initial Service',
        scheduled_date: scheduled,
        arrival_window_start: '9:00 AM',
        arrival_window_end: '11:00 AM',
        technician_id: null,
        visit_notes: 'Automated RRS Phase 9 workflow rehearsal.',
        is_test_data: true
      });
      const visitData = visitRes?.data || visitRes || {};
      if (!visitData.success || !visitData.visit_id) throw new Error(visitData.error || 'Visit scheduling did not return a visit ID.');

      stage = 'completing the service visit';
      const completeRes = await base44.functions.invoke('completeVisit', {
        visit_id: visitData.visit_id,
        outcome: 'Service Completed',
        diagnosis: 'Automated QA workflow rehearsal completed successfully.',
        technician_notes: 'Agency QA test — no real customer service performed.',
        completion_notes: 'End-to-end workflow test.',
        parts: []
      });
      const completeData = completeRes?.data || completeRes || {};
      if (!completeData.success || completeData.job_status !== 'Completed') {
        throw new Error(completeData.error || `Completion returned job status ${completeData.job_status || 'unknown'}.`);
      }

      stage = 'independently verifying linked records';
      const verifyData = await call('verify_workflow_rehearsal', {
        lead_id: leadData.lead_id,
        job_id: jobData.job_id,
        visit_id: visitData.visit_id
      });
      if (!verifyData.verification?.passed) throw new Error('The workflow ran, but independent record verification did not pass.');

      setWorkflowResult(verifyData.verification);
      hydrate({ ...state, ...verifyData, manual_qa_items: state?.manual_qa_items });
      setNotice('End-to-end workflow rehearsal PASSED. Public submission, lead conversion, customer/contact/location creation, job, scheduling, completion, and CRM activity were independently verified. Test records remain flagged for review and cleanup.');
      onChanged?.();
    } catch (e) {
      setError(`Workflow rehearsal failed while ${stage}: ${e.message || 'Unknown error'} Any partial records remain test data and can be removed with Delete Test Data Only.`);
    } finally {
      setBusy(false);
    }
  };

  const rehearseLaunch = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await call('rehearse_launch');
      setRehearsal(data);
      setState(s => ({ ...s, readiness: data.readiness }));
      setNotice(data.rehearsal?.activation_would_be_allowed
        ? 'Launch rehearsal passed: activation would be allowed, but no status was changed.'
        : 'Launch rehearsal passed: activation would be blocked as expected while blockers remain. No status was changed.');
    } catch (e) {
      setError(e.message || 'Launch rehearsal failed.');
    } finally {
      setBusy(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!window.confirm('Clean duplicate factory configuration? The best active records are kept; obsolete duplicate singleton records are archived and duplicate catalog records are removed/deactivated safely.')) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await call('cleanup_factory_duplicates', { confirmation: 'CLEAN FACTORY DUPLICATES' });
      hydrate({ ...state, ...data, manual_qa_items: state?.manual_qa_items });
      const s = data.singleton_cleanup || {};
      const c = data.catalog_cleanup || {};
      setNotice(`Factory Cleanup complete: ${Number(s.business_settings_archived || 0) + Number(s.agency_controls_archived || 0)} singleton record(s) archived, ${Number(c.service_records_deleted || 0) + Number(c.service_area_records_deleted || 0)} duplicate catalog record(s) deleted, ${Number(c.service_records_deactivated || 0)} linked duplicate service record(s) safely deactivated.`);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Factory Cleanup failed.');
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    if (!window.confirm('Delete all records explicitly marked as test data? Production records are not touched.')) return;
    setBusy(true);
    setError('');
    try {
      const data = await call('purge_test_data', { confirmation: 'DELETE TEST DATA' });
      setState(s => ({ ...s, control: data.control, readiness: data.readiness }));
      const total = Object.values(data.deleted || {}).reduce((sum, n) => sum + Number(n || 0), 0);
      setNotice(`Deleted ${total} test record(s). Production records were not touched.`);
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to purge test data.');
    } finally {
      setBusy(false);
    }
  };

  const resetQa = async () => {
    if (!window.confirm('Return this client to Setup and clear launch QA confirmations? Business content and production data will remain intact.')) return;
    setBusy(true);
    setError('');
    try {
      const data = await call('reset_provisioning_state', { confirmation: 'RESET TO SETUP' });
      setManualQa({});
      setState(s => ({ ...s, control: data.control, readiness: data.readiness }));
      setNotice('Provisioning state returned to Setup. Business content and production records were preserved.');
      onChanged?.();
    } catch (e) {
      setError(e.message || 'Unable to reset provisioning state.');
    } finally {
      setBusy(false);
    }
  };

  const readiness = state?.readiness;
  const blockers = readiness?.blockers || [];
  const warnings = readiness?.warnings || [];
  const checks = readiness?.checks || [];
  const qaItems = state?.manual_qa_items || [];
  const control = state?.control || {};
  const statusClass = readiness?.passed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800';

  const configuredCount = useMemo(() => Object.values(manualQa || {}).filter(Boolean).length, [manualQa]);
  const onboardingItems = (state?.onboarding_intake_items || []).filter(item => {
    if (item.add_on === 'reputation') return manifest?.reputation_management_enabled === true;
    if (item.add_on === 'glsa') return manifest?.google_local_leads_enabled === true;
    if (item.add_on === 'voice') return manifest?.voice_ai_enabled === true;
    return true;
  });
  const onboardingCompletedCount = onboardingItems.filter(item => onboardingIntake?.[item.key] === true).length;
  const onboardingComplete = onboardingItems.length > 0 && onboardingCompletedCount === onboardingItems.length;
  const agencyWorkItems = (state?.agency_work_items || []).filter(item => {
    if (item.add_on === 'reputation') return manifest?.reputation_management_enabled === true;
    if (item.add_on === 'glsa') return manifest?.google_local_leads_enabled === true;
    if (item.add_on === 'voice') return manifest?.voice_ai_enabled === true;
    return true;
  });
  const agencyWorkCompletedCount = agencyWorkItems.filter(item => agencyWork?.[item.key] === true).length;
  const agencyWorkComplete = agencyWorkItems.length > 0 && agencyWorkCompletedCount === agencyWorkItems.length;
  const agencyWorkPhases = [...new Set(agencyWorkItems.map(item => item.phase || 'Other'))];
  const monthlyAddOnTotal = manifest ? (
    (manifest.reputation_management_enabled && manifest.reputation_management_billing_enabled !== false ? Math.max(0, Number(manifest.reputation_management_monthly_fee) || 0) : 0) +
    (manifest.google_local_leads_enabled && manifest.google_local_leads_billing_enabled !== false ? Math.max(0, Number(manifest.google_local_leads_monthly_fee) || 0) : 0) +
    (manifest.voice_ai_enabled ? Math.max(0, Number(manifest.voice_ai_monthly_fee) || 0) : 0)
  ) : 0;
  const baseRecurring = manifest ? Math.max(0, Number(manifest.base_price) || 0) : 0;
  const monthlyPackageTotal = manifest?.billing_frequency === 'Monthly' ? baseRecurring + monthlyAddOnTotal : monthlyAddOnTotal;

  if (!state || !manifest) {
    return <section className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-2 text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading provisioning…</section>;
  }

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-accent mt-0.5" />
          <div>
            <h2 className="font-bold text-slate-900">Golden Master Provisioning & Launch Readiness</h2>
            <p className="text-xs text-slate-500">Template {control.template_version || state.template_version} · {control.provisioning_status || 'Not Started'} · public site remains in Setup until Agency Owner activation.</p>
          </div>
        </div>
        <button onClick={runCheck} disabled={busy} className="inline-flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /> Run Launch Check
        </button>
      </div>

      <div className="p-5 space-y-6">
        {error && <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
        {notice && <div className="border border-green-200 bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm">{notice}</div>}

        <div className={`rounded-lg border px-4 py-3 text-sm ${statusClass}`}>
          <div className="font-bold">{readiness?.passed ? 'Launch-ready checks passed' : `${blockers.length} blocking item(s) remain`}</div>
          <div className="text-xs mt-1">{warnings.length} advisory warning(s). Activation is blocked only by red items and incomplete required QA.</div>
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">0. Client Intake & Access</h3>
              <p className="text-xs text-slate-500 mt-1">Track what the client has supplied before the build starts. Add-on-specific access items appear only when that service is selected below.</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${onboardingComplete ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
              {onboardingCompletedCount}/{onboardingItems.length} ready
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Input label="Primary Contact Name" value={onboardingContact.name} onChange={v => setOnboardingContact(c => ({ ...c, name:v }))} />
            <Input label="Primary Contact Email" value={onboardingContact.email} onChange={v => setOnboardingContact(c => ({ ...c, email:v }))} type="email" />
            <Input label="Primary Contact Phone" value={onboardingContact.phone} onChange={v => setOnboardingContact(c => ({ ...c, phone:v }))} />
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {onboardingItems.map(item => (
              <label key={item.key} className={`flex items-start gap-3 rounded-lg border p-3 ${onboardingIntake?.[item.key] ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={onboardingIntake?.[item.key] === true}
                  onChange={e => setOnboardingIntake(v => ({ ...v, [item.key]:e.target.checked }))}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.help}</span>
                </span>
              </label>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Client Intake / Waiting-On Notes</span>
            <textarea value={onboardingNotes} onChange={e => setOnboardingNotes(e.target.value)} rows={3} placeholder="Example: waiting on logo source files, registrar invitation, final service-area approval…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={saveOnboardingIntake} disabled={busy} className="inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-800 font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save Client Intake</button>
            {state?.control?.onboarding_last_saved_at && <span className="text-[11px] text-slate-400">Last saved {new Date(state.control.onboarding_last_saved_at).toLocaleString()}</span>}
            {state?.control?.onboarding_completed_at && <span className="text-[11px] font-semibold text-green-700">Intake completed {new Date(state.control.onboarding_completed_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="border-t pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Agency Work Queue</h3>
              <p className="text-xs text-slate-500 mt-1">Persistent Agency Owner checklist from clone setup through live launch. Add-on tasks appear automatically when that service is selected.</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${agencyWorkComplete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {agencyWorkCompletedCount}/{agencyWorkItems.length} complete
            </div>
          </div>

          <div className="space-y-4">
            {agencyWorkPhases.map(phase => (
              <div key={phase} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-black uppercase tracking-wide text-slate-500 mb-2">{phase}</div>
                <div className="grid gap-2 md:grid-cols-2">
                  {agencyWorkItems.filter(item => (item.phase || 'Other') === phase).map(item => (
                    <label key={item.key} className={`flex items-start gap-3 rounded-lg border p-3 ${agencyWork?.[item.key] ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
                      <input type="checkbox" className="mt-1" checked={agencyWork?.[item.key] === true} onChange={e => setAgencyWork(v => ({ ...v, [item.key]:e.target.checked }))} />
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">{item.label}</span>
                        <span className="mt-0.5 block text-xs leading-5 text-slate-500">{item.help}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label className="mt-3 block">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Agency Work / Blocker Notes</span>
            <textarea value={agencyWorkNotes} onChange={e => setAgencyWorkNotes(e.target.value)} rows={3} placeholder="Example: waiting on Twilio number purchase, client logo source file, Google Business Profile invite, final DNS cutover window…" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={saveAgencyWork} disabled={busy} className="inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-800 font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save Agency Work</button>
            {control.agency_work_last_saved_at && <span className="text-[11px] text-slate-400">Last saved {new Date(control.agency_work_last_saved_at).toLocaleString()}</span>}
            {control.agency_work_completed_at && <span className="text-[11px] font-semibold text-green-700">Agency queue completed {new Date(control.agency_work_completed_at).toLocaleDateString()}</span>}
          </div>
        </div>

        <div className="border-t pt-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1">1. Client Foundation</h3>
          <p className="text-xs text-slate-500 mb-3">Apply identity and module configuration first. This intentionally does not create fake services, service areas, reviews, customers, jobs, or technicians.</p>
          <div className="grid md:grid-cols-3 gap-3">
            <Input label="Business Name *" value={manifest.business_name} onChange={v => update('business_name', v)} />
            <Input label="Agency Client Name *" value={manifest.client_name} onChange={v => update('client_name', v)} />
            <Input label="Tenant Key" value={manifest.tenant_key} onChange={v => update('tenant_key', v)} placeholder="auto-generated if blank" />
            <Input label="Primary Domain" value={manifest.primary_domain} onChange={v => update('primary_domain', v)} placeholder="example.com" />
            <Input label="Website URL" value={manifest.website_url} onChange={v => update('website_url', v)} placeholder="https://example.com" />
            <Input label="Service Region *" value={manifest.service_region_label} onChange={v => update('service_region_label', v)} placeholder="Allen, Lucas, McKinney and surrounding areas" />
            <Input label="Business Phone *" value={manifest.phone} onChange={v => update('phone', v)} />
            <Input label="Business Email *" value={manifest.email} onChange={v => update('email', v)} type="email" />
            <Input label="Customer Support Email" value={manifest.customer_support_email} onChange={v => update('customer_support_email', v)} type="email" placeholder="Falls back to Business Email" />
            <Input label="Timezone" value={manifest.timezone} onChange={v => update('timezone', v)} />
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Industry Module</span>
              <select value={manifest.industry_module} onChange={e => update('industry_module', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {INDUSTRIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <Input label="Primary Business Category" value={manifest.primary_business_category} onChange={v => update('primary_business_category', v)} />
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm self-end">
              <input type="checkbox" checked={!!manifest.asset_tracking_enabled} onChange={e => update('asset_tracking_enabled', e.target.checked)} />
              Core asset tracking
            </label>
            <Input label="Asset Label — Singular" value={manifest.asset_label_singular} onChange={v => update('asset_label_singular', v)} />
            <Input label="Asset Label — Plural" value={manifest.asset_label_plural} onChange={v => update('asset_label_plural', v)} />
            <Input label="Manufacturer Label" value={manifest.manufacturer_label} onChange={v => update('manufacturer_label', v)} />
            <div className="md:col-span-3">
              <Input label="Optional Module Keys" value={moduleText} onChange={setModuleText} placeholder="customer_portal, project_estimator" />
              <p className="text-[11px] text-slate-400 mt-1">Flags document enabled custom modules; a module must be implemented before the flag alone has any effect.</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Plan & Paid Add-ons</h4>
                <p className="mt-1 text-xs text-slate-500">Choose the commercial package during onboarding. External Google/phone automation stays off until the connection is tested.</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-right">
                <div className="text-[10px] uppercase tracking-wide text-slate-500">Monthly package</div>
                <div className="text-xl font-black text-slate-900">${monthlyPackageTotal.toFixed(2)}</div>
                {manifest.billing_frequency !== 'Monthly' && <div className="text-[10px] text-slate-400">Add-ons only; base plan bills {String(manifest.billing_frequency || 'Monthly').toLowerCase()}.</div>}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <Input label="Plan Name" value={manifest.plan_name} onChange={v => update('plan_name', v)} />
              <Input label="Base Price" value={manifest.base_price} onChange={v => update('base_price', v)} type="number" />
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Billing Frequency</span>
                <select value={manifest.billing_frequency || 'Monthly'} onChange={e => update('billing_frequency', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                  {['Monthly','Quarterly','Annual'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <Input label="Billing Email" value={manifest.billing_email} onChange={v => update('billing_email', v)} type="email" />
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={!!manifest.reputation_management_enabled} onChange={e => update('reputation_management_enabled', e.target.checked)} />
                  <span><span className="block text-sm font-bold text-slate-900">Reputation Management</span><span className="block text-xs text-slate-500">Review requests, monitoring, AI replies, approvals and website review publishing.</span></span>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input label="Monthly Fee" value={manifest.reputation_management_monthly_fee} onChange={v => update('reputation_management_monthly_fee', v)} type="number" />
                  <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">
                    <input type="checkbox" checked={manifest.reputation_management_billing_enabled !== false} onChange={e => update('reputation_management_billing_enabled', e.target.checked)} />
                    Bill monthly
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Google review sync and auto-post remain off until Business Profile access is connected and tested.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={!!manifest.google_local_leads_enabled} onChange={e => update('google_local_leads_enabled', e.target.checked)} />
                  <span><span className="block text-sm font-bold text-slate-900">Google Local Services</span><span className="block text-xs text-slate-500">Lead sync, ROI attribution, feedback, campaign management and AI optimization.</span></span>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input label="Monthly Fee" value={manifest.google_local_leads_monthly_fee} onChange={v => update('google_local_leads_monthly_fee', v)} type="number" />
                  <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">
                    <input type="checkbox" checked={manifest.google_local_leads_billing_enabled !== false} onChange={e => update('google_local_leads_billing_enabled', e.target.checked)} />
                    Bill monthly
                  </label>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Auto-sync and Google lead feedback remain off until the Google Ads/LSA connection is validated.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1" checked={!!manifest.voice_ai_enabled} onChange={e => update('voice_ai_enabled', e.target.checked)} />
                  <span><span className="block text-sm font-bold text-slate-900">AI Voice Receptionist</span><span className="block text-xs text-slate-500">Website/phone voice service with a fixed monthly fee and optional usage billing.</span></span>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Input label="Monthly Fee" value={manifest.voice_ai_monthly_fee} onChange={v => update('voice_ai_monthly_fee', v)} type="number" />
                  <Input label="GPT-Live Cost / Min" value={manifest.voice_ai_provider_cost_per_minute} onChange={v => update('voice_ai_provider_cost_per_minute', v)} type="number" />
                  <Input label="Telephony Cost / Min" value={manifest.voice_ai_telephony_cost_per_minute} onChange={v => update('voice_ai_telephony_cost_per_minute', v)} type="number" />
                  <Input label="Backend Allowance / Min" value={manifest.voice_ai_backend_cost_allowance_per_minute} onChange={v => update('voice_ai_backend_cost_allowance_per_minute', v)} type="number" />
                  <Input label="Usage Markup %" value={manifest.voice_ai_markup_percent} onChange={v => update('voice_ai_markup_percent', v)} type="number" />
                </div>
                <label className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">
                  <input type="checkbox" checked={manifest.voice_ai_per_minute_billing_enabled !== false} onChange={e => update('voice_ai_per_minute_billing_enabled', e.target.checked)} />
                  Bill usage by the minute
                </label>
                <div className="mt-3 grid gap-2">
                  <Input label="OpenAI Project ID (non-secret)" value={manifest.voice_ai_openai_project_id} onChange={v => update('voice_ai_openai_project_id', v)} placeholder="proj_..." />
                  <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Default Voice</span><select value={manifest.voice_ai_voice || 'Gleam'} onChange={e => update('voice_ai_voice', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="Gleam">Gleam — North American feminine</option><option value="Meridian">Meridian — North American masculine</option><option value="Delta">Delta — Southern U.S. feminine</option><option value="Cinder">Cinder — Southern U.S. masculine</option></select></label>
                  <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={!!manifest.voice_ai_qualification_enabled} onChange={e => update('voice_ai_qualification_enabled', e.target.checked)} /> Qualify caller before creating CRM request</label>
                  <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={!!manifest.voice_ai_decline_personal_orders} onChange={e => update('voice_ai_decline_personal_orders', e.target.checked)} /> Decline personal / individual orders</label>
                  <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={!!manifest.voice_ai_local_sports_only} onChange={e => update('voice_ai_local_sports_only', e.target.checked)} /> Sports-team inquiries must be local</label>
                  <Input label="Target Customer Types" value={(manifest.voice_ai_target_customer_types || []).join(', ')} onChange={v => update('voice_ai_target_customer_types', String(v || '').split(',').map(x => x.trim()).filter(Boolean))} placeholder="Business / Corporate, Local Sports Team" />
                  <Input label="Hard Minimum Quantity (0 = none)" value={manifest.voice_ai_minimum_quantity} onChange={v => update('voice_ai_minimum_quantity', v)} type="number" />
                  <label className="block"><span className="block text-xs font-semibold text-slate-600 mb-1">Qualification Notes</span><textarea rows={3} value={manifest.voice_ai_qualification_notes || ''} onChange={e => update('voice_ai_qualification_notes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Who is a fit, who should be declined, local/shipping rules, etc." /></label>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">Website and phone channels remain disabled until the voice runtime/SIP connection is tested. API key, webhook signing secret and sideband shared secret remain secure owner setup items.</p>
              </div>
            </div>
          </div>

          <button onClick={apply} disabled={busy || !manifest.business_name || !manifest.client_name} className="mt-3 inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Apply Foundation & Package</button>
        </div>

        <div className="border-t pt-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1">2. Client Build Pack</h3>
          <p className="text-xs text-slate-500 mb-3">Optional factory path for agency-built clients. Paste one validated JSON pack to upsert business settings, SEO migration redirects, services, service areas, intake questions, and knowledge-base entries. Re-running the same pack updates matching stable keys instead of duplicating them.</p>
          <textarea
            value={buildPackText}
            onChange={e => { setBuildPackText(e.target.value); setBuildPackPreview(null); }}
            rows={12}
            spellCheck={false}
            placeholder="Paste Client Build Pack JSON here"
            className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setBuildPackText(BUILD_PACK_TEMPLATE); setBuildPackPreview(null); }} disabled={busy} className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">Load Blank Template</button>
            <button type="button" onClick={previewPack} disabled={busy || !buildPackText.trim()} className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">Validate Pack</button>
            <button type="button" onClick={applyPack} disabled={busy || !buildPackText.trim() || buildPackPreview?.valid !== true} className="bg-brand-accent text-brand-dark rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50">Apply Build Pack</button>
          </div>
          {buildPackPreview && (
            <div className={`mt-3 rounded-lg border p-3 text-xs ${buildPackPreview.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="font-bold text-slate-800">{buildPackPreview.valid ? 'Valid Build Pack' : 'Build Pack has errors'}</div>
              <div className="mt-1 text-slate-600">
                {buildPackPreview.counts?.services || 0} services · {buildPackPreview.counts?.service_areas || 0} service areas · {buildPackPreview.counts?.redirects || 0} redirects · {buildPackPreview.counts?.intake_questions || 0} intake questions · {buildPackPreview.counts?.knowledge || 0} knowledge entries · {buildPackPreview.counts?.settings_fields || 0} additional settings
              </div>
              {(buildPackPreview.errors || []).map((msg, i) => <div key={`e-${i}`} className="mt-1 text-red-700">Blocker: {msg}</div>)}
              {(buildPackPreview.warnings || []).map((msg, i) => <div key={`w-${i}`} className="mt-1 text-amber-700">Warning: {msg}</div>)}
            </div>
          )}
        </div>

        <div className="border-t pt-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1">3. Automated Launch Checks</h3>
          <p className="text-xs text-slate-500 mb-3">These are evaluated from the actual client app data and settings.</p>
          <div className="grid md:grid-cols-2 gap-2">
            {checks.map(item => (
              <div key={item.key} className="flex items-start gap-2 border border-slate-200 rounded-lg p-3">
                <StatusIcon status={item.status} />
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.message}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={runWorkflowTest} disabled={busy} className="inline-flex items-center gap-2 border border-green-300 bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">
              <PlayCircle className="w-4 h-4" /> Run E2E Workflow Test
            </button>
            <button onClick={rehearseLaunch} disabled={busy} className="inline-flex items-center gap-2 border border-slate-300 bg-white text-slate-700 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">
              <ShieldCheck className="w-4 h-4" /> Rehearse Launch
            </button>
            {(readiness?.counts?.stored_duplicate_service_slugs > 0 || readiness?.counts?.stored_duplicate_service_area_slugs > 0 || readiness?.counts?.active_business_settings_records > 1 || readiness?.counts?.active_agency_control_records > 1) && (
              <button onClick={cleanupDuplicates} disabled={busy} className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 text-amber-800 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">
                <RefreshCw className="w-4 h-4" /> Factory Cleanup
              </button>
            )}
            {readiness?.counts?.test_data_total > 0 && (
              <button onClick={purge} disabled={busy} className="inline-flex items-center gap-2 border border-red-300 bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50">
                <Trash2 className="w-4 h-4" /> Delete Test Data Only
              </button>
            )}
          </div>

          {workflowResult && (
            <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-900">
              <div className="font-bold">End-to-End Workflow Rehearsal — PASS</div>
              <div className="mt-1">
                Verified Website Form → Lead → Customer / Contact / Location → Job → Appointment → Service Completed.
              </div>
              <div className="mt-2">
                Record IDs: Lead {workflowResult.records?.lead_id} · Job {workflowResult.records?.job_id} · Visit {workflowResult.records?.visit_id}
              </div>
              <div className="mt-2">{(workflowResult.checks || []).filter(x => x.pass).length}/{(workflowResult.checks || []).length} verification checks passed. Use Delete Test Data Only after reviewing the result.</div>
            </div>
          )}

          {rehearsal && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <div className="font-bold text-slate-800">Launch Rehearsal</div>
              <div className="mt-1">
                Activation would be <strong>{rehearsal.rehearsal?.activation_would_be_allowed ? 'ALLOWED' : 'BLOCKED'}</strong> ·
                {' '}{rehearsal.rehearsal?.blocker_count || 0} blocker(s) · {rehearsal.rehearsal?.warning_count || 0} warning(s) ·
                {' '}site status stayed <strong>{rehearsal.rehearsal?.site_status_unchanged}</strong>.
              </div>
              <div className="mt-2">
                Roles: {rehearsal.role_audit?.counts?.agency_owners || 0} Agency Owner · {rehearsal.role_audit?.counts?.client_admins || 0} Client Admin · {rehearsal.role_audit?.counts?.office_staff || 0} Office Staff · {rehearsal.role_audit?.counts?.technicians || 0} Technician
              </div>
              {(rehearsal.rehearsal?.blocker_keys || []).length > 0 && (
                <div className="mt-2">Blocking keys: {(rehearsal.rehearsal.blocker_keys || []).join(', ')}</div>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-5">
          <h3 className="font-bold text-sm text-slate-900 mb-1">4. Manual QA Checklist</h3>
          <p className="text-xs text-slate-500 mb-3">{configuredCount}/{qaItems.length} confirmed. Visual quality, permissions, integrations, SEO/domain review, and client approval remain manual. The service-request and lead-to-job items can be checked automatically after a successful E2E Workflow Test.</p>
          <div className="grid md:grid-cols-2 gap-2">
            {qaItems.map(item => (
              <label key={item.key} className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 text-sm">
                <input type="checkbox" checked={manualQa[item.key] === true} onChange={e => setManualQa(q => ({ ...q, [item.key]: e.target.checked }))} />
                {item.label}
              </label>
            ))}
          </div>
          <textarea value={launchNotes} onChange={e => setLaunchNotes(e.target.value)} rows={3} placeholder="Launch / QA notes (optional)" className="mt-3 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={saveQa} disabled={busy} className="inline-flex items-center gap-2 bg-brand-accent text-brand-dark font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"><Save className="w-4 h-4" /> Save QA</button>
            <button onClick={resetQa} disabled={busy} className="inline-flex items-center gap-2 border border-slate-300 text-slate-600 font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-50">Reset to Setup</button>
          </div>
        </div>

        <div className="border-t pt-5 text-xs text-slate-500">
          <strong>Launch rule:</strong> the existing Agency Owner Activate button performs the same backend readiness check. A public site cannot be activated while blocking items remain.
        </div>
      </div>
    </section>
  );
}
