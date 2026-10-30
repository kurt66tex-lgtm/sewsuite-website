import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,randomUUID} from 'node:crypto';
import handler from '../api/artwork.js';
const approvalKey='x'.repeat(40),bridgeKey='y'.repeat(40);
const leadId=randomUUID(),requestKey='website_'+randomUUID().replaceAll('-','');
const token=createHmac('sha256',approvalKey).update(leadId+':'+requestKey).digest('hex');
const original={
 RRS_PRODUCTION_ARTWORK_ENABLED:process.env.RRS_PRODUCTION_ARTWORK_ENABLED,
 RRS_ARTWORK_GATEWAY_ORIGIN:process.env.RRS_ARTWORK_GATEWAY_ORIGIN,
 RRS_ARTWORK_INTERNAL_KEY:process.env.RRS_ARTWORK_INTERNAL_KEY,
 RRS_INTERNAL_INTAKE_KEY:process.env.RRS_INTERNAL_INTAKE_KEY,
 RRS_PUBLIC_SITE_ORIGIN:process.env.RRS_PUBLIC_SITE_ORIGIN
};
function configure(enabled){
 Object.assign(process.env,{
 RRS_PRODUCTION_ARTWORK_ENABLED:enabled?'true':'false',
 RRS_ARTWORK_GATEWAY_ORIGIN:'https://private-artwork.example.invalid',
 RRS_ARTWORK_INTERNAL_KEY:bridgeKey,
 RRS_INTERNAL_INTAKE_KEY:approvalKey,
 RRS_PUBLIC_SITE_ORIGIN:'https://preview.example.invalid'
 });
}
function req(action,body={},origin='https://preview.example.invalid'){
 return {method:'POST',query:{action},headers:{origin,'content-type':'application/json'},body};
}
function response(){
 return {headers:{},statusCode:null,body:null,setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};
}
const auth={lead_id:leadId,request_key:requestKey,artwork_token:token};
test('denied while feature flag is disabled',async()=>{
 configure(false);const res=response();await handler(req('prepare',auth),res);
 assert.equal(res.statusCode,503);
 const get=response();await handler({method:'GET',headers:{}},get);
 assert.deepEqual(get.body,{available:false});
});
test('reject forged lead ownership and cross-origin upload',async()=>{
 configure(true);const forged=response();
 await handler(req('prepare',{...auth,artwork_token:'0'.repeat(64)}),forged);
 assert.equal(forged.statusCode,403);
 assert.equal(forged.body.error,'lead_ownership_not_verified');
 const cross=response();await handler(req('prepare',auth,'https://evil.example.invalid'),cross);
 assert.equal(cross.statusCode,403);
});
test('prepare relays only allowlisted data after valid capability',async()=>{
 configure(true);const priorFetch=globalThis.fetch;let called=0;
 globalThis.fetch=async(uri,options)=>{
  called++;
  assert.equal(String(uri),'https://private-artwork.example.invalid/internal/artwork/prepare');
  assert.equal(options.headers['x-rrs-artwork-key'],bridgeKey);
  const payload=JSON.parse(options.body);
  assert.deepEqual(Object.keys(payload).sort(),['content_type','filename','lead_id','sha256','size']);
  assert.equal(payload.lead_id,leadId);
  assert.equal(payload.artwork_token,undefined);
  return new Response(JSON.stringify({intent_id:randomUUID(),upload_url:'https://private.example.invalid/signed'}),{status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const res=response();await handler(req('prepare',{...auth,filename:'example.png',content_type:'image/png',size:123,sha256:'a'.repeat(64)}),res);
  assert.equal(res.statusCode,200);
  assert.equal(called,1);
 }finally{globalThis.fetch=priorFetch}
});
test('commit rejects malformed intent ids and does not call upstream',async()=>{
 configure(true);const res=response();await handler(req('commit',{...auth,intent_id:'not-a-uuid'}),res);
 assert.equal(res.statusCode,422);
});
test('public endpoint refuses invalid method, action and oversized payload',async()=>{
 configure(true);
 let res=response();await handler(req('delete',auth),res);assert.equal(res.statusCode,404);
 res=response();await handler({...req('prepare',auth),method:'PUT'},res);assert.equal(res.statusCode,405);
 res=response();await handler(req('prepare',{...auth,extra:'x'.repeat(5000)}),res);assert.equal(res.statusCode,422);
});
test.after(()=>{for(const [k,v] of Object.entries(original)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});

test('commit of a valid lead-scoped intent relays only the required identifiers',async()=>{
 configure(true);
 const intent=randomUUID(),priorFetch=globalThis.fetch;let calls=0;
 globalThis.fetch=async(uri,options)=>{
  calls++;
  assert.equal(String(uri),'https://private-artwork.example.invalid/internal/artwork/commit');
  assert.equal(options.headers['x-rrs-artwork-key'],bridgeKey);
  const body=JSON.parse(options.body);
  assert.deepEqual(Object.keys(body).sort(),['intent_id','lead_id']);
  assert.equal(body.lead_id,leadId);assert.equal(body.intent_id,intent);
  return new Response(JSON.stringify({success:true,file_id:randomUUID()}),{status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const res=response();await handler(req('commit',{...auth,intent_id:intent}),res);
  assert.equal(res.statusCode,200);assert.equal(res.body.success,true);assert.equal(calls,1);
 }finally{globalThis.fetch=priorFetch}
});
test('failed private artwork gateway cannot report upload success',async()=>{
 configure(true);
 const priorFetch=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({error:'artwork_not_confirmed'}),{status:422,headers:{'content-type':'application/json'}});
 try{
  const res=response();await handler(req('prepare',{...auth,filename:'reference.png',content_type:'image/png',size:123,sha256:'a'.repeat(64)}),res);
  assert.equal(res.statusCode,422);
  assert.equal(res.body.error,'artwork_not_confirmed');
 }finally{globalThis.fetch=priorFetch}
});
