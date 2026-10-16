import { CheckCircle2, CircleAlert, FlaskConical } from 'lucide-react';

function Status({ label, ready, detail, optional = false }) {
  const ok = !!ready;
  return (
    <div className={`rounded-lg border p-3 ${ok ? 'border-green-200 bg-green-50' : optional ? 'border-slate-200 bg-slate-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-2">
        {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <CircleAlert className={`mt-0.5 h-4 w-4 shrink-0 ${optional ? 'text-slate-400' : 'text-amber-600'}`} />}
        <div>
          <div className="text-sm font-bold text-slate-900">{label}</div>
          <div className="mt-0.5 text-xs leading-5 text-slate-600">{detail}</div>
        </div>
      </div>
    </div>
  );
}

export default function LivePilotReadinessPanel({ readiness }) {
  const r = readiness || {};
  const glsaOff = !r.glsa_enabled;
  const coreReady = r.logo_ready && r.outlook_connected && r.search_console_connected && r.seo_baseline_captured;
  const reputationReady = !r.reputation_enabled || (r.reputation_google_ready && r.review_url_ready && r.review_email_ready);
  const voiceReady = !r.voice_enabled || r.voice_phone_ready;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-brand-accent" />
          <div>
            <h2 className="font-bold text-slate-900">Live Pilot Readiness</h2>
            <p className="text-xs text-slate-500">Operational checks for a real-world client pilot. This does not replace the formal launch checklist.</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Status label="Branding" ready={r.logo_ready} detail={r.logo_ready ? 'Logo uploaded.' : 'Final logo still needs to be uploaded.'} />
          <Status label="Microsoft 365" ready={r.outlook_connected} detail={r.outlook_connected ? 'Client Outlook sender is connected.' : 'Connect the client Microsoft 365 mailbox before live email workflows.'} />
          <Status label="Search Console" ready={r.search_console_connected} detail={r.search_console_connected ? 'Google Search Console connection is active.' : 'Connect Search Console before launch so rankings/indexing can be measured from day one.'} />
          <Status label="SEO Baseline" ready={r.seo_baseline_captured} detail={r.seo_baseline_captured ? `Day-zero baseline captured${r.seo_baseline_captured_at ? ' ' + new Date(r.seo_baseline_captured_at).toLocaleDateString() : ''}.` : 'Capture the rolling 28-day Search Console baseline before the public cutover.'} />
          <Status label="Analytics" ready={r.analytics_connected} optional detail={r.analytics_connected ? 'Google Analytics is connected/configured.' : 'Optional for launch, but recommended for traffic and conversion measurement.'} />
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Status
            label="Reputation Management"
            ready={reputationReady}
            optional={!r.reputation_enabled}
            detail={!r.reputation_enabled
              ? 'Add-on is off.'
              : r.reputation_google_ready && r.review_url_ready && r.review_email_ready
                ? 'Google sync, review link and review email workflow are ready.'
                : 'Add-on is active, but Google Business Profile, direct review link, or review email setup is still incomplete.'}
          />
          <Status
            label="AI Phone"
            ready={voiceReady}
            optional={!r.voice_enabled}
            detail={!r.voice_enabled
              ? 'Voice AI is not enabled yet.'
              : r.voice_phone_ready
                ? 'Phone AI runtime and client number are ready.'
                : 'Voice AI is enabled but the phone runtime and/or client number is not ready.'}
          />
          <Status
            label="Google Local Services"
            ready={glsaOff}
            optional
            detail={glsaOff ? 'Off / not applicable for this client.' : 'Google Local Services is enabled for this client.'}
          />
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${coreReady ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>Core pilot: {coreReady ? 'Ready' : 'Needs setup'}</span>
          <span className={`rounded-full px-2.5 py-1 font-semibold ${r.site_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>Public site: {r.site_status || 'Setup'}</span>
          {r.primary_domain && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{r.primary_domain}</span>}
        </div>
      </div>
    </section>
  );
}
