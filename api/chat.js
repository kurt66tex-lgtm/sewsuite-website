// Independent production Sew Suite chat proxy. Public CRM/AI chat disabled by default.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const mode=String(req.query?.action||'message');
 if(!['status','message'].includes(mode))return res.status(404).json({error:'not_found'});
 if(req.method!==(mode==='status'?'GET':'POST'))return res.status(405).json({error:'method_not_allowed'});
 const enabled=process.env.RRS_PRODUCTION_CHAT_ENABLED==='true'&&!!process.env.RRS_INTAKE_API_ORIGIN&&!!process.env.RRS_INTERNAL_INTAKE_KEY;
 if(mode==='status'&&!enabled)return res.status(200).json({available:false});
 if(!enabled)return res.status(503).json({error:'chat_not_enabled'});
 if(mode==='message'){
  if(req.headers.origin!==process.env.RRS_PUBLIC_SITE_ORIGIN)return res.status(403).json({error:'origin_rejected'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
  if(!req.body||Buffer.byteLength(JSON.stringify(req.body))>30000)return res.status(413).json({error:'too_large'});
 }
 let url;try{url=new URL(process.env.RRS_INTAKE_API_ORIGIN);if(url.protocol!=='https:'||url.pathname!=='/'||url.username||url.password)throw Error()}catch{return res.status(503).json({error:'chat_backend_invalid'})}
 try{const x=await fetch(new URL('/internal/chat/'+mode,url),{method:req.method,headers:{'content-type':'application/json','x-rrs-internal-key':process.env.RRS_INTERNAL_INTAKE_KEY},...(mode==='message'?{body:JSON.stringify(req.body)}:{}),signal:AbortSignal.timeout(20000)});
 const data=await x.json().catch(()=>({error:'chat_unavailable'}));return res.status(x.status).json(data);
 }catch{return res.status(503).json({error:'chat_unavailable'})}
}
