import {useEffect,useRef,useState} from 'react';
// Automatically verify and submit a conversational follow-up without another form.
export function useChatHandoff({open,enabled,siteKey}){
 const [status,setStatus]=useState('idle');
 const [artworkCapability,setArtworkCapability]=useState(null);
 const submitted=useRef(false),pending=useRef(null),attempted=useRef(false);
 const widget=useRef(null),processToken=useRef(null);
 const key=useRef('chat_'+crypto.randomUUID().replaceAll('-',''));
 processToken.current=async token=>{
  if(!pending.current||attempted.current||submitted.current)return;
  attempted.current=true;setStatus('saving');
  try{
   const {lead,messages}=pending.current;
   const response=await fetch('/api/chat-lead',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({...lead,request_key:key.current,
     confirmed:true,consent_to_contact:true,turnstile_token:token,messages:messages.map(m=>({role:m.role,content:m.content}))})
   });
   const result=await response.json().catch(()=>({}));
   if(response.status!==202||result.success!==true||!result.lead_id)
    throw Error('lead_not_confirmed');
   submitted.current=true;pending.current=null;
   if(typeof result.artwork_token==='string'&&result.artwork_token.length===64&&result.request_key===key.current)setArtworkCapability({lead_id:result.lead_id,request_key:key.current,artwork_token:result.artwork_token});
   setStatus('saved');
  }catch{
   // A failed response can conceal a committed lead: no automatic replay.
   setStatus('failed');
  }
 };
 useEffect(()=>{
  if(!open||!enabled||!siteKey)return;
  let active=true,instance=null,script=null;
  const mount=()=>{
   if(!active||!window.turnstile||!document.getElementById('sew-chat-turnstile'))return;
   instance=window.turnstile.render('#sew-chat-turnstile',{
    sitekey:siteKey,execution:'execute',appearance:'interaction-only',
    callback:token=>{if(active)void processToken.current?.(token)},
    'error-callback':()=>{if(active)setStatus('failed')},
    'expired-callback':()=>{if(active&&pending.current)setStatus('failed')}
   });
   widget.current=instance;
   if(pending.current)window.turnstile.execute(instance);
  };
  if(window.turnstile)mount();
  else{
   script=document.createElement('script');
   script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
   script.async=true;script.onload=mount;
   script.onerror=()=>{if(active)setStatus('failed')};
   document.head.appendChild(script);
  }
  return ()=>{
   active=false;
   if(instance!==null&&window.turnstile)try{window.turnstile.remove(instance)}catch{}
   if(widget.current===instance)widget.current=null;
   script?.remove();
  };
 },[open,enabled,siteKey]);
 function start(lead,messages){
  if(!open||!enabled||!siteKey||submitted.current||pending.current||attempted.current)return;
  if(!lead||!Array.isArray(messages)||messages.length<2)return;
  pending.current={lead,messages};setStatus('verifying');
  if(widget.current!==null&&window.turnstile){
   try{window.turnstile.execute(widget.current)}catch{setStatus('failed')}
  }
 }
 return {status,start,artworkCapability};
}
