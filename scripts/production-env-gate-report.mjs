// Sew Suite production release gate report. Read-only: no DNS, mail, or secrets changed.
const required=['VITE_APPROVED_CATALOG_VERSION','RRS_APPROVED_PUBLIC_CATALOG_VERSION','VITE_PUBLIC_CATALOG_MODE','RRS_PUBLIC_CATALOG_MODE','RRS_PUBLIC_CATALOG_ENABLED','RRS_PUBLIC_CATALOG_API_ORIGIN','RRS_INTAKE_API_ORIGIN','RRS_INTERNAL_INTAKE_KEY','RRS_TURNSTILE_SECRET_KEY','VITE_TURNSTILE_SITE_KEY','RRS_PUBLIC_SITE_ORIGIN','RRS_PRODUCTION_INTAKE_ENABLED','RRS_PRODUCTION_CHAT_ENABLED','RRS_PRODUCTION_VOICE_ENABLED'];
const missing=required.filter(k=>!process.env[k]);
const gates={
 catalog_versions_match:!!process.env.VITE_APPROVED_CATALOG_VERSION&&process.env.VITE_APPROVED_CATALOG_VERSION===process.env.RRS_APPROVED_PUBLIC_CATALOG_VERSION,
 independent_catalog:process.env.VITE_PUBLIC_CATALOG_MODE==='independent'&&process.env.RRS_PUBLIC_CATALOG_MODE==='independent'&&process.env.RRS_PUBLIC_CATALOG_ENABLED==='true',
 approved_public_origin:['https://sewsuite.com','https://www.sewsuite.com'].includes(process.env.RRS_PUBLIC_SITE_ORIGIN),
 intake_enabled:process.env.RRS_PRODUCTION_INTAKE_ENABLED==='true',
 chat_enabled:process.env.RRS_PRODUCTION_CHAT_ENABLED==='true',
 voice_enabled:process.env.RRS_PRODUCTION_VOICE_ENABLED==='true'
};
const ready=missing.length===0&&Object.values(gates).every(Boolean);
console.log(JSON.stringify({ready,missing_keys:missing,checks:gates},null,2));
if(!ready)process.exitCode=1;
