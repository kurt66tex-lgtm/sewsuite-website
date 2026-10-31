import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,PhoneOff,X,Loader2} from 'lucide-react';
import {useBusinessSettings} from '@/hooks/useBusinessSettings';
import {visitorSaidGoodbye,receptionistSaidGoodbye,canCloseNaturally} from '@/lib/voiceClosing';

async function voiceRequest(action,data){
 const response=await fetch('/api/voice?action='+encodeURIComponent(action),{
  method:action==='status'?'GET':'POST',
  credentials:'same-origin',
  ...(action==='status'?{}:{headers:{'content-type':'application/json'},body:JSON.stringify(data||{})})
 });
 const json=await response.json().catch(()=>({}));
 if(!response.ok)throw Error(json.error||'voice_service_unavailable');
 return json;
}
async function waitForIce(pc){
 if(pc.iceGatheringState==='complete')return;
 await new Promise(resolve=>{
  const timer=setTimeout(done,5000);
  function done(){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',done);resolve();}
  pc.addEventListener('icegatheringstatechange',done);
 });
}
export default function VoiceCallWidget(){
 const {settings}=useBusinessSettings();
 const [open,setOpen]=useState(false),[available,setAvailable]=useState(false);
 const [phase,setPhase]=useState('idle'),[caption,setCaption]=useState(''),[muted,setMuted]=useState(false);
 const [error,setError]=useState('');
 const state=useRef({pc:null,media:null,audio:null,dc:null,session:null,token:null,seconds:0,finalized:false,timer:null,goodbyeTimer:null,visitorTranscript:'',assistantTranscript:'',visitorGoodbye:false,assistantGoodbye:false,crmSaved:false,crmPending:false});
 const assistantName=settings?.chat_assistant_name||'Sew Suite Assistant';
 useEffect(()=>{
  let active=true;
  voiceRequest('status').then(v=>{if(active)setAvailable(v.available===true&&v.website_enabled===true)}).catch(()=>{if(active)setAvailable(false)});
  return ()=>{active=false;const s=state.current;if(s.timer)clearTimeout(s.timer);if(s.goodbyeTimer)clearTimeout(s.goodbyeTimer);s.dc?.close();s.pc?.close();s.media?.getTracks().forEach(t=>t.stop());if(s.audio)s.audio.srcObject=null};
 },[]);
 function clean(){
  const s=state.current;
  if(s.timer)clearTimeout(s.timer);
  if(s.goodbyeTimer)clearTimeout(s.goodbyeTimer);
  try{s.dc?.close();s.pc?.close();s.media?.getTracks().forEach(t=>t.stop());if(s.audio){s.audio.pause();s.audio.srcObject=null;}}catch{}
  state.current={pc:null,media:null,audio:null,dc:null,session:null,token:null,seconds:0,finalized:false,timer:null,goodbyeTimer:null,visitorTranscript:'',assistantTranscript:'',visitorGoodbye:false,assistantGoodbye:false,crmSaved:false,crmPending:false};
  setMuted(false);setPhase('idle');
 }
 async function finalize(reason){
  const s=state.current;
  if(s.finalized||!s.session||!s.token)return;
  s.finalized=true;
  try{await voiceRequest('finalize',{session_id:s.session,runtime_token:s.token,usage_seconds:s.seconds,close_reason:reason});}catch{setError('Call ended, but the usage receipt could not be confirmed.');}
 }
 async function end(reason='visitor_hangup'){
  // Silence the microphone and remote audio immediately; don't wait for HTTP.
  const receipt=finalize(reason);
  clean();setOpen(false);
  await receipt;
 }
 function maybeCloseAfterFarewell(){
  const s=state.current;
  if(s.goodbyeTimer)clearTimeout(s.goodbyeTimer);
  if(!canCloseNaturally(s))return;
  // Live transcript deltas are not exact speech-turn boundaries. Allow the
  // final spoken goodbye to finish, resetting the timer on later deltas.
  s.goodbyeTimer=setTimeout(()=>{
   if(state.current===s&&canCloseNaturally(s))void end('natural_goodbye');
  },4000);
 }
 async function connect(){
  if(!available||phase!=='idle')return;
  setPhase('starting');setError('');setCaption('');
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone access is unavailable in this browser.');
   const media=await navigator.mediaDevices.getUserMedia({audio:true});state.current.media=media;
   const pc=new RTCPeerConnection();state.current.pc=pc;
   media.getTracks().forEach(track=>pc.addTrack(track,media));
   const audio=new Audio();audio.autoplay=true;state.current.audio=audio;
   pc.ontrack=e=>{audio.srcObject=e.streams?.[0]||new MediaStream([e.track]);audio.play().catch(()=>{})};
   const dc=pc.createDataChannel('oai-events');state.current.dc=dc;
   dc.onmessage=async e=>{
    let v;try{v=JSON.parse(e.data)}catch{return}
    // GPT-Live Responses delegation: execute only the confirmed CRM tool through
    // our authenticated server proxy, then return the result and resume speech.
    if(v.type==='response.event'&&v.event?.type==='response.output_item.done'&&v.event?.item?.type==='function_call'){
      const call=v.event.item;
      if(call.name!=='create_service_request'||!call.call_id)return;
      const s=state.current;
      if(!s.session||!s.token||s.dc!==dc||dc.readyState!=='open')return;
      setCaption('Saving confirmed test inquiry…');
      s.crmPending=true;
      if(s.goodbyeTimer)clearTimeout(s.goodbyeTimer);
      let outcome;
      try{
        const result=await voiceRequest('tool',{session_id:s.session,runtime_token:s.token,tool_call_id:call.call_id,tool_name:call.name,arguments:call.arguments});
        // Keep the UUID in the private CRM. Never put it into a spoken
        // model tool result or a customer-facing caption.
        outcome=result?.result?.success===true?{success:true,confirmation:'Your inquiry has been sent to our team for review.'}:{success:false,error:'not_confirmed'};
      }catch{outcome={success:false,error:'crm_submission_unavailable'};}
      s.crmPending=false;
      s.crmSaved=outcome.success===true;
      if(dc.readyState==='open'){
        dc.send(JSON.stringify({type:'response.item.create',item:{type:'function_call_output',call_id:call.call_id,output:JSON.stringify(outcome)}}));
        dc.send(JSON.stringify({type:'response.create'}));
      }
      setCaption(outcome.success?'Your inquiry was sent to the team.':'Inquiry not saved. Please contact the team.');
      maybeCloseAfterFarewell();
      return;
    }
    if(v.type==='session.started'){setPhase('connected');setCaption('Connected. Start speaking.');}
    if(v.type==='session.usage.updated'){state.current.seconds=Math.max(state.current.seconds,Number(v.usage?.seconds||0))}
    if(v.type==='session.input_transcript.delta'){
      const s=state.current;
      s.visitorTranscript=(s.visitorTranscript+String(v.delta||'')).slice(-360);
      s.visitorGoodbye=visitorSaidGoodbye(s.visitorTranscript);
      maybeCloseAfterFarewell();
    }
    if(v.type==='session.output_transcript.delta'){
      const s=state.current;
      s.assistantTranscript=(s.assistantTranscript+String(v.delta||'')).slice(-450);
      s.assistantGoodbye=receptionistSaidGoodbye(s.assistantTranscript);
      setCaption(t=>(t+String(v.delta||'')).slice(-280));
      maybeCloseAfterFarewell();
    }
    if(v.type==='session.closed'){await finalize('session_closed');clean();setOpen(false)}
    if(v.type==='error')setError('The voice connection reported an error.');
   };
   const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitForIce(pc);
   const data=await voiceRequest('session',{sdp:pc.localDescription?.sdp});
   if(!data?.transport?.sdp||!data.session_id||!data.runtime_token)throw Error('Voice session setup was incomplete.');
   Object.assign(state.current,{session:data.session_id,token:data.runtime_token});
   await pc.setRemoteDescription({type:'answer',sdp:data.transport.sdp});
   state.current.timer=setTimeout(()=>end(),Math.min(10,Math.max(1,Number(data.max_call_minutes||3)))*60000);
  }catch(ex){clean();setError(ex?.message||'Unable to connect.');}
 }
 function mute(){
  const next=!muted;state.current.media?.getAudioTracks().forEach(track=>{track.enabled=!next});setMuted(next);
 }
 return <>
  {!open&&<button type="button" onClick={()=>setOpen(true)}
   className="fixed bottom-[124px] right-3 sm:bottom-20 sm:right-4 z-50 inline-flex items-center gap-2 rounded-full border-2 p-2.5 sm:px-4 sm:py-3 shadow-lg transition hover:brightness-110"
   style={{backgroundColor:'var(--brand-chat-launcher-bg)',color:'var(--brand-chat-launcher-text)',borderColor:'var(--brand-chat-launcher-border)'}}
   aria-label="Talk with our virtual receptionist"><Mic className="w-4.5 h-4.5 sm:w-5 sm:h-5"/><span className="hidden sm:inline text-sm font-bold">Talk with us</span></button>}
  {open&&<div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 sm:w-80 z-[60] overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Voice assistant">
   <div className="flex items-center justify-between px-4 py-3" style={{backgroundColor:'var(--brand-chat-header-bg)'}}>
    <div><div className="text-sm font-bold" style={{color:'var(--brand-chat-header-accent)'}}>{assistantName}</div><div className="text-[11px] text-slate-300">AI project & quote assistant</div></div>
    <button onClick={()=>{end()}} aria-label="Close voice assistant" className="p-1 text-slate-300 hover:text-white"><X className="w-5 h-5"/></button>
   </div>
   <div className="p-4">
    {!available?<p className="text-sm text-slate-700">This comparison preview is not accepting voice conversations yet. The independent receptionist is being tested. Please use www.sewsuite.com for assistance.</p>:null}
    {available&&phase==='idle'&&<><p className="text-sm text-slate-700">Use your microphone to talk with the Sew Suite virtual receptionist. Testing calls do not submit customer orders.</p><button onClick={connect} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 font-bold text-brand-dark"><Mic className="w-4 h-4"/>Start Voice Conversation</button></>}
    {phase==='starting'&&<div className="py-8 text-center text-sm text-slate-600"><Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin"/>Connecting securely…</div>}
    {phase==='connected'&&<><div className="rounded-xl bg-slate-50 border border-slate-200 p-3 min-h-20 text-sm text-slate-600">{caption||'Listening…'}</div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={mute} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{muted?<MicOff className="w-4 h-4"/>:<Mic className="w-4 h-4"/>}{muted?'Unmute':'Mute'}</button><button onClick={end} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white"><PhoneOff className="w-4 h-4"/>End</button></div></>}
    {error&&<p className="mt-3 text-xs text-red-700">{error}</p>}
    <p className="mt-3 text-[10px] text-slate-400">Microphone permission is required. Preview conversations are for testing only.</p>
   </div>
  </div>}
 </>;
}
