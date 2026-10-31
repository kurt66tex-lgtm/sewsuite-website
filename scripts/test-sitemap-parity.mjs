// Read-only release-candidate sitemap parity regression.
// Generated preview must remain nonindexable; this checks URL completeness only.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
assert.equal(data.BusinessSettings?.[0]?.email,'support@sewsuite.com','public_email_drift');
const xml=readFileSync('public/sitemap.xml','utf8');
const urls=[...xml.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(m=>m[1]);
const found=new Set(urls);
assert.equal(urls.length,found.size,'duplicate_sitemap_url');
assert.ok(urls.every(url=>url.startsWith('https://sewsuite.com/')),'unexpected canonical host');
const services=(data.ServiceType||[]).filter(x=>x.active===true&&x.publicly_advertised===true);
const cities=(data.ServiceArea||[]).filter(x=>x.active===true&&x.indexable!==false);
const projects=(data.PortfolioProject||[]).filter(x=>x.is_published===true&&x.public_permission_confirmed===true);
assert.equal(services.length,9);
assert.equal(cities.length,20);
assert.equal(projects.length,8);
const requiredPaths=[
 '/', '/services','/service-areas','/our-work','/book-service',
 '/reviews','/about','/why-us','/faqs','/contact','/privacy-policy',
 ...services.map(x=>'/services/'+x.slug),
 ...cities.map(x=>'/service-areas/'+x.slug),
 ...projects.map(x=>'/our-work/'+x.slug)
];
const requiredURLs=new Set(requiredPaths.map(path=>'https://sewsuite.com'+path));
assert.equal(requiredPaths.length,requiredURLs.size,'duplicate_required_route');
assert.equal(found.size,requiredURLs.size,'stale_or_missing_sitemap_route');
for(const url of requiredURLs) assert.ok(found.has(url),'missing_sitemap_page_'+url);
for(const url of found) assert.ok(requiredURLs.has(url),'unapproved_sitemap_page_'+url);
const robots=readFileSync('public/robots.txt','utf8');
assert.match(robots,/Disallow:\s*\//,'preview_must_remain_blocked');
const config=JSON.parse(readFileSync('vercel.json','utf8'));
assert.ok(config.headers?.some(rule=>rule.headers?.some(h=>h.key==='X-Robots-Tag'&&/noindex/i.test(h.value))),'preview_header_noindex_missing');
console.log('RRS_PRECUTOVER_SITEMAP_PARITY_PASS '+JSON.stringify({servicePages:services.length,cityPages:cities.length,portfolioPages:projects.length,totalSitemapURLs:urls.length,previewStillNoindex:true}));
