// Explicitly confirmed AI-chat lead handoff. Production calls remain disabled
// until an authorized testing DB function and CRM email workflow are verified.
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Robots-Tag','noindex,nofollow');
 if(req.method==='GET')return res.status(200).json({available:false,mode:'awaiting_crm_acceptance'});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_CHAT_CRM_BRIDGE_ENABLED!=='true')return res.status(503).json({error:'chat_crm_not_enabled'});
 if(req.headers.origin!=='https://'+req.headers.host)return res.status(403).json({error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
 const body=req.body;
 if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>14000)return res.status(413).json({error:'invalid_payload'});
 if(body.confirmed!==true||body.consent_to_contact!==true||body.email!=='synthetic@example.invalid')
   return res.status(503).json({error:'customer_lead_submission_held'});
 if(!process.env.RRS_VOICE_GATEWAY_URL||!process.env.RRS_VOICE_BRIDGE_KEY)return res.status(503).json({error:'crm_backend_unavailable'});
 try{
  const r=await fetch(process.env.RRS_VOICE_GATEWAY_URL.replace(/\/$/,'')+'/public/chat/lead',{
   method:'POST',headers:{origin:'https://rrs-voice-proxy.internal','content-type':'application/json','x-rrs-preview-chat-key':process.env.RRS_VOICE_BRIDGE_KEY},
   body:JSON.stringify(body),signal:AbortSignal.timeout(15000)
  });
  res.status(r.status).setHeader('Content-Type','application/json; charset=utf-8');
  return res.send((await r.text()).slice(0,3500));
 }catch{return res.status(503).json({error:'crm_backend_unavailable'})}
}
