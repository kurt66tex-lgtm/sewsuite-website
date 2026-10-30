import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const known=new Set(['BusinessSettings','ServiceType','ServiceArea','Brand','Review','PortfolioProject','PortfolioPhoto','ServiceIntakeQuestion']);
const files=['src/pages','src/components/site'].flatMap(folder=>readdirSync(folder).filter(name=>name.endsWith('.jsx')).map(name=>join(folder,name)));
test('all public pages use migrated public entity collections only',()=>{
 const unexpected=[];
 for(const file of files){
  const code=readFileSync(file,'utf8');
  for(const match of code.matchAll(/base44\.entities\.([A-Za-z][A-Za-z0-9]*)/g)){
   if(!known.has(match[1]))unexpected.push(file+':'+match[1]);
  }
 }
 assert.deepEqual(unexpected,[],'unmigrated public entity collection reference');
});
test('FAQs import the ten approved published source records',()=>{
 const page=readFileSync('src/pages/FAQs.jsx','utf8');
 const records=JSON.parse(readFileSync('src/data/current-base44-public-faqs.json','utf8'));
 assert.match(page,/current-base44-public-faqs/);
 assert.equal(records.length,10);
 assert.ok(records.every(row=>row.active===true&&row.question&&row.answer));
});
