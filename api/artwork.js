// Independent Sew Suite prelaunch artwork relay — disabled until private storage
// and CRM linking pass. No bucket credentials or public upload URLs in client.
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Robots-Tag','noindex,nofollow');
 if(req.method==='GET')return res.status(200).json({available:false,mode:'testing_hold'});
 if(req.method!=='POST')return res.status(405).json({error:'method_not_allowed'});
 if(process.env.RRS_ARTWORK_BRIDGE_ENABLED!=='true')return res.status(503).json({error:'artwork_upload_not_ready'});
 if(req.headers.origin!=='https://'+req.headers.host)return res.status(403).json({error:'origin_rejected'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'json_required'});
 const data=req.body;
 if(!data||typeof data!=='object'||Array.isArray(data)||Buffer.byteLength(JSON.stringify(data))>1500000)return res.status(413).json({error:'payload_rejected'});
 if(data.is_test_data!==true||typeof data.request_key!=='string'||!data.request_key.startsWith('synthetic_'))return res.status(503).json({error:'real_artwork_not_enabled'});
 if(!process.env.RRS_ARTWORK_GATEWAY_URL||!process.env.RRS_VOICE_BRIDGE_KEY)return res.status(503).json({error:'storage_unavailable'});
 try{
  const result=await fetch(process.env.RRS_ARTWORK_GATEWAY_URL.replace(/\/$/,'')+'/test-upload',{
   method:'POST',headers:{origin:'https://rrs-voice-proxy.internal','content-type':'application/json','x-rrs-test-key':process.env.RRS_VOICE_BRIDGE_KEY},
   body:JSON.stringify(data),signal:AbortSignal.timeout(25000)
  });
  res.status(result.status).setHeader('Content-Type','application/json; charset=utf-8');
  return res.send((await result.text()).slice(0,5000));
 }catch{return res.status(503).json({error:'artwork_storage_unavailable'})}
}
