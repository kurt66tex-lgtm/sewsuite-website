import { NextRequest, NextResponse } from "next/server";

// Dedicated Next.js route: distinct from the legacy Vite /api/intake endpoint.
// Always fail closed until the independent CRM, sender and Turnstile origin are accepted.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers={"cache-control":"no-store","x-content-type-options":"nosniff","x-robots-tag":"noindex,nofollow"};
const json=(body:Record<string,unknown>,status=200)=>NextResponse.json(body,{status,headers});
function config(){
 const origin=process.env.RRS_PUBLIC_SITE_ORIGIN;
 const backend=process.env.RRS_INTAKE_API_ORIGIN;
 const key=process.env.RRS_INTERNAL_INTAKE_KEY;
 const secret=process.env.RRS_TURNSTILE_SECRET_KEY;
 const enabled=process.env.RRS_PRODUCTION_INTAKE_ENABLED==="true";
 if(!enabled||!origin||!backend||!key||key.length<32||!secret)return null;
 try{
   const site=new URL(origin),api=new URL(backend);
   if(site.protocol!=="https:"||site.pathname!=="/"||site.search||site.hash||site.username||site.password)return null;
   if(api.protocol!=="https:"||api.pathname!=="/"||api.search||api.hash||api.username||api.password)return null;
   return {origin:site.origin,backend:api,key,secret};
 }catch{return null;}
}
export async function GET(){return json({available:!!config()});}
export async function POST(request:NextRequest){
 const cfg=config();
 if(!cfg)return json({error:"intake_not_available"},503);
 if(request.headers.get("origin")!==cfg.origin)return json({error:"origin_rejected"},403);
 if((request.headers.get("content-type")||"").split(";")[0]!=="application/json")return json({error:"json_required"},415);
 const contentLength=Number(request.headers.get("content-length")||0);
 if(contentLength>12000)return json({error:"payload_too_large"},413);
 let body:Record<string,unknown>;
 try{
   const raw=await request.text();
   if(Buffer.byteLength(raw)>12000)return json({error:"payload_too_large"},413);
   body=JSON.parse(raw);
   if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"invalid_payload"},422);
 }catch{return json({error:"invalid_json"},400);}
 if(typeof body.website_company==="string"&&body.website_company.trim())return json({error:"invalid_submission"},422);
 if(body.consent_to_contact!==true)return json({error:"consent_required"},422);
 const token=body.turnstile_token;
 if(typeof token!=="string"||token.length===0||token.length>2100)return json({error:"verification_required"},422);
 const fields=["first_name","last_name","phone","email","service_type","problem_description","request_key"];
 for(const field of fields)if(typeof body[field]!=="string"||!(body[field] as string).trim()||(body[field] as string).length>4000)return json({error:"invalid_fields"},422);
 let answers:Record<string,string>={};
 if(body.intake_answers&&typeof body.intake_answers==="object"&&!Array.isArray(body.intake_answers)){
   for(const [key,value] of Object.entries(body.intake_answers)){
     if(!/^[-_a-z0-9]{1,80}$/i.test(key)||typeof value!=="string"||value.length>300)return json({error:"invalid_answers"},422);
     answers[key]=value;
   }
 }
 try{
   const challenge=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
     method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},
     body:new URLSearchParams({secret:cfg.secret,response:token}),
     cache:"no-store",signal:AbortSignal.timeout(8000),
   });
   const verified=await challenge.json().catch(()=>({success:false,hostname:""})) as {success?:boolean,hostname?:string};
   if(!challenge.ok||verified.success!==true||verified.hostname!==new URL(cfg.origin).hostname)return json({error:"verification_failed"},403);
   const lead=Object.fromEntries(fields.map(field=>[field,body[field]]));
   const payload={...lead,consent_to_contact:true,intake_answers:answers,source:"Website Form"};
   const response=await fetch(new URL("/internal/lead",cfg.backend),{
      method:"POST",headers:{"content-type":"application/json","x-rrs-internal-key":cfg.key},
      body:JSON.stringify(payload),cache:"no-store",signal:AbortSignal.timeout(12000),
   });
   const result=await response.json().catch(()=>({})) as {success?:boolean,lead_id?:string,replayed?:boolean,notification_status?:string};
   if(response.status!==202||result.success!==true||!result.lead_id)return json({error:"submission_unconfirmed"},503);
   return json({success:true,lead_id:result.lead_id,replayed:result.replayed===true,notification_status:result.notification_status||"held"},202);
 }catch{
   // Network ambiguity means never claim that the lead was saved or mail sent.
   return json({error:"submission_unavailable"},503);
 }
}
