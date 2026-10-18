// Independent quote-intake relay. Default disabled until production attachments
// and notifications are verified. Never trust browser tenant/test-data flags.
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Robots-Tag','noindex,nofollow');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET')return res.status(200).json({available:false,mode:'prelaunch_hold'});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_INTAKE_BRIDGE_ENABLED!=='true')return res.status(503).json({error:'quote_intake_not_ready'});
 const hostname=String(req.headers.host||'');
 if(req.headers.origin!=='https://'+hostname)return res.status(403).json({error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
 const body=req.body;
 if(!body||typeof body!=='object'||Array.isArray(body)||Buffer.byteLength(JSON.stringify(body))>14000)return res.status(413).json({error:'payload_rejected'});
 // This is intentionally limited to server-generated synthetic rehearsal traffic.
 // Visitor-entered quote forms remain held, including when the bridge is configured.
 if(body.request_key?.startsWith('synthetic-')!==true||body.email!=='synthetic@example.invalid')
  return res.status(503).json({error:'real_submissions_not_enabled'});
 if(!process.env.RRS_VOICE_GATEWAY_URL||!process.env.RRS_VOICE_BRIDGE_KEY)
  return res.status(503).json({error:'backend_not_configured'});
 try{
  const upstream=await fetch(process.env.RRS_VOICE_GATEWAY_URL.replace(/\/$/,'')+'/public/intake',{
   method:'POST',
   headers:{origin:'https://rrs-voice-proxy.internal','content-type':'application/json','x-rrs-test-key':process.env.RRS_VOICE_BRIDGE_KEY},
   body:JSON.stringify(body),
   signal:AbortSignal.timeout(15000)
  });
  const response=(await upstream.text()).slice(0,5000);
  res.status(upstream.status).setHeader('Content-Type','application/json; charset=utf-8');
  return res.send(response);
 }catch{return res.status(503).json({error:'quote_backend_unavailable'})}
}
