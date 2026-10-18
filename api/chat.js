// Sew Suite independent staging-only chat proxy. Never sends the OpenAI key to visitors.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex,nofollow');
 const mode=String(req.query?.action||'message');
 if(mode!=='message'&&mode!=='status')return res.status(404).json({error:'not_found'});
 if(req.method!==(mode==='status'?'GET':'POST'))return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_CHAT_BRIDGE_ENABLED!=='true'||!process.env.RRS_VOICE_GATEWAY_URL||!process.env.RRS_VOICE_BRIDGE_KEY)
  return res.status(503).json({error:'chat_preview_unavailable'});
 if(req.method==='POST'){
  if(req.headers.origin!=='https://'+req.headers.host)return res.status(403).json({error:'origin_rejected'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
  if(Buffer.byteLength(JSON.stringify(req.body||{}))>14000)return res.status(413).json({error:'payload_too_large'});
 }
 try{
  const visitor=String(req.headers['x-rrs-preview-visitor']||'');
  const r=await fetch(process.env.RRS_VOICE_GATEWAY_URL.replace(/\/$/,'')+'/public/chat/'+mode,{
   method:req.method,
   headers:{'content-type':'application/json',origin:'https://rrs-voice-proxy.internal','x-rrs-preview-chat-key':process.env.RRS_VOICE_BRIDGE_KEY,'x-rrs-preview-visitor':visitor},
   ...(mode==='message'?{body:JSON.stringify(req.body||{})}:{}),signal:AbortSignal.timeout(20000)
  });
  res.status(r.status).setHeader('Content-Type','application/json; charset=utf-8');return res.send((await r.text()).slice(0,6000));
 }catch{return res.status(503).json({error:'chat_preview_unavailable'})}
}
