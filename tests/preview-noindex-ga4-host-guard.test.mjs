import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const layout=readFileSync('src/components/site/SiteLayout.jsx','utf8');
const index=readFileSync('index.html','utf8');
test('preview cannot become indexable after client hydration',()=>{
 const guard="!['sewsuite.com', 'www.sewsuite.com'].includes(window.location.hostname.toLowerCase())";
 assert.equal(layout.split(guard).length-1,2,'both robots and analytics must use exact allowlist');
 assert.match(layout,/if \(isStaging \|\| siteAccess\.site_status !== 'Active'\) meta\.content = 'noindex, nofollow'/);
 assert.match(index,/name="robots" content="noindex, nofollow"/);
});
test('GA4 must not run on any preview hostname',()=>{
 assert.match(layout,/settings\?\.privacy_use_analytics === true && validId && !isStaging && siteAccess\.site_status === 'Active'/);
 assert.doesNotMatch(layout,/hostname\.includes\('base44\.app'\)/);
});
