import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import handler from '../api/intake.js';

const tracked=['VERCEL_ENV','RRS_PRODUCTION_INTAKE_ENABLED','RRS_INTAKE_API_ORIGIN','RRS_INTERNAL_INTAKE_KEY','RRS_TURNSTILE_SECRET_KEY','RRS_PUBLIC_SITE_ORIGIN'];
const original=Object.fromEntries(tracked.map(k=>[k,process.env[k]]));
const savedFetch=globalThis.fetch;
const site='https://sewsuite-authentic-comparison.vercel.app';
const leadId=randomUUID();
function configure(enabled=true){
 Object.assign(process.env,{VERCEL_ENV:'production',RRS_PRODUCTION_INTAKE_ENABLED:enabled?'true':'false',RRS_INTAKE_API_ORIGIN:'https://crm.example.invalid',RRS_INTERNAL_INTAKE_KEY:'i'.repeat(40),RRS_TURNSTILE_SECRET_KEY:'t'.repeat(40),RRS_PUBLIC_SITE_ORIGIN:site});
}
function request(body={},method='POST',origin=site){return {method,headers:{origin,'content-type':'application/json'},body};}
function response(){return {headers:{},statusCode:null,body:null,setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};}
const valid={first_name:'Synthetic',last_name:'Preview',phone:'4690000000',email:'no-mail@example.invalid',service_type:'Custom Embroidery',problem_description:'Synthetic protected intake contract only',request_key:'test_'+randomUUID().replaceAll('-',''),consent_to_contact:true,turnstile_token:'synthetic-proof',intake_answers:{approximate_quantity:'50'},website_company:''};

test('intake readiness and fail-closed disabled behavior never contact upstream',async()=>{
 configure(false);let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected call');};
 let res=response();await handler({method:'GET',headers:{}},res);assert.equal(res.statusCode,200);assert.deepEqual(res.body,{available:false});
 res=response();await handler(request(valid),res);assert.equal(res.statusCode,503);assert.equal(res.body.error,'intake_not_available');assert.equal(calls,0);
});
test('reject cross-origin, non-json and invalid verification without network access',async()=>{
 configure(true);let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected call');};
 let res=response();await handler(request(valid,'POST','https://untrusted.example.invalid'),res);assert.equal(res.statusCode,403);
 res=response();await handler({...request(valid),headers:{origin:site,'content-type':'text/plain'}},res);assert.equal(res.statusCode,415);
 res=response();await handler(request({...valid,turnstile_token:''}),res);assert.equal(res.statusCode,422);
 assert.equal(calls,0);
});
test('Turnstile hostname mismatch prevents CRM persistence',async()=>{
 configure(true);let calls=0;
 globalThis.fetch=async url=>{calls++;assert.equal(String(url),'https://challenges.cloudflare.com/turnstile/v0/siteverify');return new Response(JSON.stringify({success:true,hostname:'wrong.example.invalid'}),{status:200});};
 const res=response();await handler(request(valid),res);assert.equal(res.statusCode,403);assert.equal(res.body.error,'verification_failed');assert.equal(calls,1);
});
test('only a verified challenge reaches allowlisted CRM lead fields and holds notifications',async()=>{
 configure(true);const urls=[];
 globalThis.fetch=async (url,options)=>{
  urls.push(String(url));
  if(urls.length===1){
   assert.equal(String(url),'https://challenges.cloudflare.com/turnstile/v0/siteverify');
   assert.ok(String(options.body).includes('synthetic-proof'));
   return new Response(JSON.stringify({success:true,hostname:new URL(site).hostname}),{status:200});
  }
  assert.equal(String(url),'https://crm.example.invalid/internal/lead');
  assert.equal(options.headers['x-rrs-internal-key'],'i'.repeat(40));
  const body=JSON.parse(options.body);
  assert.equal(body.source,'Website Form');assert.equal(body.consent_to_contact,true);
  assert.equal(body.turnstile_token,undefined);assert.equal(body.website_company,undefined);
  assert.equal(body.email,valid.email);assert.equal(body.request_key,valid.request_key);
  return new Response(JSON.stringify({success:true,lead_id:leadId,notification_status:'held'}),{status:202});
 };
 const res=response();await handler(request(valid),res);
 assert.equal(res.statusCode,202);assert.equal(res.body.lead_id,leadId);assert.equal(res.body.notification_status,'held');assert.equal(urls.length,2);
});
test('CRM rejection never reports a successful submission',async()=>{
 configure(true);let calls=0;
 globalThis.fetch=async url=>{calls++;return new Response(JSON.stringify(calls===1?{success:true,hostname:new URL(site).hostname}:{error:'intake_not_enabled'}),{status:calls===1?200:503});};
 const res=response();await handler(request(valid),res);assert.equal(res.statusCode,503);assert.equal(res.body.error,'submission_not_confirmed');
});
test.after(()=>{globalThis.fetch=savedFetch;for(const [key,value] of Object.entries(original)){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
