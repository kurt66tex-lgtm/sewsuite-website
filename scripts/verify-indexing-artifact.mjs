import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {indexableRelease} from './indexing-release-policy.mjs';
const allowed=indexableRelease(process.env);
const expected=allowed?'index, follow':'noindex, nofollow';
for(const path of ['dist/index.html','dist/services/custom-embroidery/index.html',
 'dist/service-areas/allen/index.html','dist/our-work/allen-eagles-embroidered-applique/index.html']){
 const html=readFileSync(path,'utf8');
 assert.ok(html.includes('<meta name="robots" content="'+expected+'"'), 'wrong_robots_meta_'+path);
 if(allowed)assert.ok(!html.includes('content="noindex, nofollow"'),'production_remains_noindex_'+path);
}
const robots=readFileSync('dist/robots.txt','utf8');
if(allowed){
 assert.match(robots,/Allow:\s*\//);
 assert.doesNotMatch(robots,/Disallow:\s*\//);
}else assert.match(robots,/Disallow:\s*\//);
const config=JSON.parse(readFileSync('vercel.json','utf8'));
const noindex=config.headers.find(x=>x.headers?.some(h=>h.key==='X-Robots-Tag'&&h.value==='noindex, nofollow'));
assert.ok(noindex);
assert.deepEqual(noindex.missing.map(x=>x.value).sort(),['sewsuite.com','www.sewsuite.com']);
console.log('RRS_SEW_SUITE_INDEXING_BUILD_POLICY_PASS',JSON.stringify({mode:process.env.VERCEL_ENV,allowed,meta:expected}));
