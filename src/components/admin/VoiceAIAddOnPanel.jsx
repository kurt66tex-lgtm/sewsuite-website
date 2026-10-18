import { useEffect } from 'react';
import { Bot, DollarSign, Plus, Trash2 } from 'lucide-react';

const DAYS = [['mon','Mon'],['tue','Tue'],['wed','Wed'],['thu','Thu'],['fri','Fri'],['sat','Sat'],['sun','Sun']];
const VOICES = [
  { value:'gleam', label:'Gleam — North American · Feminine' },
  { value:'meridian', label:'Meridian — North American · Masculine' },
  { value:'delta', label:'Delta — Southern U.S. · Feminine' },
  { value:'cinder', label:'Cinder — Southern U.S. · Masculine' },
  { value:'quartz', label:'Quartz — Australian · Feminine' },
  { value:'ripple', label:'Ripple — Australian · Masculine' },
  { value:'vesper', label:'Vesper — British · Masculine' },
  { value:'willow', label:'Willow — Irish · Feminine' },
  { value:'stone', label:'Stone — Irish · Masculine' }
];

function Toggle({ label, checked, onChange, hint }) {
  return <label className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
    <input type="checkbox" className="mt-1" checked={!!checked} onChange={e => onChange(e.target.checked)} />
    <span><span className="block text-sm font-semibold text-slate-800">{label}</span>{hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}</span>
  </label>;
}

function Field({ label, value, onChange, type = 'text', step, hint, readOnly = false }) {
  return <label className="block">
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    <input type={type} step={step} value={value ?? ''} readOnly={readOnly}
      onChange={e => onChange?.(type === 'number' ? Number(e.target.value) : e.target.value)}
      className={'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm ' + (readOnly ? 'bg-slate-50 text-slate-600' : 'bg-white')} />
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>;
}

function Select({ label, value, onChange, options, hint }) {
  return <label className="block">
    <span className="block text-xs font-semibold text-slate-600 mb-1">{label}</span>
    <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
      {options.map(o => { const value = typeof o === 'string' ? o : o.value; const label = typeof o === 'string' ? o : o.label; return <option key={value} value={value}>{label}</option>; })}
    </select>
    {hint && <span className="block text-[11px] text-slate-400 mt-1">{hint}</span>}
  </label>;
}

