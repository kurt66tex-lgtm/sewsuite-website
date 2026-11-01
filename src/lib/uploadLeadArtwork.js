// Upload artwork only after a confirmed CRM lead provides a scoped capability.
const supported=new Set(['image/jpeg','image/png','image/webp','application/pdf']);
export async function uploadLeadArtwork(file,capability,{fetchImpl=fetch,cryptoImpl=crypto}={}){
 if(!capability||!supported.has(file.type)||file.size<1||file.size>10*1024*1024)throw Error('unsupported_artwork');
 if(!/^[A-Za-z0-9 _().-]{1,120}$/.test(file.name))throw Error('invalid_filename');
 const ext=file.name.split('.').pop().toLowerCase();
 if(!({'image/jpeg':['jpg','jpeg'],'image/png':['png'],'image/webp':['webp'],'application/pdf':['pdf']}[file.type]||[]).includes(ext))throw Error('file_extension_mismatch');
 const bytes=await file.arrayBuffer();
 const digest=await cryptoImpl.subtle.digest('SHA-256',bytes);
 const sha256=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 const auth={lead_id:capability.lead_id,request_key:capability.request_key,artwork_token:capability.artwork_token};
 const prepared=await fetchImpl('/api/artwork?action=prepare',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...auth,filename:file.name,content_type:file.type,size:file.size,sha256})});
 const intent=await prepared.json().catch(()=>({}));
 if(!prepared.ok||!intent.intent_id||!intent.upload_url)throw Error('artwork_prepare_failed');
 const url=new URL(intent.upload_url);
 if(url.protocol!=='https:')throw Error('upload_url_invalid');
 const uploaded=await fetchImpl(url.href,{method:'PUT',headers:{'content-type':file.type},body:bytes});
 if(!uploaded.ok)throw Error('artwork_upload_failed');
 const committed=await fetchImpl('/api/artwork?action=commit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...auth,intent_id:intent.intent_id})});
 const result=await committed.json().catch(()=>({}));
 if(!committed.ok||result.success!==true||!result.file_id)throw Error('artwork_commit_unverified');
 return result.file_id;
}
