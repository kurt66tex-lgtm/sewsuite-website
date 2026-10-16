import {useState} from 'react';
import {Mic, X} from 'lucide-react';
// Independent comparison only. Keep the same launcher design and position,
// but never create an AI session until the Railway voice runtime is certified.
export default function VoiceCallWidget(){
 const [open,setOpen]=useState(false);
 return <>
  {!open && <button type="button" onClick={()=>setOpen(true)}
    className="fixed bottom-[124px] right-3 sm:bottom-20 sm:right-4 z-50 inline-flex items-center gap-2 rounded-full border-2 p-2.5 sm:px-4 sm:py-3 shadow-lg transition hover:brightness-110"
    style={{backgroundColor:'var(--brand-chat-launcher-bg)',color:'var(--brand-chat-launcher-text)',borderColor:'var(--brand-chat-launcher-border)'}}
    aria-label="Talk with our virtual receptionist">
    <Mic className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
    <span className="hidden sm:inline text-sm font-bold">Talk with us</span>
  </button>}
  {open && <div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 sm:w-80 z-[60] overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label="Voice assistant preview">
    <div className="flex items-center justify-between px-4 py-3" style={{backgroundColor:'var(--brand-chat-header-bg)'}}>
      <div><div className="text-sm font-bold" style={{color:'var(--brand-chat-header-accent)'}}>Sew Suite Assistant</div><div className="text-[11px] text-slate-300">AI project & quote assistant</div></div>
      <button onClick={()=>setOpen(false)} aria-label="Close voice assistant" className="p-1 text-slate-300 hover:text-white"><X className="w-5 h-5"/></button>
    </div>
    <div className="p-4"><p className="text-sm text-slate-700">This is a comparison preview. Voice conversations are temporarily unavailable while the independent receptionist is being connected and tested.</p>
      <p className="mt-3 text-xs text-slate-500">For assistance or a quote, please visit www.sewsuite.com.</p>
    </div>
  </div>}
 </>;
}
