import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(x,'utf8');
const expected='https://www.sewsuite.com';
test('the approved primary domain is consistently canonical in the sitemap and prerender',()=>{
 const sitemap=read('public/sitemap.xml');
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.equal(urls.length,48);
 assert.ok(urls.every(url=>url.startsWith(expected+'/')),'sitemap_host_drift');
 const staticSeo=read('scripts/build-static-seo.mjs');
 assert.match(staticSeo,/const base='https:\/\/www\.sewsuite\.com'/);
 assert.match(staticSeo,/rel="canonical"/);
});
test('every browser-hydrated public page uses the same www canonical origin',()=>{
 const canonical=read('src/lib/sewSuiteCanonical.js');
 assert.match(canonical,/SEW_SUITE_CANONICAL_ORIGIN = 'https:\/\/www\.sewsuite\.com'/);
 const sources=['src/components/site/SiteLayout.jsx','src/pages/ServiceTypeDetail.jsx','src/pages/ServiceAreaDetail.jsx','src/pages/PortfolioDetail.jsx'];
 for(const file of sources){
  const src=read(file);
  assert.match(src,/const baseUrl = SEW_SUITE_CANONICAL_ORIGIN/,'missing_primary_canonical_'+file);
  assert.doesNotMatch(src,/const baseUrl = \(settings\?\.website_url/,'legacy_apex_hydration_drift_'+file);
 }
});