export default function VoiceAIAddOnPanel({ control, update, usageSummary, runtimeStatus }) {
  const liveRate = Math.max(0, Number(control.voice_ai_provider_cost_per_minute ?? 0.05));
  const telephonyRate = Math.max(0, Number(control.voice_ai_telephony_cost_per_minute ?? 0));
  const backendAllowance = Math.max(0, Number(control.voice_ai_backend_cost_allowance_per_minute ?? 0));
  const agencyCostRate = liveRate + telephonyRate + backendAllowance;
  const markup = Math.max(0, Number(control.voice_ai_markup_percent ?? 25));
  const clientRate = agencyCostRate * (1 + markup / 100);
  const schedule = control.voice_ai_custom_schedule || {};
  const knowledge = Array.isArray(control.voice_ai_knowledge_items) ? control.voice_ai_knowledge_items : [];
  const appId = import.meta.env.VITE_BASE44_APP_ID;
  const webhookUrl = typeof window !== 'undefined' && appId ? `${window.location.origin}/api/apps/${appId}/functions/voiceSipWebhook` : '';

  useEffect(() => {
    if (webhookUrl && !String(control.voice_ai_callback_url || '').trim()) {
      update('voice_ai_callback_url', webhookUrl);
    }
  }, [webhookUrl, control.voice_ai_callback_url, update]);

  const updateDay = (key, patch) => {
    const current = schedule[key] || { enabled: false, start: '17:00', end: '08:00' };
    update('voice_ai_custom_schedule', { ...schedule, [key]: { ...current, ...patch } });
  };

  const addKnowledge = () => update('voice_ai_knowledge_items', [...knowledge, {
    id: 'voice-kb-' + Date.now(), title: '', category: 'Company Information', content: '', active: true
  }]);

  const updateKnowledge = (index, patch) => {
    const next = [...knowledge];
    next[index] = { ...next[index], ...patch };
    update('voice_ai_knowledge_items', next);
  };

  const removeKnowledge = index => update('voice_ai_knowledge_items', knowledge.filter((_, i) => i !== index));

  return <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-2">
      <Bot className="w-5 h-5 text-slate-800 mt-0.5" />
      <div>
        <h2 className="font-bold text-slate-900">AI Voice Receptionist Add-On</h2>
        <p className="text-xs text-slate-500">Agency Owner-only configuration for availability, pricing, models, approved knowledge, usage controls, and monthly billing.</p>
      </div>
    </div>

    <div className="p-5 space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className={`rounded-lg border p-3 ${runtimeStatus?.website_ready ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Website GPT-Live Runtime</div>
          <div className={`text-sm font-bold mt-1 ${runtimeStatus?.website_ready ? 'text-green-700' : 'text-amber-800'}`}>{runtimeStatus?.website_ready ? 'Connected' : 'Needs OPENAI_API_KEY secret'}</div>
        </div>
        <div className={`rounded-lg border p-3 ${runtimeStatus?.phone_ready ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Phone / SIP Runtime</div>
          <div className={`text-sm font-bold mt-1 ${runtimeStatus?.phone_ready ? 'text-green-700' : 'text-amber-800'}`}>{runtimeStatus?.phone_ready ? 'Ready for SIP routing' : 'Needs phone runtime secrets'}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">OpenAI Project</div>
          <div className="text-sm font-bold text-slate-800 mt-1">{runtimeStatus?.openai_project_id_configured ? 'Configured' : 'Not configured'}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Webhook Verification</div>
          <div className="text-sm font-bold text-slate-800 mt-1">{runtimeStatus?.openai_webhook_secret_configured ? 'Configured' : 'Not configured'}</div>
        </div>
        <div className={`rounded-lg border p-3 ${runtimeStatus?.sideband_worker_reachable && runtimeStatus?.sideband_worker_shared_secret_configured ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Sideband Worker</div>
          <div className={`text-sm font-bold mt-1 ${runtimeStatus?.sideband_worker_reachable && runtimeStatus?.sideband_worker_shared_secret_configured ? 'text-green-700' : 'text-amber-800'}`}>
            {runtimeStatus?.sideband_worker_reachable && runtimeStatus?.sideband_worker_shared_secret_configured ? 'Healthy' : runtimeStatus?.sideband_url_configured ? 'Not healthy' : 'Not configured'}
          </div>
          {runtimeStatus?.sideband_health_error && <div className="mt-1 text-[10px] text-slate-500">{runtimeStatus.sideband_health_error}</div>}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Phone Runtime Setup</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="OpenAI Webhook URL" value={webhookUrl} readOnly hint="Create an OpenAI project webhook for incoming Live/SIP call events using this published Base44 function URL." />
          <Field label="Runtime Callback URL" value={control.voice_ai_callback_url || webhookUrl} readOnly hint="Saved with the client configuration and used for secure one-time runtime-token callbacks from the shared sideband worker." />
          <Field label="OpenAI Project ID" value={control.voice_ai_openai_project_id || ''} onChange={v => update('voice_ai_openai_project_id', v)} hint="Non-secret proj_... identifier. Store it here during onboarding; a legacy OPENAI_PROJECT_ID secret remains supported as a fallback." />
          <Field label="OpenAI SIP Target" value={runtimeStatus?.sip_target_uri || ''} readOnly hint="Point the client's SIP trunk/phone provider at this target after the OpenAI Project ID is configured." />
        </div>
        <div className="mt-3 space-y-1 text-xs text-slate-500">
          <p>Phone calls are only accepted when the Voice AI add-on is enabled, Phone Voice is enabled, the configured schedule is active, the OpenAI webhook is verified, and the sideband worker passes its health check. Otherwise the webhook rejects the AI leg instead of answering with a partially configured agent.</p>
          <p>Direct SIP keeps phone audio between the telephony provider and OpenAI. Twilio/provider account credentials stay with the telephony provider and are not required as Base44 secrets unless we later automate carrier provisioning.</p>
        </div>
      </div>

      <div>
        <h3 className="font-bold text-sm text-slate-900 mb-3">Add-On & Billing</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Toggle label="Voice AI Add-On Enabled" checked={control.voice_ai_enabled} onChange={v => update('voice_ai_enabled', v)} hint="Master switch. When OFF, the service is unavailable and no new Voice AI add-on charges are generated." />
          <Field label="Monthly Add-On Fee" type="number" step="0.01" value={control.voice_ai_monthly_fee ?? 0} onChange={v => update('voice_ai_monthly_fee', v)} hint="Flat monthly client charge." />
          <Toggle label="Bill Client Per Minute" checked={control.voice_ai_per_minute_billing_enabled !== false} onChange={v => update('voice_ai_per_minute_billing_enabled', v)} hint="Turn OFF for a promotion or included-usage period. Usage is still tracked." />
          <Field label="GPT-Live Cost / Minute" type="number" step="0.0001" value={liveRate} onChange={v => update('voice_ai_provider_cost_per_minute', v)} hint="Current GPT-Live voice-session cost. Update if OpenAI pricing changes." />
          <Field label="Telephony Cost / Minute" type="number" step="0.0001" value={telephonyRate} onChange={v => update('voice_ai_telephony_cost_per_minute', v)} hint="Carrier/SIP cost estimate. Enter the actual provider rate when known." />
          <Field label="Backend Cost Allowance / Minute" type="number" step="0.0001" value={backendAllowance} onChange={v => update('voice_ai_backend_cost_allowance_per_minute', v)} hint="Optional allowance for delegated backend-model/tool usage; actual token/tool charges vary." />
          <Field label="Estimated Agency Cost / Minute" value={'$' + agencyCostRate.toFixed(4)} readOnly hint="GPT-Live + telephony + backend allowance." />
          <Field label="Markup %" type="number" step="0.01" value={markup} onChange={v => update('voice_ai_markup_percent', v)} />
          <Field label="Client Rate / Minute" value={'$' + clientRate.toFixed(4)} readOnly hint="Estimated agency cost × (1 + markup %)." />
          <Field label="Monthly Usage Cap (minutes)" type="number" step="1" value={control.voice_ai_monthly_usage_cap_minutes ?? 0} onChange={v => update('voice_ai_monthly_usage_cap_minutes', v)} hint="0 = no cap." />
          <Field label="Maximum Call Length (minutes)" type="number" step="1" value={control.voice_ai_max_call_minutes ?? 30} onChange={v => update('voice_ai_max_call_minutes', v)} />
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-500">Unbilled Usage</div><div className="text-xl font-black text-slate-900">{Number(usageSummary?.unbilled_minutes || 0).toFixed(2)} min</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-500">Estimated Agency Voice Cost</div><div className="text-xl font-black text-slate-900">{'$' + Number(usageSummary?.provider_cost || 0).toFixed(2)}</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-500">Estimated Usage Charge</div><div className="text-xl font-black text-slate-900">{'$' + Number(usageSummary?.client_usage_charge || 0).toFixed(2)}</div></div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="text-[11px] uppercase tracking-wide text-slate-500">Next Voice Invoice Total</div><div className="text-xl font-black text-slate-900">{'$' + Number(usageSummary?.estimated_invoice_voice_total || 0).toFixed(2)}</div></div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Scheduled invoices itemize the monthly Voice AI add-on separately from billable voice minutes. Backend-model, tool, telephony, or other pass-through costs can be added later as separate metered items.</p>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Availability & Routing</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Toggle label="Website Voice" checked={control.voice_ai_website_enabled} onChange={v => update('voice_ai_website_enabled', v)} />
          <Toggle label="Phone Voice" checked={control.voice_ai_phone_enabled !== false} onChange={v => update('voice_ai_phone_enabled', v)} />
          <Field label="Client Phone Number" value={control.voice_ai_phone_number || ''} onChange={v => update('voice_ai_phone_number', v)} hint="Existing business number or dedicated Voice AI number routed through the SIP provider." />
          <Field label="SIP / Telephony Provider" value={control.voice_ai_sip_provider || 'Twilio'} onChange={v => update('voice_ai_sip_provider', v)} hint="Provider used to route the client number to the OpenAI SIP endpoint." />
          <Select label="Schedule Mode" value={control.voice_ai_schedule_mode || 'After Hours'} onChange={v => update('voice_ai_schedule_mode', v)} options={['Always','After Hours','Custom']} hint="After Hours follows the business hours already configured for the client." />
          <Field label="Voice Time Zone" value={control.voice_ai_timezone || 'America/Chicago'} onChange={v => update('voice_ai_timezone', v)} />
          <Field label="Human Transfer Number" value={control.voice_ai_transfer_number || ''} onChange={v => update('voice_ai_transfer_number', v)} hint="Used for escalation or requested transfer." />
          <label className="block md:col-span-2 lg:col-span-4">
            <span className="block text-xs font-semibold text-slate-600 mb-1">Phone Routing Notes</span>
            <textarea rows={2} value={control.voice_ai_phone_route_notes || ''} onChange={e => update('voice_ai_phone_route_notes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Example: Existing main number forwards to Twilio after 7 PM; transfer target is office/on-call line." />
          </label>
        </div>

        {control.voice_ai_schedule_mode === 'Custom' && <div className="mt-4 rounded-lg border border-slate-200 p-3">
          <div className="text-xs font-bold text-slate-700 mb-2">Custom Voice Coverage</div>
          <div className="space-y-2">
            {DAYS.map(([key,label]) => {
              const d = schedule[key] || { enabled: false, start: '17:00', end: '08:00' };
              return <div key={key} className="grid grid-cols-[70px_80px_1fr_1fr] gap-2 items-center">
                <span className="text-sm font-semibold text-slate-700">{label}</span>
                <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={!!d.enabled} onChange={e => updateDay(key,{enabled:e.target.checked})} /> On</label>
                <input type="time" value={d.start || '17:00'} onChange={e => updateDay(key,{start:e.target.value})} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
                <input type="time" value={d.end || '08:00'} onChange={e => updateDay(key,{end:e.target.value})} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
              </div>;
            })}
          </div>
        </div>}
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Agency-Managed AI Configuration</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Live Voice Model" value={control.voice_ai_live_model || 'gpt-live-1'} onChange={v => update('voice_ai_live_model', v)} />
          <Field label="Backend Model" value={control.voice_ai_backend_model || ''} onChange={v => update('voice_ai_backend_model', v)} hint="Optional reasoning/tool model behind the live voice layer." />
          <Select label="Voice" value={String(control.voice_ai_voice || 'gleam').toLowerCase()} onChange={v => update('voice_ai_voice', v)} options={VOICES} hint="Gleam is the default North American feminine voice; Meridian is the North American masculine alternative." />
          <Field label="Transcript / Recording Retention (days)" type="number" value={control.voice_ai_retention_days ?? 30} onChange={v => update('voice_ai_retention_days', v)} />
          <Toggle label="Save Transcripts" checked={control.voice_ai_save_transcripts !== false} onChange={v => update('voice_ai_save_transcripts', v)} />
          <Toggle label="Save Recordings" checked={control.voice_ai_save_recordings === true} onChange={v => update('voice_ai_save_recordings', v)} hint="Use only with the required call-recording disclosure/consent process." />
        </div>
        <label className="block mt-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1">System / Agent Instructions</span>
          <textarea rows={7} value={control.voice_ai_system_prompt || ''} onChange={e => update('voice_ai_system_prompt', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Agency-approved role, tone, escalation, prohibited actions, and workflow instructions." />
        </label>
      </div>

      <div className="border-t pt-5">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Customer Qualification</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Toggle label="Qualify Before Creating CRM Request" checked={control.voice_ai_qualification_enabled === true} onChange={v => update('voice_ai_qualification_enabled', v)} hint="When enabled, the backend enforces customer-fit rules before a voice lead can be created." />
          <Toggle label="Decline Personal / Individual Orders" checked={control.voice_ai_decline_personal_orders === true} onChange={v => update('voice_ai_decline_personal_orders', v)} hint="Personal one-off inquiries are politely declined and are not added as CRM leads." />
          <Toggle label="Sports Teams Must Be Local" checked={control.voice_ai_local_sports_only === true} onChange={v => update('voice_ai_local_sports_only', v)} hint="Coach/parent orders qualify when they are for a team inside the configured local area." />
          <Field label="Hard Minimum Quantity" type="number" step="1" value={control.voice_ai_minimum_quantity ?? 0} onChange={v => update('voice_ai_minimum_quantity', v)} hint="0 = ask quantity but do not enforce a numeric minimum." />
        </div>
        <label className="block mt-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1">Target Customer Types</span>
          <input value={(control.voice_ai_target_customer_types || []).join(', ')} onChange={e => update('voice_ai_target_customer_types', e.target.value.split(',').map(v => v.trim()).filter(Boolean))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Business / Corporate, Local Sports Team" />
          <span className="block text-[11px] text-slate-400 mt-1">Comma-separated approved customer profiles.</span>
        </label>
        <label className="block mt-4">
          <span className="block text-xs font-semibold text-slate-600 mb-1">Qualification Notes</span>
          <textarea rows={4} value={control.voice_ai_qualification_notes || ''} onChange={e => update('voice_ai_qualification_notes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Example: Business/corporate orders may ship nationwide. Sports-team orders must be local. A parent ordering for the team qualifies." />
        </label>
      </div>

      <div className="border-t pt-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><h3 className="font-bold text-sm text-slate-900">Agency-Managed Voice Knowledge Base</h3><p className="text-xs text-slate-500">Voice automatically uses approved business settings, services, service FAQs and the standard Knowledge Base. Add entries here only for voice-specific facts, policies or overrides.</p></div>
          <button type="button" onClick={addKnowledge} className="inline-flex items-center gap-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold"><Plus className="w-4 h-4" /> Add Knowledge</button>
        </div>
        <div className="space-y-3">
          {knowledge.map((item,index) => <div key={item.id || index} className="rounded-lg border border-slate-200 p-3">
            <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
              <input value={item.title || ''} onChange={e => updateKnowledge(index,{title:e.target.value})} placeholder="Title" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
              <input value={item.category || ''} onChange={e => updateKnowledge(index,{category:e.target.value})} placeholder="Category" className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => removeKnowledge(index)} className="p-2 text-red-600 hover:bg-red-50 rounded" aria-label="Remove knowledge item"><Trash2 className="w-4 h-4" /></button>
            </div>
            <textarea rows={4} value={item.content || ''} onChange={e => updateKnowledge(index,{content:e.target.value})} placeholder="Approved facts, policy, FAQ answer, service rule, escalation rule, or other agent knowledge." className="mt-2 w-full border border-slate-300 rounded px-2 py-2 text-sm" />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={item.active !== false} onChange={e => updateKnowledge(index,{active:e.target.checked})} /> Active for Voice AI</label>
          </div>)}
          {knowledge.length === 0 && <div className="text-sm text-slate-400">No agency-managed Voice AI knowledge entries yet.</div>}
        </div>
      </div>

      <div className="border-t pt-4 text-xs text-slate-500 flex items-start gap-2">
        <DollarSign className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>Current estimate: ${agencyCostRate.toFixed(4)}/minute agency cost × {markup.toFixed(2)}% markup = ${clientRate.toFixed(4)}/minute client rate. GPT-Live is only one cost component; telephony and delegated backend usage can be included above. If per-minute billing is off, usage is still tracked but the usage charge is $0.</span>
      </div>
    </div>
  </section>;
}
