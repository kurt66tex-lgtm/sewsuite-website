import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repairDisplayText} from '../src/lib/repairDisplayText.js';

test('catalog mojibake is corrected in all nested public copy without changing objects',()=>{
  const input={
    BusinessSettings:[{service_region_label:'Allen, Texas â€” serving North Texas'}],
    PortfolioProject:[
      {description:'This is an example of Sew Suiteâ€™s embroidery work and appliquÃ©.'},
      {description:'Sew Suiteâ€™s branded apparel and custom caps.'}
    ],
    ServiceIntakeQuestion:[{options:['Yes â€” ready to upload','No â€” need help']}],
    ServiceType:[{helpful_tip:'Send what you haveâ€”Sew Suite can review the artwork.'}]
  };
  const output=repairDisplayText(input);
  assert.notEqual(output,input);
  assert.equal(input.PortfolioProject[0].description,'This is an example of Sew Suiteâ€™s embroidery work and appliquÃ©.');
  assert.equal(output.PortfolioProject[0].description,'This is an example of Sew Suite’s embroidery work and appliqué.');
  assert.equal(output.PortfolioProject[1].description,'Sew Suite’s branded apparel and custom caps.');
  assert.equal(output.BusinessSettings[0].service_region_label,'Allen, Texas — serving North Texas');
  assert.equal(output.ServiceIntakeQuestion[0].options[0],'Yes — ready to upload');
  assert.equal(output.ServiceType[0].helpful_tip,'Send what you have—Sew Suite can review the artwork.');
  assert.deepEqual(repairDisplayText(output),output);
});
test('obsolete public Base44 login cannot accept passwords and all admin routes go to independent CRM',()=>{
  const login=readFileSync('src/pages/Login.jsx','utf8');
  const vercel=JSON.parse(readFileSync('vercel.json','utf8'));
  const targets=new Map(vercel.redirects.map(x=>[x.source,x]));
  assert.doesNotMatch(login,/loginViaEmailPassword|loginWithProvider|base44\.auth/);
  for(const path of ['/admin','/admin/:path*','/login','/register','/forgot-password','/reset-password']){
    assert.equal(targets.get(path)?.permanent,false);
    assert.match(targets.get(path)?.destination||'',/^https:\/\/sewsuite-production-crm\.vercel\.app\/(admin|login)/);
  }
  assert.ok(vercel.rewrites.some(x=>x.destination==='/index.html'));
});
