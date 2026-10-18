import { CheckCircle2, Circle, DollarSign, Mail, Phone, Sparkles } from 'lucide-react';

function money(v) {
  return '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 });
}

export default function AddOnOffer({ title, summary, monthlyFee, features = [], agency = {}, eyebrow='Optional managed service' }) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="bg-slate-950 px-6 py-7 text-white">
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-brand-accent">{eyebrow}</div>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{summary}</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-right">
              <div className="text-[11px] uppercase tracking-wide text-slate-300">Monthly add-on</div>
              <div className="text-3xl font-black text-white">{money(monthlyFee)}</div>
              <div className="text-[11px] text-slate-300">Agency-managed service</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-accent" />
              <h3 className="font-bold text-slate-900">What is included</h3>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-700" />
              <h3 className="font-bold text-slate-900">Activate this service</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This add-on is controlled by your agency. Turning it on does not happen from Business Settings, so billing and Google access cannot be enabled accidentally.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {agency.email && <div className="flex items-center gap-2 text-slate-700"><Mail className="h-4 w-4" /> {agency.email}</div>}
              {agency.phone && <div className="flex items-center gap-2 text-slate-700"><Phone className="h-4 w-4" /> {agency.phone}</div>}
              {!agency.email && !agency.phone && <div className="flex items-start gap-2 text-slate-500"><Circle className="mt-1 h-3 w-3" /> Contact your agency administrator to activate the add-on.</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
