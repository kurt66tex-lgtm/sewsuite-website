import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/chat-lead.js';

const keys=['VERCEL_ENV','RRS_PRODUCTION_CHAT_LEADS_ENABLED','RRS_INTAKE_API_ORIGIN','RRS_INTERNAL_INTAKE_KEY','RRS_TURNSTILE_SECRET_KEY','RRS_PUBLIC_SITE_ORIGIN'];
const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
const previousFetch=globalThis.fetch;
const transcript=[
 {role:'assistant',content:'What project are you planning?'},
 {role:'user',content:'I need 24 embroidered caps.'},
 {role:'assistant',content:'Please provide your contact details.'},
 {role:'user',content:'Synthetic Tester, 214-555-0134, fake@example.com.'},
 {role:'assistant',content:'May the Sew Suite team follow up with you about the project?'},
 {role:'user',content:'Yes please'}
];
function mockResponse(){return {code:null,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}}}
function setup(){
 Object.assign(process.env,{VERCEL_ENV:'production',RRS_PRODUCTION_CHAT_LEADS_ENABLED:'true',
  RRS_INTAKE_API_ORIGIN:'https://intake.example.invalid',RRS_INTERNAL_INTAKE_KEY:'x'.repeat(40),
  RRS_TURNSTILE_SECRET_KEY:'y'.repeat(40),RRS_PUBLIC_SITE_ORIGIN:'https://www.sewsuite.com'});
}
function body(id){return {first_name:'Synthetic',last_name:'Tester',phone:'2145550134',
 email:'fake@example.com',service_type:'Custom Embroidery',
 problem_description:'24 embroidered caps with our existing business logo',
 confirmed:true,consent_to_contact:true,turnstile_token:'fake-test-token',
 request_key:'chat_'+'a'.repeat(32),conversation_id:id,messages:transcript};}
test('verified chat handoff forwards exact conversation ID without changing lead receipt',async()=>{
 setup();
 const seen=[];
 globalThis.fetch=async (url,opts)=>{
  seen.push(String(url));
  if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'www.sewsuite.com'});
  const received=JSON.parse(opts.body);
  assert.equal(received.conversation_id,'a'.repeat(24));
  assert.equal(received.transcript.length,6);
  assert.equal(received.source,'AI Chat');
  return Response.json({success:true,lead_id:'11111111-1111-4111-8111-111111111111'},{status:202});
 };
 const res=mockResponse();await handler({method:'POST',headers:{origin:'https://www.sewsuite.com','content-type':'application/json'},body:body('a'.repeat(24))},res);
 assert.equal(res.code,202);
 assert.equal(res.body.success,true);
 assert.equal(seen.length,2);
});
test('invalid conversation IDs never reach the restricted intake service',async()=>{
 setup();
 let received;
 globalThis.fetch=async (url,opts)=>{
  if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'www.sewsuite.com'});
  received=JSON.parse(opts.body);
  return Response.json({success:true,lead_id:'11111111-1111-4111-8111-111111111111'},{status:202});
 };
 const res=mockResponse();await handler({method:'POST',headers:{origin:'https://www.sewsuite.com','content-type':'application/json'},body:body('../bad')},res);
 assert.equal(res.code,202);
 assert.equal(Object.hasOwn(received,'conversation_id'),false);
});
test.after(()=>{for(const k of keys)old[k]===undefined?delete process.env[k]:process.env[k]=old[k];globalThis.fetch=previousFetch;});
