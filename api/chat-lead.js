// Confirmed production Sew Suite chat lead, gated separately from conversation AI.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const ready=process.env.RRS_PRODUCTION_CHAT_LEADS_ENABLED==='true'&&!!process.env.RRS_INTAKE_API_ORIGIN&&!!process.env.RRS_INTERNAL_INTAKE_KEY&&!!process.env.RRS_TURNSTILE_SECRET_KEY;
 if(req.method==='GET')return res.status(200).json({available:ready});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(!ready)return res.status(503).json({error:'lead_intake_not_ready'});
 if(req.headers.origin!==process.env.RRS_PUBLIC_SITE_ORIGIN)return res.status(403).json({error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json')||Buffer.byteLength(JSON.stringify(req.body||{}))>18000)return res.status(413).json({error:'invalid_payload'});
 const v=req.body;
 if(v?.confirmed!==true||v?.consent_to_contact!==true||typeof v.turnstile_token!=='string'||!v.turnstile_token)return res.status(422).json({error:'confirmation_required'});
 if(!Array.isArray(v.messages)||v.messages.length>24||v.messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>1500))return res.status(422).json({error:'conversation_invalid'});
 try{
  const challenge=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:process.env.RRS_TURNSTILE_SECRET_KEY,response:v.turnstile_token}),signal:AbortSignal.timeout(7000)});
  const verified=await challenge.json().catch(()=>({success:false}));
  if(!challenge.ok||!verified.success)return res.status(403).json({error:'verification_failed'});
  const u=new URL(process.env.RRS_INTAKE_API_ORIGIN);
  if(u.protocol!=='https:'||u.pathname!=='/'||u.username||u.password)throw Error('config');
  const lead={first_name:v.first_name,last_name:v.last_name,phone:v.phone,email:v.email,service_type:v.service_type,problem_description:v.problem_description,request_key:v.request_key,consent_to_contact:true,source:'AI Chat',transcript:v.messages};
  const r=await fetch(new URL('/internal/lead',u),{method:'POST',headers:{'content-type':'application/json','x-rrs-internal-key':process.env.RRS_INTERNAL_INTAKE_KEY},body:JSON.stringify(lead),signal:AbortSignal.timeout(12000)});
  const d=await r.json().catch(()=>({}));
  if(r.status!==202||d.success!==true||!d.lead_id)return res.status(503).json({error:'lead_not_confirmed'});
  return res.status(202).json({success:true,lead_id:d.lead_id,replayed:d.replayed===true,notification_status:d.notification_status||'held'});
 }catch{return res.status(503).json({error:'lead_unavailable'})}
}
