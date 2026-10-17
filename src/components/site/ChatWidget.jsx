import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, AlertTriangle, Paperclip, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function ChatWidget() {
  const { settings } = useBusinessSettings();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [collected, setCollected] = useState({});
  const [conversationId, setConversationId] = useState(null);
  const [sending, setSending] = useState(false);
  const [safetyFlag, setSafetyFlag] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const visitorId = useRef(Math.random().toString(36).slice(2));

  const isCustomApparel = settings?.industry_module === 'custom' && /apparel|embroidery|screen/i.test(settings?.primary_business_category || '');
  const assistantName = settings?.chat_assistant_name || (isCustomApparel ? 'Sew Suite Assistant' : 'Service Assistant');
  const welcome = settings?.chat_welcome_message || (isCustomApparel ? 'Hi! I can help with a custom apparel or decoration quote. Tell me about your project, quantity, timing, and artwork.' : 'Hi! I can help you request service. What can we help you with?');
  const enabled = settings?.chat_enabled !== false;
  const [chatAvailable,setChatAvailable]=useState(false);
  const [crmAvailable,setCrmAvailable]=useState(false);
  const [quoteFormOpen,setQuoteFormOpen]=useState(false);
  const [quoteDraft,setQuoteDraft]=useState({first_name:'',last_name:'',phone:'',email:'',service_type:'Custom Embroidery',problem_description:'',consent_to_contact:false});
  const leadRequestKey=useRef('synthetic_'+Math.random().toString(36).slice(2)+'_'+Date.now());
  useEffect(()=>{let live=true;fetch('/api/chat-lead').then(r=>r.json()).then(d=>{if(live)setCrmAvailable(d.available===true)}).catch(()=>{});return ()=>{live=false}},[]);
  useEffect(()=>{let live=true;fetch('/api/chat?action=status').then(r=>r.json()).then(d=>{if(live)setChatAvailable(d.available===true)}).catch(()=>{if(live)setChatAvailable(false)});return ()=>{live=false}},[]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, pendingFiles]);

  const getNormalizedType = (file) => {
    if (file.type) return file.type;
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext === 'heic') return 'image/heic';
    if (ext === 'heif') return 'image/heif';
    if (ext === 'pdf') return 'application/pdf';
    return '';
  };

  const handleFiles = (fileList) => {
    setUploadError('');
    const incoming = Array.from(fileList || []);
    const accepted = [];
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']);

    for (const file of incoming) {
      if (pendingFiles.length + accepted.length >= 4) {
        setUploadError('You can attach up to 4 files at a time.');
        break;
      }
      const normalizedType = getNormalizedType(file);
      if (!allowed.has(normalizedType)) {
        setUploadError('Please attach a JPG, PNG, WEBP, HEIC/HEIF image, or PDF.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('Each file must be 10 MB or smaller.');
        continue;
      }

      accepted.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        file_type: normalizedType,
        preview: normalizedType.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    }

    if (accepted.length) setPendingFiles(prev => [...prev, ...accepted]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (id) => {
    setPendingFiles(prev => {
      const target = prev.find(p => p.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter(p => p.id !== id);
    });
  };

  const clearPendingFiles = () => {
    pendingFiles.forEach(p => { if (p.preview) URL.revokeObjectURL(p.preview); });
    setPendingFiles([]);
  };

  const send = async () => {
    if ((!input.trim() && pendingFiles.length === 0) || sending) return;

    if(!chatAvailable){setUploadError('The independent chat is temporarily unavailable. Please use www.sewsuite.com.');return;}
    if(pendingFiles.length){setUploadError('Attachments are not enabled in the comparison chat yet. Please use www.sewsuite.com to submit files.');return;}
    setSending(true);
    setUploadError('');

    try {
      const uploadedAttachments = [];

      const content = input.trim() || `Uploaded ${uploadedAttachments.length} ${uploadedAttachments.length === 1 ? 'file' : 'files'} for review.`;
      const userMsg = {
        role: 'user',
        content,
        attachments: uploadedAttachments.map(a => ({ file_name: a.file_name, file_type: a.file_type }))
      };
      const newMessages = [...messages, userMsg];

      const response = await fetch('/api/chat?action=message', {
        method:'POST',headers:{'content-type':'application/json','x-rrs-preview-visitor':visitorId.current+'preview1234'},
        body:JSON.stringify({messages:newMessages.map(m=>({role:m.role,content:m.content})),conversation_id:conversationId})
      });
      const data = await response.json();
      if(!response.ok)throw Error(data.error||'chat_preview_unavailable');
      if (data.error) throw new Error(data.error);

      if (data.conversation_id) setConversationId(data.conversation_id);
      if (data.collected) setCollected(data.collected);
      if (data.safety_flag) setSafetyFlag(true);

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      setInput('');
      clearPendingFiles();

      // Preview conversations never create customer leads or send notifications.

    } catch (e) {
      const message = String(e?.message || '');
      if (message.toLowerCase().includes('upload') || pendingFiles.length > 0) {
        setUploadError('We could not upload that file. Please try again, or continue without the attachment.');
      } else {
        setUploadError('The independent chat could not connect. Please try again shortly or use www.sewsuite.com.');
      }
    } finally {
      setSending(false);
    }
  };

  const submitConfirmedQuote=async()=>{
    if(!crmAvailable||sending||leadSubmitted||!quoteDraft.consent_to_contact)return;
    setSending(true);setUploadError('');
    try{
      const response=await fetch('/api/chat-lead',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...quoteDraft,request_key:leadRequestKey.current,confirmed:true,messages:messages.map(m=>({role:m.role,content:m.content}))})});
      const data=await response.json();
      if(!response.ok||!data.success||!data.lead_id)throw Error('lead_not_confirmed');
      setLeadSubmitted(true);setQuoteFormOpen(false);
    }catch{setUploadError('We could not confirm your request was saved. Please use www.sewsuite.com and do not assume your inquiry was submitted.');}
    finally{setSending(false)}
  };

  if (!enabled) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[74px] right-3 sm:bottom-6 sm:right-4 z-50 flex items-center gap-2 rounded-full p-2.5 sm:px-4 sm:py-3 shadow-lg border-2 transition-all hover:brightness-110" style={{ backgroundColor: 'var(--brand-chat-launcher-bg)', color: 'var(--brand-chat-launcher-text)', borderColor: 'var(--brand-chat-launcher-border)' }}
          aria-label="Open chat assistant"
        >
          <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-sm font-bold">Chat with us</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 sm:w-96 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border-2 border-brand-dark overflow-hidden" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between text-white px-4 py-3" style={{ backgroundColor: 'var(--brand-chat-header-bg)' }}>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--brand-chat-header-accent)' }}>{assistantName}</div>
              <div className="text-xs text-slate-400">{isCustomApparel ? 'Automated assistant • Project inquiry help' : 'Automated assistant • Not a technician'}</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-slate-400 hover:text-brand-accent">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Safety banner */}
          {safetyFlag && (
            <div className="flex items-start gap-2 bg-red-50 border-b border-red-200 px-3 py-2 text-xs text-red-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{isCustomApparel ? 'Your message may need personal follow-up from the Sew Suite team.' : "Safety concern detected. If you're in immediate danger, call your gas utility or 911."}</span>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? '' : 'bg-white border border-slate-200 text-brand-dark'}`} style={m.role === 'user' ? { backgroundColor: 'var(--brand-chat-user-bg)', color: 'var(--brand-chat-user-text)' } : undefined}>
                  {m.content.split('\n').map((line, j) => <div key={j}>{line}</div>)}
                  {m.attachments?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((a, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs bg-white/60 rounded-lg px-2 py-1">
                          {a.file_type?.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                          <span className="truncate max-w-[180px]">{a.file_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            {crmAvailable&&!leadSubmitted&&(
              <div className="mx-3 mb-3 rounded-lg border border-slate-200 bg-white p-3">
                <button type="button" onClick={()=>setQuoteFormOpen(v=>!v)} className="text-xs font-semibold text-brand-dark underline">{quoteFormOpen?'Close quote request':'Send this conversation as a quote request'}</button>
                {quoteFormOpen&&<div className="mt-2 space-y-2">
                  {['first_name','last_name','email','phone','service_type','problem_description'].map(field=><label key={field} className="block text-xs text-slate-700">{field.replaceAll('_',' ')}<input className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5" value={quoteDraft[field]} onChange={e=>setQuoteDraft(v=>({...v,[field]:e.target.value}))}/></label>)}
                  <label className="flex gap-2 text-xs text-slate-700"><input type="checkbox" checked={quoteDraft.consent_to_contact} onChange={e=>setQuoteDraft(v=>({...v,consent_to_contact:e.target.checked}))}/>I confirm these details are correct and agree to be contacted.</label>
                  <button type="button" disabled={sending||!quoteDraft.consent_to_contact} onClick={submitConfirmedQuote} className="rounded bg-brand-accent px-3 py-2 text-xs font-bold text-brand-dark disabled:opacity-50">Confirm and send request</button>
                </div>}
              </div>
            )}
            {leadSubmitted && (
              <div className="text-center text-xs text-green-700 bg-green-50 rounded-lg py-2 px-3">
                Your request was recorded in the testing CRM. Notifications are held until delivery testing is completed.
              </div>
            )}
          </div>

          {/* Pending attachments + input */}
          <div className="border-t border-slate-200 bg-white">
            {pendingFiles.length > 0 && (
              <div className="px-3 pt-3 flex gap-2 overflow-x-auto">
                {pendingFiles.map(item => (
                  <div key={item.id} className="relative flex-shrink-0 w-20">
                    <div className="h-16 w-20 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                      {item.preview ? (
                        <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileText className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePendingFile(item.id)}
                      disabled={sending}
                      className="absolute -top-1 -right-1 rounded-full bg-brand-dark text-white p-1 shadow"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="mt-1 text-[10px] text-slate-500 truncate">{item.file.name}</div>
                  </div>
                ))}
              </div>
            )}
            {uploadError && <div className="px-3 pt-2 text-xs text-red-600">{uploadError}</div>}
            <div className="flex items-center gap-2 px-3 py-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.heic,.heif,.pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || pendingFiles.length >= 4}
                className="rounded-full p-2 text-slate-500 hover:text-brand-dark hover:bg-slate-100 disabled:opacity-40"
                aria-label="Add photo or file"
                title="Add photo or file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Type a message or attach a photo…"
                className="flex-1 text-sm border border-slate-300 rounded-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                disabled={sending}
              />
              <button onClick={send} disabled={sending || (!input.trim() && pendingFiles.length === 0)} className="rounded-full p-2 disabled:opacity-40" style={{ backgroundColor: 'var(--brand-chat-send-bg)', color: 'var(--brand-chat-send-icon)' }} aria-label="Send message">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="px-3 pb-2 text-[10px] text-slate-400">Photos/PDFs up to 10 MB each • up to 4 at a time</div>
          </div>
        </div>
      )}
    </>
  );
}