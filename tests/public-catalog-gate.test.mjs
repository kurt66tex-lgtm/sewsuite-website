import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/public-catalog.js';
const names=['RRS_PUBLIC_CATALOG_MODE','RRS_PUBLIC_CATALOG_ENABLED','RRS_PUBLIC_CATALOG_API_ORIGIN','RRS_PUBLIC_CATALOG_READ_KEY','RRS_APPROVED_PUBLIC_CATALOG_VERSION'];
const saved=Object.fromEntries(names.map(k=>[k,process.env[k]]));
const trustedKey='q'.repeat(40);
const approvedVersion='6b047765-b106-473d-aa3d-b2479ace966f';
const validData={
 BusinessSettings:[{business_name:'Sew Suite'}],
 ServiceType:Array.from({length:9},(_,i)=>({slug:'service-'+i,active:true,publicly_advertised:true})),
 ServiceArea:Array.from({length:20},(_,i)=>({slug:'city-'+i,active:true,indexable:true})),
 Brand:[],Review:[],
 PortfolioProject:Array.from({length:9},(_,i)=>({slug:'example-'+i,is_published:true,public_permission_confirmed:true})),
 PortfolioPhoto:[],ServiceIntakeQuestion:[]
};
function response(){return {statusCode:0,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(body){this.body=body;return this;}};}
function enable(){
 Object.assign(process.env,{RRS_PUBLIC_CATALOG_MODE:'independent',RRS_PUBLIC_CATALOG_ENABLED:'true',
 RRS_PUBLIC_CATALOG_API_ORIGIN:'https://private-catalog.example.invalid',RRS_PUBLIC_CATALOG_READ_KEY:trustedKey,
 RRS_APPROVED_PUBLIC_CATALOG_VERSION:approvedVersion});
}
test('preview mode is disabled by default and never calls private upstream',async()=>{
 process.env.RRS_PUBLIC_CATALOG_ENABLED='false';
 const res=response();await handler({method:'GET'},res);
 assert.equal(res.statusCode,503);
 assert.equal(res.body.error,'independent_catalog_not_enabled');
});
test('POST cannot reveal catalog or trigger a change',async()=>{
 enable();const res=response();await handler({method:'POST'},res);
 assert.equal(res.statusCode,405);
});
test('independent reads require correct gateway URL and reject credentials embedded in origin',async()=>{
 enable();process.env.RRS_PUBLIC_CATALOG_API_ORIGIN='http://private-catalog.example.invalid';
 const res=response();await handler({method:'GET'},res);assert.equal(res.statusCode,503);
 process.env.RRS_PUBLIC_CATALOG_API_ORIGIN='https://user:pass@private-catalog.example.invalid';
 const another=response();await handler({method:'GET'},another);assert.equal(another.statusCode,503);
});
test('public data read proxies safely and does not expose internal key',async()=>{
 enable();const original=globalThis.fetch;let called=0;
 globalThis.fetch=async(uri,opt)=>{
  called++;assert.equal(String(uri),'https://private-catalog.example.invalid/internal/catalog');
  assert.equal(opt.headers['x-rrs-public-catalog-key'],trustedKey);
  return new Response(JSON.stringify({tenant:'sew-suite',version:'6b047765-b106-473d-aa3d-b2479ace966f',
   data:validData}),{status:200,headers:{'content-type':'application/json'}});
 };
 try{
  const res=response();await handler({method:'GET'},res);
  assert.equal(res.statusCode,200);assert.equal(res.body.tenant,'sew-suite');
  assert.equal(called,1);assert.doesNotMatch(JSON.stringify(res.body),/qqqqqq/);
 }finally{globalThis.fetch=original}
});
test('missing or incorrect approved version refuses serving catalog',async()=>{
 enable();delete process.env.RRS_APPROVED_PUBLIC_CATALOG_VERSION;
 const noVersion=response();await handler({method:'GET'},noVersion);
 assert.equal(noVersion.statusCode,503);assert.equal(noVersion.body.error,'approved_catalog_version_required');
 enable();const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({tenant:'sew-suite',version:'00000000-0000-4000-8000-000000000000',data:validData}),{status:200});
 try{const mismatch=response();await handler({method:'GET'},mismatch);
 assert.equal(mismatch.statusCode,503);assert.equal(mismatch.body.error,'catalog_version_mismatch');
 assert.equal(mismatch.headers['Cache-Control'],'no-store');}
 finally{globalThis.fetch=original}
});
test('unapproved or malformed upstream documents are withheld',async()=>{
 enable();const original=globalThis.fetch;
 globalThis.fetch=async()=>new Response(JSON.stringify({tenant:'wrong',version:'x',data:validData}),{status:200});
 try{const res=response();await handler({method:'GET'},res);assert.equal(res.statusCode,503);}
 finally{globalThis.fetch=original}
});
test.after(()=>{for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v;}});
