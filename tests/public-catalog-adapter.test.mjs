import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const adapter=readFileSync(new URL('../src/api/base44Client.js',import.meta.url),'utf8');
const proxy=readFileSync(new URL('../api/public-catalog.js',import.meta.url),'utf8');
test('public content has explicit snapshot preview and fail-closed independent mode',()=>{
 assert.match(adapter,/VITE_PUBLIC_CATALOG_MODE==='independent'/);
 assert.match(adapter,/VITE_APPROVED_CATALOG_VERSION/);
 assert.match(adapter,/message\.version!==import\.meta\.env\.VITE_APPROVED_CATALOG_VERSION/);
 assert.match(adapter,/independent_catalog_unavailable/);
 assert.match(adapter,/fetch\('\/api\/public-catalog'/);
 assert.doesNotMatch(adapter,/@base44\/sdk|media\.base44\.com/);
});
test('independent content proxy requires private server-side key and owned origin',()=>{
 assert.match(proxy,/RRS_PUBLIC_CATALOG_READ_KEY/);
 assert.match(proxy,/RRS_PUBLIC_CATALOG_ENABLED==='true'/);
 assert.match(proxy,/x-rrs-public-catalog-key/);
 assert.match(proxy,/https:/);
 assert.match(proxy,/catalog_shape_rejected/);
});

test('public catalog preserves numeric Base44 display ordering and repairs display encoding',()=>{
 assert.match(adapter,/typeof av==='number'&&typeof bv==='number'/);
 assert.match(adapter,/localeCompare\(String\(bv\?\?''\),undefined,\{numeric:true\}\)/);
 assert.match(adapter,/repairDisplayText/);
 assert.match(adapter,/Ã©/);
});
