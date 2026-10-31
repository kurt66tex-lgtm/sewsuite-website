import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {indexableRelease} from '../scripts/indexing-release-policy.mjs';
const catalog='e06f162d-8684-4eef-89fa-57bcec31a4fa';
const approved={
 VERCEL_ENV:'production',
 RRS_PRODUCTION_RELEASE_VERIFIED:'true',
 RRS_PRODUCTION_INDEXABLE:'true',
 VITE_PUBLIC_CATALOG_MODE:'independent',
 RRS_PUBLIC_CATALOG_MODE:'independent',
 RRS_PUBLIC_CATALOG_ENABLED:'true',
 VITE_APPROVED_CATALOG_VERSION:catalog,
 RRS_APPROVED_PUBLIC_CATALOG_VERSION:catalog
};
test('only an explicitly approved matching production build may index',()=>{
 assert.equal(indexableRelease(approved),true);
 for(const key of Object.keys(approved)){
  const damaged={...approved,[key]:'false'};
  assert.equal(indexableRelease(damaged),false,'fail closed when '+key+' drifts');
 }
});
test('preview is nonindexable even when every release flag is present',()=>{
 assert.equal(indexableRelease({...approved,VERCEL_ENV:'preview'}),false);
 assert.equal(indexableRelease({...approved,VERCEL_ENV:undefined}),false);
});
test('Vercel response headers apply noindex to every non-production host',()=>{
 const config=JSON.parse(readFileSync('vercel.json','utf8'));
 const guard=config.headers.find(x=>x.headers?.some(h=>h.key==='X-Robots-Tag'&&h.value==='noindex, nofollow'));
 assert.ok(guard);
 assert.deepEqual(guard.missing.map(x=>x.value).sort(),['sewsuite.com','www.sewsuite.com']);
 assert.ok(guard.missing.every(x=>x.type==='host'));
});
test('source always ships with noindex until build gate overrides output',()=>{
 const index=readFileSync('index.html','utf8');
 assert.match(index,/<meta name="robots" content="noindex, nofollow"/);
 const script=readFileSync('scripts/build-static-seo.mjs','utf8');
 assert.match(script,/if\(allowProductionIndexing\)/);
 assert.match(script,/content="index, follow"/);
});
