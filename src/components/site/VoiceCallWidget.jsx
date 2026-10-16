import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Loader2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

function waitForIceGathering(pc, timeoutMs = 5000) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      pc.removeEventListener('icegatheringstatechange', onChange);
      clearTimeout(timer);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === 'complete') finish();
    };
    const timer = setTimeout(finish, timeoutMs);
    pc.addEventListener('icegatheringstatechange', onChange);
  });
}

export default function VoiceCallWidget() {
  const { settings } = useBusinessSettings();
  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [muted, setMuted] = useState(false);
  const [caption, setCaption] = useState('');
  const [assistantName, setAssistantName] = useState('Virtual Receptionist');
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const runtimeRef = useRef({ sessionId:null, token:null, usageSeconds:0, finalized:false });
  const transcriptRef = useRef('');
  const speakerRef = useRef(null);
  const timeoutRef = useRef(null);

  const loadStatus = async () => {
    try {
      const res = await base44.functions.invoke('voiceRuntime', { action:'status' });
      const data = res?.data || res || {};
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => cleanup(false), []);

  const appendTranscript = (speaker, delta) => {
    const text = String(delta || '');
    if (!text) return;
    if (speakerRef.current !== speaker) {
      transcriptRef.current += (transcriptRef.current ? '\n' : '') + '[' + speaker + '] ';
      speakerRef.current = speaker;
    }
    transcriptRef.current += text;
    setCaption(prev => (prev + text).slice(-280));
  };

  const finalize = async (reason = 'client_closed') => {
    const runtime = runtimeRef.current;
    if (runtime.finalized || !runtime.sessionId || !runtime.token) return;
    runtime.finalized = true;
    try {
      await base44.functions.invoke('voiceRuntime', {
        action:'finalize',
        session_id:runtime.sessionId,
        runtime_token:runtime.token,
        usage_seconds:runtime.usageSeconds || 0,
        transcript:transcriptRef.current.slice(0, 24000),
        close_reason:reason
      });
    } catch {
      // Finalization failure must not trap the visitor in the UI.
    }
  };

  const cleanup = (resetUi = true) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    try { dcRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    try { streamRef.current?.getTracks()?.forEach(t => t.stop()); } catch {}
    if (audioRef.current) {
      try { audioRef.current.pause(); } catch {}
      audioRef.current.srcObject = null;
    }
    dcRef.current = null;
    pcRef.current = null;
    streamRef.current = null;
    if (resetUi) {
      setPhase('idle');
      setMuted(false);
      setCaption('');
      runtimeRef.current = { sessionId:null, token:null, usageSeconds:0, finalized:false };
      transcriptRef.current = '';
      speakerRef.current = null;
    }
  };

  const runTool = async (item) => {
    const runtime = runtimeRef.current;
    if (!runtime.sessionId || !runtime.token || !dcRef.current || dcRef.current.readyState !== 'open') return;
    try {
      const res = await base44.functions.invoke('voiceRuntime', {
        action:'execute_tool',
        session_id:runtime.sessionId,
        runtime_token:runtime.token,
        tool_call_id:item.call_id,
        tool_name:item.name,
        arguments:item.arguments || '{}'
      });
      const data = res?.data || res || {};
      const output = JSON.stringify(data.result ?? { error:data.error || 'Tool execution failed.' });
      dcRef.current.send(JSON.stringify({
        type:'response.item.create',
        event_id:'tool_' + Date.now(),
        item:{ type:'function_call_output', call_id:item.call_id, output }
      }));
      dcRef.current.send(JSON.stringify({ type:'response.create', event_id:'continue_' + Date.now() }));
    } catch (e) {
      try {
        dcRef.current.send(JSON.stringify({
          type:'response.item.create',
          event_id:'tool_error_' + Date.now(),
          item:{ type:'function_call_output', call_id:item.call_id, output:JSON.stringify({ error:String(e?.message || 'Tool failed') }) }
        }));
        dcRef.current.send(JSON.stringify({ type:'response.create', event_id:'continue_error_' + Date.now() }));
      } catch {}
    }
  };

  const handleEvent = async (evt) => {
    if (!evt || typeof evt !== 'object') return;
    if (evt.type === 'session.started') {
      setPhase('connected');
      setCaption('Connected. Start speaking.');
      return;
    }
    if (evt.type === 'session.input_transcript.delta') {
      appendTranscript('Caller', evt.delta);
      return;
    }
    if (evt.type === 'session.output_transcript.delta') {
      appendTranscript('Assistant', evt.delta);
      return;
    }
    if (evt.type === 'session.usage.updated') {
      const seconds = Number(evt.usage?.seconds || 0);
      if (seconds >= runtimeRef.current.usageSeconds) runtimeRef.current.usageSeconds = seconds;
      return;
    }
    if (evt.type === 'response.event' && evt.event?.type === 'response.output_item.done') {
      const item = evt.event.item;
      if (item?.type === 'function_call' && item.call_id && item.name) await runTool(item);
      return;
    }
    if (evt.type === 'session.closed') {
      const seconds = Number(evt.usage?.seconds || runtimeRef.current.usageSeconds || 0);
      runtimeRef.current.usageSeconds = Math.max(runtimeRef.current.usageSeconds || 0, seconds);
      await finalize(evt.reason || 'session_closed');
      cleanup(true);
      setOpen(false);
      loadStatus();
      return;
    }
    if (evt.type === 'error') {
      setError(evt.error?.message || 'The voice session reported an error.');
    }
  };

  const startCall = async () => {
    if (phase === 'starting' || phase === 'connected') return;
    setError('');
    setCaption('');
    setPhase('starting');
    runtimeRef.current = { sessionId:null, token:null, usageSeconds:0, finalized:false };
    transcriptRef.current = '';
    speakerRef.current = null;

    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Voice calling is not supported in this browser.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      streamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const audio = new Audio();
      audio.autoplay = true;
      audioRef.current = audio;
      pc.ontrack = event => {
        audio.srcObject = event.streams?.[0] || new MediaStream([event.track]);
        audio.play().catch(() => {});
      };

      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;
      dc.onmessage = async event => {
        try { await handleEvent(JSON.parse(event.data)); } catch {}
      };
      dc.onerror = () => setError('The voice data connection encountered an error.');
      dc.onclose = async () => {
        if (runtimeRef.current.sessionId && !runtimeRef.current.finalized) await finalize('data_channel_closed');
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);
      const sdp = pc.localDescription?.sdp;
      if (!sdp) throw new Error('Unable to prepare the voice connection.');

      const res = await base44.functions.invoke('voiceRuntime', { action:'create_web_session', sdp });
      const data = res?.data || res || {};
      if (data.error) throw new Error(data.error);
      if (!data?.transport?.sdp || !data?.session_id || !data?.runtime_token) throw new Error('Voice session setup returned an incomplete response.');

      runtimeRef.current.sessionId = data.session_id;
      runtimeRef.current.token = data.runtime_token;
      setAssistantName(data.assistant_name || 'Virtual Receptionist');
      await pc.setRemoteDescription({ type:'answer', sdp:data.transport.sdp });

      const maxMinutes = Math.max(1, Number(data.max_call_minutes || 30));
      timeoutRef.current = setTimeout(() => endCall('max_duration'), maxMinutes * 60000);
    } catch (e) {
      await finalize('startup_failed');
      cleanup(true);
      setPhase('idle');
      const backendError = e?.response?.data?.error || e?.data?.error || e?.response?.data?.message;
      setError(String(backendError || e?.message || 'Unable to start the voice assistant.'));
    }
  };

  const endCall = async (reason = 'visitor_hangup') => {
    if (phase !== 'connected' && phase !== 'starting') {
      cleanup(true);
      setOpen(false);
      return;
    }
    setPhase('ending');
    try {
      if (dcRef.current?.readyState === 'open') {
        dcRef.current.send(JSON.stringify({ type:'session.close', event_id:'close_' + Date.now() }));
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    } catch {}
    await finalize(reason);
    cleanup(true);
    setOpen(false);
    loadStatus();
  };

  const toggleMute = () => {
    const next = !muted;
    streamRef.current?.getAudioTracks()?.forEach(track => { track.enabled = !next; });
    setMuted(next);
  };

  if (!status?.enabled || !status?.website_enabled || !status?.available) return null;

  return <>
    {!open && (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-[124px] right-3 sm:bottom-20 sm:right-4 z-50 inline-flex items-center gap-2 rounded-full border-2 p-2.5 sm:px-4 sm:py-3 shadow-lg transition hover:brightness-110"
        style={{ backgroundColor:'var(--brand-chat-launcher-bg)', color:'var(--brand-chat-launcher-text)', borderColor:'var(--brand-chat-launcher-border)' }}
        aria-label="Talk with our virtual receptionist"
      >
        <Mic className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline text-sm font-bold">Talk with us</span>
      </button>
    )}

    {open && (
      <div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 sm:w-80 z-[60] overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 text-white" style={{ backgroundColor:'var(--brand-chat-header-bg)' }}>
          <div>
            <div className="text-sm font-bold" style={{ color:'var(--brand-chat-header-accent)' }}>{assistantName}</div>
            <div className="text-[11px] text-slate-300">{isCustomApparel ? 'AI project & quote assistant' : 'AI virtual receptionist'}</div>
          </div>
          <button onClick={() => endCall('panel_closed')} aria-label="Close voice assistant" className="p-1 text-slate-300 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4">
          {phase === 'idle' && <>
            <p className="text-sm text-slate-700">{isCustomApparel ? 'Use your microphone to speak with the Sew Suite virtual receptionist about embroidery, screen printing, promotional products, project details, or starting a quote.' : 'Use your microphone to speak with our virtual receptionist. You can ask about service coverage or create a service request.'}</p>
            <button onClick={startCall} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-accent px-4 py-3 font-bold text-brand-dark">
              <Mic className="w-4 h-4" /> Start Voice Conversation
            </button>
          </>}

          {phase === 'starting' && <div className="py-8 text-center text-sm text-slate-600"><Loader2 className="mx-auto mb-2 w-6 h-6 animate-spin" />Connecting securely…</div>}

          {(phase === 'connected' || phase === 'ending') && <>
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 min-h-20 text-sm text-slate-600">
              {caption || 'Listening…'}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={toggleMute} disabled={phase === 'ending'} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">
                {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />} {muted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={() => endCall()} disabled={phase === 'ending'} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                <PhoneOff className="w-4 h-4" /> End
              </button>
            </div>
          </>}

          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
          <div className="mt-3 text-[10px] text-slate-400">{isCustomApparel ? 'Microphone permission is required. Quote requests and project details are reviewed by the Sew Suite team before production.' : 'Microphone permission is required. Service requests are not appointments until confirmed by the office.'}</div>
        </div>
      </div>
    )}
  </>;
}
