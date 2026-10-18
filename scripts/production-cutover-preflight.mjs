// Read-only launch preflight. Never changes DNS, services, or customer records.
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const checks=[
 ['Quote form accepts real customers',!read('src/pages/BookService.jsx').includes('Quote submissions are not yet enabled')],
 ['Quote API rejects unverifiable submissions',read('api/intake.js').includes('verification_required')],
 ['Quote API requires confirmed durable lead ID',read('api/intake.js').includes('data.lead_id')],
 ['Chat CRM requires confirmed lead ID',read('api/chat-lead.js').includes('d.lead_id')],
 ['Chat lead requires bot verification',read('api/chat-lead.js').includes('turnstile_token')],
 ['Public content not a frozen snapshot',!read('src/api/base44Client.js').includes('prelaunch-public-snapshot.json')],
 ['Voice session can submit to production',!read('api/voice.js').includes('prelaunch-only')],
 ['Voice host restriction allows production domain',!read('api/voice.js').includes("!host.endsWith('.vercel.app')")],
 ['Production environment configured',process.env.RRS_PRODUCTION_RELEASE_VERIFIED==='true'],
 ['Production mail release verified',process.env.RRS_PRODUCTION_MAIL_VERIFIED==='true'],
 ['Production artwork release verified',process.env.RRS_PRODUCTION_ARTWORK_VERIFIED==='true'],
 ['Artwork attached to real intake',!read('src/pages/BookService.jsx').includes('Artwork uploads are not yet connected')]
];
for(const [label,pass] of checks)console.log((pass?'PASS':'BLOCKED')+' '+label);
const ready=checks.every(x=>x[1]);
console.log('SEW_SUITE_PRODUCTION_CUTOVER_READY='+ready);
if(!ready)process.exitCode=1;
