// Sew Suite: same-origin, lead-bound artwork relay. Public upload stays OFF until QA.
// A successful verified quote submission issues the only capability for its lead.
// Never accept arbitrary lead_ids, never expose the private gateway key.
import {createHmac,timingSafeEqual} from 'node:crypto';
const allowed=new Set(['prepare','commit']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const keyPattern=/^[-_A-Za-z0-9]{20,128}$/;
const hex64=/^[a-f0-9]{64}$/;
const json=(res,status,data)=>res.status(status).json(data);
const ready=()=>process.env.RRS_PRODUCTION_ARTWORK_ENABLED==='true'&&
 !!process.env.RRS_ARTWORK_GATEWAY_ORIGIN&&
 (process.env.RRS_ARTWORK_INTERNAL_KEY?.length||0)>=32&&
 (process.env.RRS_INTERNAL_INTAKE_KEY?.length||0)>=32&&
 !!process.env.RRS_PUBLIC_SITE_ORIGIN;
function validCapability(body){
 if(!uuid.test(body.lead_id||'')||!keyPattern.test(body.request_key||'')||
    !hex64.test(body.artwork_token||''))return false;
 const expected=createHmac('sha256',process.env.RRS_INTERNAL_INTAKE_KEY)
  .update(String(body.lead_id)+':'+String(body.request_key)).digest('hex');
 const provided=Buffer.from(body.artwork_token,'hex'),actual=Buffer.from(expected,'hex');
 return provided.length===actual.length&&timingSafeEqual(provided,actual);
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Robots-Tag','noindex,nofollow');
 if(req.method==='GET')return json(res,200,{available:ready()});
 const action=String(req.query?.action||'');
 if(!allowed.has(action))return json(res,404,{error:'not_found'});
 if(req.method!=='POST')return json(res,405,{error:'method_not_allowed'});
 if(!ready())return json(res,503,{error:'artwork_not_enabled'});
 if(req.headers.origin!==process.env.RRS_PUBLIC_SITE_ORIGIN)return json(res,403,{error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'json_required'});
 let body=req.body;
 if(!body||Array.isArray(body)||typeof body!=='object'||Buffer.byteLength(JSON.stringify(body))>4000)return json(res,422,{error:'invalid_payload'});
 if(!validCapability(body))return json(res,403,{error:'lead_ownership_not_verified'});
 const payload=action==='prepare'?
  {lead_id:body.lead_id,filename:body.filename,content_type:body.content_type,size:body.size,sha256:body.sha256}:
  {intent_id:body.intent_id,lead_id:body.lead_id};
 if(action==='commit'&&!uuid.test(payload.intent_id||''))return json(res,422,{error:'invalid_artwork_intent'});
 let target;
 try{
  target=new URL(process.env.RRS_ARTWORK_GATEWAY_ORIGIN);
  if(target.protocol!=='https:'||target.pathname!=='/'||target.search||target.username||target.password||target.hash)throw Error();
 }catch{return json(res,503,{error:'storage_unavailable'})}
 try{
  const upstream=await fetch(new URL('/internal/artwork/'+action,target),{
   method:'POST',headers:{'content-type':'application/json','x-rrs-artwork-key':process.env.RRS_ARTWORK_INTERNAL_KEY},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(12000)
  });
  const data=await upstream.json().catch(()=>({error:'artwork_unavailable'}));
  return json(res,upstream.status,data);
 }catch{return json(res,503,{error:'artwork_unavailable'})}
}
