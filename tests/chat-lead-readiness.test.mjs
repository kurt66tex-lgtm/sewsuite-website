import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/chat-lead.js';

const keys=['VERCEL_ENV','RRS_PRODUCTION_CHAT_LEADS_ENABLED','RRS_INTAKE_API_ORIGIN','RRS_INTERNAL_INTAKE_KEY','RRS_TURNSTILE_SECRET_KEY','RRS_PUBLIC_SITE_ORIGIN'];
const originals=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const originalFetch=globalThis.fetch;
function setup(on=true){
 Object.assign(process.env,{VERCEL_ENV:'production',RRS_PRODUCTION_CHAT_LEADS_ENABLED:on?'true':'false',RRS_INTAKE_API_ORIGIN:'https://private-crm.example.invalid',
  RRS_INTERNAL_INTAKE_KEY:'x'.repeat(40),RRS_TURNSTILE_SECRET_KEY:'y'.repeat(40),RRS_PUBLIC_SITE_ORIGIN:'https://sewsuite-authentic-comparison.vercel.app'});
}
function response(){return {statusCode:null,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(x){this.body=x;return this;}}}
const site='https://sewsuite-authentic-comparison.vercel.app';
test('disabled chat leads cannot create a CRM request',async()=>{
 setup(false);let n=0;globalThis.fetch=async()=>{n++;throw Error('unexpected')};
 const r=response();await handler({method:'GET',headers:{}},r);
 assert.deepEqual(r.body,{available:false});assert.equal(n,0);
 const post=response();await handler({method:'POST',headers:{origin:site,'content-type':'application/json'},body:{}},post);
 assert.equal(post.statusCode,503);assert.equal(n,0);
});
test('chat availability requires independently ready and enabled Railway intake',async()=>{
 setup(true);let calls=0;
 globalThis.fetch=async url=>{calls++;assert.equal(String(url),'https://private-crm.example.invalid/ready');
 return new Response(JSON.stringify({configured:true,public_intake_enabled:false}),{status:200});};
 let r=response();await handler({method:'GET',headers:{}},r);
 assert.deepEqual(r.body,{available:false});assert.equal(calls,1);
 globalThis.fetch=async()=>new Response(JSON.stringify({configured:true,public_intake_enabled:true}),{status:200});
 r=response();await handler({method:'GET',headers:{}},r);assert.deepEqual(r.body,{available:true});
 globalThis.fetch=async()=>{throw Error('backend offline')};
 r=response();await handler({method:'GET',headers:{}},r);assert.deepEqual(r.body,{available:false});
});
test('cross-origin and non-consented chat requests fail before any provider calls',async()=>{
 setup(true);let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected')};
 const body={confirmed:true,consent_to_contact:true,turnstile_token:'not-a-real-token',messages:[]};
 let r=response();await handler({method:'POST',headers:{origin:'https://attacker.example.invalid','content-type':'application/json'},body},r);
 assert.equal(r.statusCode,403);
 r=response();await handler({method:'POST',headers:{origin:site,'content-type':'application/json'},body:{...body,consent_to_contact:false}},r);
 assert.equal(r.statusCode,422);assert.equal(calls,0);
});
test('server-side Cloudflare hostname must equal configured preview origin',async()=>{
 setup(true);let calls=0;globalThis.fetch=async target=>{
  calls++;assert.equal(String(target),'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  return new Response(JSON.stringify({success:true,hostname:'wrong.example.invalid'}),{status:200});
 };
 const req={method:'POST',headers:{origin:site,'content-type':'application/json'},
  body:{confirmed:true,consent_to_contact:true,turnstile_token:'synthetic',messages:[]}};
 const r=response();await handler(req,r);assert.equal(r.statusCode,403);assert.equal(calls,1);
});
test.after(()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(originals)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});
