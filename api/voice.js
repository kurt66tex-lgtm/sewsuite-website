// Protected prelaunch-only Vercel proxy. No provider or database credentials
// are sent to the browser. Keep off until Railway test gateway is certified.
const allowed=new Set(['status','session','tool','finalize']);
export default async function handler(req,res){
 const action=String(req.query?.action||'');
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Robots-Tag','noindex,nofollow');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!allowed.has(action))return res.status(404).json({error:'not_found'});
 if(req.method!==(action==='status'?'GET':'POST'))return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_VOICE_BRIDGE_ENABLED!=='true'||!process.env.RRS_VOICE_GATEWAY_URL||!process.env.RRS_VOICE_BRIDGE_KEY)
  return res.status(503).json({error:'independent_voice_not_enabled'});
 const host=String(req.headers.host||'');
 const origin=String(req.headers.origin||'');
 if(action!=='status'&&(origin!=='https://'+host||!host.endsWith('.vercel.app')))
  return res.status(403).json({error:'origin_rejected'});
 if(req.method==='POST'&&(!req.headers['content-type']?.startsWith('application/json')||Buffer.byteLength(JSON.stringify(req.body||{}))>48000))
  return res.status(413).json({error:'payload_rejected'});
 const base=process.env.RRS_VOICE_GATEWAY_URL.replace(/\/$/,'');
 try{
  const upstream=await fetch(base+'/public/voice/'+action,{
    method:req.method,
    headers:{'content-type':'application/json',origin:'https://rrs-voice-proxy.internal','x-rrs-preview-voice-key':process.env.RRS_VOICE_BRIDGE_KEY},
    ...(req.method==='POST'?{body:JSON.stringify(req.body||{})}:{}),
    signal:AbortSignal.timeout(18000)
  });
  const text=await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type','application/json; charset=utf-8');
  return res.send(text.slice(0,50000));
 }catch{return res.status(503).json({error:'independent_voice_temporarily_unavailable'})}
}
