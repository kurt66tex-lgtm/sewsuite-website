import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const items=JSON.parse(readFileSync('src/data/current-base44-public-faqs.json','utf8'));
const jsx=readFileSync('src/pages/FAQs.jsx','utf8');
test('all ten published FAQ items are included in source order',()=>{
 assert.equal(items.length,10);
 assert.deepEqual(items.map(x=>x.display_order),[1,2,3,4,5,6,7,8,9,10]);
 assert.ok(items.every(x=>x.active===true&&x.question?.trim()&&x.answer?.trim()));
 assert.equal(new Set(items.map(x=>x.question)).size,10);
 assert.match(jsx,/current-base44-public-faqs\.json/);
 assert.doesNotMatch(jsx,/base44\.entities\.KnowledgeBase/);
});
