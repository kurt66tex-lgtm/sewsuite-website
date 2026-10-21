// Sew Suite production Vercel intake relay. Fail closed until API, captcha,
// abuse controls and notification workflow pass release acceptance.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET')return res.status(200).json({available:process.env.RRS_PRODUCTION_INTAKE_ENABLED==='true'&&!!process.env.RRS_INTAKE_API_ORIGIN&&!!process.env.RRS_INTERNAL_INTAKE_KEY&&!!process.env.RRS_TURNSTILE_SECRET_KEY});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_PRODUCTION_INTAKE_ENABLED!=='true'||!process.env.RRS_INTAKE_API_ORIGIN||!process.env.RRS_INTERNAL_INTAKE_KEY||!process.env.RRS_TURNSTILE_SECRET_KEY)return res.status(503).json({error:'intake_not_available'});
 if(req.headers.origin!==process.env.RRS_PUBLIC_SITE_ORIGIN)return res.status(403).json({error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
 const body=req.body;
 if(!body||Array.isArray(body)||typeof body!=='object'||Buffer.byteLength(JSON.stringify(body))>12000)return res.status(422).json({error:'invalid_payload'});
 if(typeof body.website_company==='string'&&body.website_company.trim())return res.status(200).json({success:false,submission_confirmed:false});
 if(typeof body.turnstile_token!=='string'||!body.turnstile_token||body.turnstile_token.length>2100)return res.status(422).json({error:'verification_required'});
 let origin;try{origin=new URL(process.env.RRS_INTAKE_API_ORIGIN);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.username||origin.password||origin.search||origin.hash)throw Error()}catch{return res.status(503).json({error:'api_origin_invalid'})}
 try{
  const challenge=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',
   headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:process.env.RRS_TURNSTILE_SECRET_KEY,response:body.turnstile_token}),
   signal:AbortSignal.timeout(7000)});
  const verified=await challenge.json().catch(()=>({success:false}));
  if(!verified.success||!challenge.ok||verified.hostname!==new URL(process.env.RRS_PUBLIC_SITE_ORIGIN).hostname)return res.status(403).json({error:'verification_failed'});
  const fields=['first_name','last_name','phone','email','service_type','problem_description','request_key'];
  const lead=Object.fromEntries(fields.map(k=>[k,body[k]]));
  lead.consent_to_contact=body.consent_to_contact===true;
  lead.intake_answers=body.intake_answers;
  lead.source='Website Form';
  const result=await fetch(new URL('/internal/lead',origin),{
   method:'POST',headers:{'content-type':'application/json','x-rrs-internal-key':process.env.RRS_INTERNAL_INTAKE_KEY},
   body:JSON.stringify(lead),signal:AbortSignal.timeout(12000)});
  const data=await result.json().catch(()=>({}));
  if(result.status!==202||data.success!==true||!data.lead_id)return res.status(503).json({error:'submission_not_confirmed'});
  return res.status(202).json({success:true,lead_id:data.lead_id,replayed:data.replayed===true,notification_status:data.notification_status||'held',...(process.env.RRS_PRODUCTION_ARTWORK_ENABLED==='true'&&/^[a-f0-9]{64}$/.test(data.artwork_token||'')?{artwork_token:data.artwork_token}:{})});
 }catch{return res.status(503).json({error:'submission_unavailable'})}
}
