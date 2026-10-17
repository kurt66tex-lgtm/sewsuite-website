import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Upload, X, Loader2, CheckCircle2, AlertTriangle, Info, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

const CORE_ATTACHMENT_TYPES = [
  'Equipment Photo',
  'Identification / Data Label',
  'Site / Space Photo',
  'Concept / Inspiration',
  'Problem Area',
  'Leak',
  'Installation / Connection',
  'Other'
];

const APPLIANCE_ATTACHMENT_TYPES = [
  'Appliance Photo',
  'Model / Serial Label',
  'Error Code Screen',
  'Problem Area',
  'Leak',
  'Installation / Connection',
  'Other'
];

const TIME_WINDOWS = ['Morning (8AM-12PM)', 'Afternoon (12PM-5PM)', 'Evening (5PM-7PM)', 'First Available'];

export default function BookService() {
  const { settings } = useBusinessSettings();
  const [services, setServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [areas, setAreas] = useState([]);
  const [intakeQuestionRecords, setIntakeQuestionRecords] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({
    service_type: '', asset_type: '', manufacturer: '', equipment_information: '',
    appliance_type: '', brand: '', model_number: '', serial_number: '', approximate_age: '',
    error_code: '', problem_description: '', model_unknown: false,
    requested_date: '', requested_window: '',
    service_address: '', city: '', state: 'TX', zip: '',
    first_name: '', last_name: '', phone: '', email: '',
    preferred_contact_method: 'Phone', sms_consent: false, email_consent: false,
    intake_answers: {},
    website_company: ''
  });
  const [photos, setPhotos] = useState([]); // {file_uri, file_name, file_type, file_size, attachment_type, preview}
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // {success, safety_flag}
  const [error, setError] = useState(null);

  const photoLimit = settings?.photo_limit_per_conversation || 5;
  const phone = settings?.phone || '';
  const businessName = settings?.business_name || 'Service Business';
  const isApplianceModule = settings?.industry_module === 'appliance_repair';
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const assetTrackingEnabled = settings?.asset_tracking_enabled === true && !isApplianceModule;
  const assetLabel = settings?.asset_label_singular || 'Equipment';
  const manufacturerLabel = settings?.manufacturer_label || 'Manufacturer / Brand';
  const attachmentTypes = isCustomApparel ? ['Logo / Artwork','Product / Garment Reference','Concept / Inspiration','Existing Decoration','Other'] : (isApplianceModule ? APPLIANCE_ATTACHMENT_TYPES : CORE_ATTACHMENT_TYPES);

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceType.filter({ publicly_advertised: true }, 'display_order', 50),
      base44.entities.Brand.filter({ active: true }, 'display_order', 100),
      base44.entities.ServiceArea.filter({ active: true }, 'display_order', 50),
      base44.entities.ServiceIntakeQuestion.filter({ active: true }, 'display_order', 200).catch(() => [])
    ]).then(([s, b, a, q]) => { setServices(s); setBrands(b); setAreas(a); setIntakeQuestionRecords(q || []); }).catch(() => {});
  }, []);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const updateIntake = (id, v) => setForm(f => ({ ...f, intake_answers: { ...f.intake_answers, [id]: v } }));

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > photoLimit) {
      setError(`You can upload up to ${photoLimit} ${isCustomApparel ? 'artwork or reference files' : 'photos'}.`);
      return;
    }
    setError('Artwork uploads are not yet connected in this comparison preview. Please use www.sewsuite.com to submit your files.');
    if (e.target) e.target.value = '';
    return;
    setUploading(true);
    setError(null);
    const newPhotos = [];
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" exceeds 10MB and was skipped.`);
        continue;
      }
      try {
        const res = await base44.integrations.Core.UploadPrivateFile({ file });
        const data = res.data || res;
        newPhotos.push({
          file_uri: data.file_uri,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          attachment_type: isCustomApparel ? 'Logo / Artwork' : (isApplianceModule ? 'Appliance Photo' : (assetTrackingEnabled ? 'Equipment Photo' : 'Site / Space Photo')),
          preview: URL.createObjectURL(file)
        });
      } catch (err) {
        setError(`Upload failed for "${file.name}". ${isCustomApparel ? 'You can still submit your quote request, but the file will not be attached.' : 'Your service request will still go through.'}`);
      }
    }
    setPhotos(p => [...p, ...newPhotos]);
    setUploading(false);
  };

  const removePhoto = (idx) => {
    setPhotos(p => p.filter((_, i) => i !== idx));
  };

  const setPhotoType = (idx, type) => {
    setPhotos(p => p.map((ph, i) => i === idx ? { ...ph, attachment_type: type } : ph));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('Quote submissions are not yet enabled on the comparison website. Please submit your request at www.sewsuite.com until we complete migration testing.');
    return;
    setError(null);
    setSubmitting(true);
    try {
      const query = new URLSearchParams(window.location.search);
      const safeReferrer = (() => {
        if (!document.referrer) return null;
        try { const u = new URL(document.referrer); return u.origin + u.pathname; } catch { return null; }
      })();
      const payload = {
        source: 'Website Form',
        ...form,
        website_company: form.website_company || '',
        consent_source: isCustomApparel ? 'Website Request Quote Form' : 'Website Book Service Form',
        landing_page: window.location.pathname,
        referrer: safeReferrer,
        utm_source: query.get('utm_source') || null,
        utm_medium: query.get('utm_medium') || null,
        utm_campaign: query.get('utm_campaign') || null,
        attachments: photos.map(p => ({
          file_uri: p.file_uri,
          file_name: p.file_name,
          file_type: p.file_type,
          file_size: p.file_size,
          attachment_type: p.attachment_type
        }))
      };
      delete payload.model_unknown;
      const res = await base44.functions.invoke('submitLead', payload);
      const data = res.data || res;
      if (data.success) {
        setResult({ success: true, safety_flag: data.safety_flag, out_of_area: !!data.out_of_area });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError(data.error || 'Something went wrong. Please call us.');
      }
    } catch (err) {
      setError(phone ? 'We could not submit your request. Please call us at ' + phone + '.' : 'We could not submit your request. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">{isCustomApparel ? 'Quote Request Received' : (result.out_of_area ? 'Outside Our Current Service Area' : 'Service Request Received')}</h1>
          <p className="mt-3 text-slate-600">
            {isCustomApparel
              ? `Thank you — we've received your project details. A ${businessName} team member will review the request and contact you about your quote.`
              : result.out_of_area
                ? `Thank you for checking with ${businessName}. The address you entered is outside our current service area, so we won't be able to schedule this request right now.`
                : `Thank you — we've received your service request. A ${businessName} team member will contact you to confirm your appointment. Your requested date and time is not confirmed until we reach you.`}
          </p>
          {result.safety_flag && (
            <div className="mt-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-left text-sm text-red-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>We noticed a possible safety concern in your description. If you smell a strong gas odor, see smoke or fire, or are in immediate danger, leave the area and contact the appropriate emergency service or utility. Do not attempt unsafe repairs yourself.</span>
            </div>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center gap-2 text-slate-900 font-semibold px-5 py-2.5 rounded-lg border border-slate-300"><Phone className="w-4 h-4" /> Call {phone}</a>}
            <Link to="/" className="inline-flex items-center gap-2 text-brand-dark font-semibold px-5 py-2.5 rounded-lg bg-brand-accent">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  const managedGeneralQuestions = intakeQuestionRecords
    .filter(q => q.active !== false && !q.service_type_id)
    .map(q => ({
      id: q.id,
      key: q.question_key || q.id,
      label: q.question_text,
      type: q.answer_type || 'text',
      options: q.options || [],
      required: !!q.required,
      photo_request_text: q.photo_request_text || ''
    }));

  const managedServiceQuestions = intakeQuestionRecords
    .filter(q => q.active !== false && selectedService?.id && q.service_type_id === selectedService.id)
    .map(q => ({
      id: q.id,
      key: q.question_key || q.id,
      label: q.question_text,
      type: q.answer_type || 'text',
      options: q.options || [],
      required: !!q.required,
      photo_request_text: q.photo_request_text || ''
    }));

  const legacyServiceQuestions = (selectedService?.intake_questions || []).map(q => ({
    id: `legacy-${q.id || q.label}`,
    key: q.id || String(q.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    label: q.label,
    type: q.type === 'select' ? 'choice' : (q.type || 'text'),
    options: q.options || [],
    required: !!q.required,
    photo_request_text: ''
  }));

  const intakeQuestions = [
    ...managedGeneralQuestions,
    ...(managedServiceQuestions.length > 0 ? managedServiceQuestions : legacyServiceQuestions)
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{isCustomApparel ? 'Request a Quote' : isApplianceModule ? 'Book Appliance Repair' : 'Request Service'}</h1>
          <p className="mt-2 text-slate-600">{isCustomApparel ? 'Tell us about your project, quantity, timing, and artwork. Upload your logo or reference files when available.' : isApplianceModule ? "Tell us what's going on. The more we know up front, the better prepared we'll be for the visit." : "Tell us what you need help with. The more useful information you provide, the better prepared the team can be."}</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          {/* Service / niche intake */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-brand-accent text-xs flex items-center justify-center bg-brand-dark">1</span> {isCustomApparel ? 'Project Details' : isApplianceModule ? 'Appliance' : 'Service Details'}</h2>

            {isApplianceModule ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Appliance type *</label>
                    <select required value={form.appliance_type} onChange={(e) => {
                      const value = e.target.value;
                      setForm(f => ({
                        ...f,
                        appliance_type: value,
                        service_type: value,
                        asset_type: value ? value.replace(/\s+Repair$/i, '') : '',
                        intake_answers: {}
                      }));
                      setSelectedService(services.find(s => s.name === value) || null);
                    }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none">
                      <option value="">Select…</option>
                      {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                    <input list="brand-list" value={form.brand} onChange={(e) => { update('brand', e.target.value); update('manufacturer', e.target.value); }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="e.g. Samsung" />
                    <datalist id="brand-list">{brands.map(b => <option key={b.id} value={b.name} />)}</datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Model number</label>
                    <input value={form.model_number} onChange={(e) => update('model_number', e.target.value)} disabled={form.model_unknown} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none disabled:bg-slate-100" placeholder="e.g. RF28HMEDBSR" />
                    <label className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                      <input type="checkbox" checked={form.model_unknown} onChange={(e) => update('model_unknown', e.target.checked)} /> I don't know the model number
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Serial number</label>
                    <input value={form.serial_number} onChange={(e) => update('serial_number', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Error code (if any)</label>
                    <input value={form.error_code} onChange={(e) => update('error_code', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Approximate age</label>
                    <input value={form.approximate_age} onChange={(e) => update('approximate_age', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="e.g. 5 years" />
                  </div>
                </div>
                {form.model_unknown && (
                  <div className="mt-3 flex items-start gap-2 bg-blue-50 rounded-lg p-3 text-xs text-slate-700">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand-accent" />
                    <span>If possible, upload a photo of the model/serial label below. That can help the team prepare before the visit.</span>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{isCustomApparel ? 'Project type *' : 'Service needed *'}</label>
                  <select required value={form.service_type} onChange={(e) => {
                    const value = e.target.value;
                    setForm(f => ({ ...f, service_type: value, intake_answers: {} }));
                    setSelectedService(services.find(s => s.name === value) || null);
                  }} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none">
                    <option value="">Select…</option>
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                {assetTrackingEnabled && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{assetLabel} type *</label>
                      <input required value={form.asset_type} onChange={(e) => update('asset_type', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{manufacturerLabel}</label>
                      <input value={form.manufacturer} onChange={(e) => update('manufacturer', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Model number</label>
                      <input value={form.model_number} onChange={(e) => update('model_number', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Serial number</label>
                      <input value={form.serial_number} onChange={(e) => update('serial_number', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Equipment / asset information</label>
                      <input value={form.equipment_information} onChange={(e) => update('equipment_information', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder="Location, age, condition, or anything else that may help" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">{isCustomApparel ? 'Project description *' : 'Problem / project description *'}</label>
              <textarea required value={form.problem_description} onChange={(e) => update('problem_description', e.target.value)} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" placeholder={isCustomApparel ? 'What would you like us to create? Include approximate quantity, products, decoration needs, colors, sizes, and desired completion date when known.' : isApplianceModule ? 'What is the appliance doing or not doing?' : 'What do you need help with?'} />
            </div>

            {intakeQuestions.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">A few more questions</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {intakeQuestions.map(q => (
                    <div key={q.id}>
                      {q.type === 'photo' ? (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-slate-700">
                          <div className="font-medium">{q.label}{q.required ? ' *' : ''}</div>
                          <div className="text-xs mt-1 text-slate-600">{q.photo_request_text || 'If possible, include a useful photo in the Photos section below.'}</div>
                        </div>
                      ) : (
                        <>
                          <label className="block text-sm font-medium text-slate-700 mb-1">{q.label}{q.required ? ' *' : ''}</label>
                          {q.type === 'choice' ? (
                            <select required={q.required} value={form.intake_answers[q.key] || ''} onChange={(e) => updateIntake(q.key, e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none">
                              <option value="">Select…</option>
                              {(q.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : q.type === 'yes_no' ? (
                            <select required={q.required} value={form.intake_answers[q.key] || ''} onChange={(e) => updateIntake(q.key, e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none">
                              <option value="">Select…</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          ) : (
                            <input type={q.type === 'number' ? 'number' : 'text'} required={q.required} value={form.intake_answers[q.key] || ''} onChange={(e) => updateIntake(q.key, e.target.value)} placeholder={q.key === 'desired_completion_date' ? 'e.g. Nov 15, or before an event' : q.key === 'approximate_quantity' ? 'e.g. 25' : undefined} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Photos section */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-brand-accent text-xs flex items-center justify-center bg-brand-dark">2</span> {isCustomApparel ? 'Artwork / Reference Files' : 'Photos'}</h2>
            <p className="text-sm text-slate-600 mb-3">{isCustomApparel ? 'Upload your logo, artwork, garment/product reference, or inspiration images when available.' : isApplianceModule ? 'If you can, upload a clear photo of the appliance and model/serial label. This can help the team prepare before the visit.' : 'Upload photos of the equipment, problem area, property, or project details that may help us understand the request.'} JPG, PNG or WEBP, up to 10MB each, max {photoLimit} files.</p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-6 cursor-pointer hover:border-brand-accent transition-colors">
              {uploading ? <Loader2 className="w-6 h-6 animate-spin text-slate-400" /> : <Upload className="w-6 h-6 text-slate-400" />}
              <span className="text-sm text-slate-600 mt-2">{isCustomApparel ? 'Choose artwork or reference images' : 'Click to upload photos'}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileSelect} disabled={uploading || photos.length >= photoLimit} />
            </label>
            {photos.length > 0 && (
              <div className="mt-4 space-y-3">
                {photos.map((p, i) => (
                  <div key={i} className="flex gap-3 items-center border border-slate-200 rounded-lg p-2">
                    <img src={p.preview} alt={p.file_name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 truncate">{p.file_name}</div>
                      <select value={p.attachment_type} onChange={(e) => setPhotoType(i, e.target.value)} className="mt-1 w-full text-xs border border-slate-300 rounded px-2 py-1">
                        {attachmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <button type="button" onClick={() => removePhoto(i)} className="text-slate-400 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Appointment preference */}
          {!isCustomApparel && <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-brand-accent text-xs flex items-center justify-center bg-brand-dark">3</span> Appointment Preference</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred date</label>
                <input type="date" value={form.requested_date} onChange={(e) => update('requested_date', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred time window</label>
                <select value={form.requested_window} onChange={(e) => update('requested_window', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none">
                  <option value="">Select…</option>
                  {TIME_WINDOWS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 flex items-start gap-1.5"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> Your requested date/time is not confirmed until {businessName} confirms the appointment with you.</p>
          </section>}

          {/* Service location */}
          {!isCustomApparel && <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-brand-accent text-xs flex items-center justify-center bg-brand-dark">4</span> Service Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Street address *</label>
                <input required value={form.service_address} onChange={(e) => update('service_address', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                  <input required list="city-list" value={form.city} onChange={(e) => update('city', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  <datalist id="city-list">{areas.map(a => <option key={a.id} value={a.city} />)}</datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input value={form.state} onChange={(e) => update('state', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ZIP *</label>
                  <input required value={form.zip} onChange={(e) => update('zip', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                </div>
              </div>
            </div>
          </section>}

          {/* Customer */}
          <section className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full text-brand-accent text-xs flex items-center justify-center bg-brand-dark">{isCustomApparel ? '3' : '5'}</span> Your Contact Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First name *</label>
                <input required value={form.first_name} onChange={(e) => update('first_name', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last name *</label>
                <input required value={form.last_name} onChange={(e) => update('last_name', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                <input required type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred contact method</label>
                <select value={form.preferred_contact_method} onChange={(e) => update('preferred_contact_method', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none">
                  <option>Phone</option><option value="SMS">Text Message (SMS)</option><option>Email</option>
                </select>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={form.sms_consent} onChange={(e) => update('sms_consent', e.target.checked)} className="mt-0.5" />
                <span>I consent to receive text messages (SMS) about my {isCustomApparel ? 'quote/project request' : 'service request'}. Message/data rates may apply. I can reply STOP to opt out.</span>
              </label>
              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={form.email_consent} onChange={(e) => update('email_consent', e.target.checked)} className="mt-0.5" />
                <span>I agree to receive additional email updates about my {isCustomApparel ? 'quote/project request' : 'service request'}. You will receive a one-time request confirmation by email regardless of this selection.</span>
              </label>
              <p className="text-xs text-slate-500">See our <Link to="/privacy-policy" className="font-semibold underline underline-offset-2 hover:text-slate-900">Privacy Policy</Link> for how request information is used and protected.</p>
            </div>
          </section>

          {/* Honeypot — hidden from humans, bots fill it */}
          <div className="absolute left-[-9999px] top-auto" aria-hidden="true">
            <label>Company website (leave blank)</label>
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website_company || ''}
              onChange={(e) => update('website_company', e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submitting || uploading} className="flex-1 inline-flex items-center justify-center gap-2 text-brand-dark font-semibold px-6 py-3 rounded-lg disabled:opacity-60 bg-brand-accent">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calendar className="w-5 h-5" />}
              {submitting ? 'Submitting…' : (isCustomApparel ? 'Submit Quote Request' : 'Submit Service Request')}
            </button>
            {phone && <a href={`tel:${phone.replace(/[^0-9]/g, '')}`} className="inline-flex items-center justify-center gap-2 text-slate-900 font-semibold px-6 py-3 rounded-lg border border-slate-300">
              <Phone className="w-4 h-4" /> {phone}
            </a>}
          </div>
        </form>
      </div>
    </div>
  );
}