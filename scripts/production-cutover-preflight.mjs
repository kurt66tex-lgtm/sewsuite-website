// Read-only launch preflight. Never changes DNS, services, or customer records.
import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const checks=[
 ['Quote form accepts real customers',!read('src/pages/BookService.jsx').includes('Quote submissions are not yet enabled')],
 ['Quote API permits real customers',!read('api/intake.js').includes("real_submissions_not_enabled")],
 ['Chat CRM accepts real customers',!read('api/chat-lead.js').includes("body.email!=='synthetic@example.invalid'")],
 ['Public content not a frozen snapshot',!read('src/api/base44Client.js').includes('prelaunch-public-snapshot.json')],
 ['Voice session can submit to production',!read('api/voice.js').includes('prelaunch-only')],
 ['Artwork attached to real intake',!read('src/pages/BookService.jsx').includes('Artwork uploads are not yet connected')]
];
for(const [label,pass] of checks)console.log((pass?'PASS':'BLOCKED')+' '+label);
const ready=checks.every(x=>x[1]);
console.log('SEW_SUITE_PRODUCTION_CUTOVER_READY='+ready);
if(!ready)process.exitCode=1;
