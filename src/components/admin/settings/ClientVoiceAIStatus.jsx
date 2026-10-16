import { useEffect, useState } from 'react';
import { Bot, Phone, Globe2, LockKeyhole } from 'lucide-react';
import { base44 } from '@/api/base44Client';

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

export default function ClientVoiceAIStatus() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    base44.functions.invoke('getClientVoiceStatus', {})
      .then(res => { if (active) setData(res?.data || res || null); })
      .catch(() => { if (active) setData(null); });
    return () => { active = false; };
  }, []);

  if (!data?.enabled) return null;
  const billing = data.billing || {};
  const rateText = billing.per_minute_billing_enabled
    ? ' + $' + Number(billing.client_rate_per_minute || 0).toFixed(4) + '/min'
    : ' · per-minute waived';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-900 p-2 text-white"><Bot className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-slate-900">AI Voice Receptionist</h3>
            <p className="text-xs text-slate-500 mt-0.5">Agency-managed voice service. AI models, prompts, tools, and knowledge are controlled by the agency.</p>
          </div>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">Active</span>
      </div>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Coverage</div>
          <div className="mt-1 font-bold text-slate-900">{data.schedule_mode}</div>
          <div className="text-xs text-slate-500">{data.timezone}</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Channels</div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
            {data.channels?.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</span>}
            {data.channels?.website && <span className="inline-flex items-center gap-1"><Globe2 className="w-3.5 h-3.5" /> Website</span>}
          </div>
          {data.phone_number && <div className="text-xs text-slate-500 mt-1">{data.phone_number}</div>}
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">This Month</div>
          <div className="mt-1 font-bold text-slate-900">{Number(billing.month_minutes || 0).toFixed(2)} min</div>
          <div className="text-xs text-slate-500">{money(billing.month_usage_charge)} usage</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Estimated Voice Total</div>
          <div className="mt-1 font-bold text-slate-900">{money(billing.estimated_month_voice_total)}</div>
          <div className="text-xs text-slate-500">{money(billing.monthly_add_on_fee)} monthly add-on{rateText}</div>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <LockKeyhole className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>This panel is read-only. Contact the agency for changes to Voice AI coverage, billing, models, knowledge, routing, or call-handling rules.</span>
      </div>
    </div>
  );
}