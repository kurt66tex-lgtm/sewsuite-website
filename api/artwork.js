// Private Sew Suite artwork relay. Do not enable until ownership, antivirus,
// S3 CORS and customer delivery acceptance are verified.
const allowed=new Set(['prepare','commit']);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 const action=String(req.query?.action||'');
 if(req.method==='GET')return res.status(200).json({available:false});
 if(!allowed.has(action))return res.status(404).json({error:'not_found'});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_PRODUCTION_ARTWORK_ENABLED!=='true'||!process.env.RRS_ARTWORK_GATEWAY_ORIGIN||!process.env.RRS_ARTWORK_INTERNAL_KEY)return res.status(503).json({error:'artwork_not_enabled'});
 if(req.headers.origin!==process.env.RRS_PUBLIC_SITE_ORIGIN)return res.status(403).json({error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json')||Buffer.byteLength(JSON.stringify(req.body||{}))>4000)return res.status(422).json({error:'invalid_payload'});
 let target;try{target=new URL(process.env.RRS_ARTWORK_GATEWAY_ORIGIN);if(target.protocol!=='https:'||target.pathname!=='/'||target.search||target.username||target.password)throw Error()}catch{return res.status(503).json({error:'storage_unavailable'})}
 try{
  const upstream=await fetch(new URL('/internal/artwork/'+action,target),{method:'POST',headers:{'content-type':'application/json','x-rrs-artwork-key':process.env.RRS_ARTWORK_INTERNAL_KEY},body:JSON.stringify(req.body),signal:AbortSignal.timeout(12000)});
  const data=await upstream.json().catch(()=>({error:'artwork_unavailable'}));
  return res.status(upstream.status).json(data);
 }catch{return res.status(503).json({error:'artwork_unavailable'})}
}
