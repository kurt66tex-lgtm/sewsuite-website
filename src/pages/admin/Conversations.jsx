import { useEffect, useState } from 'react';
import { MessageSquare, AlertTriangle, Camera, MapPin, Wrench, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getConversationLabel, getConversationAppliance, getConversationCity } from '@/lib/inboxUtils';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [customers, setCustomers] = useState([]);

  const load = () => {
    setLoading(true);
    base44.entities.Conversation.list('-started_at', 200).then(async list => {
      const visible = list.filter(c => !c.is_test_data);
      setConversations(visible);

      const params = new URLSearchParams(window.location.search);
      const conversationId = params.get('conversation');
      if (conversationId) {
        const match = visible.find(c => c.id === conversationId);
        if (match) await openConv(match);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }).finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    Promise.all([
      base44.entities.Lead.list('-created_date', 500),
      base44.entities.Customer.list('-created_date', 500)
    ]).then(([l, c]) => { setLeads(l); setCustomers(c); }).catch(() => {});
  }, []);

  const openConv = async (c) => {
    setSelected(c);
    try {
      const [msgs, attRes] = await Promise.all([
        base44.entities.ChatMessage.filter({ conversation_id: c.id }),
        base44.functions.invoke('getOfficeAttachments', { conversation_id: c.id })
      ]);
      setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      const attData = attRes?.data || attRes || {};
      setAttachments(attData.attachments || []);
    } catch {
      setMessages([]);
      setAttachments([]);
    }
  };

  return (
    <div className="p-6 max-w-7xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Conversations</h1>
      {loading ? <div className="text-slate-500">Loading…</div> : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {conversations.map(c => (
                <button key={c.id} onClick={() => openConv(c)} className={`w-full text-left p-3 hover:bg-slate-50 ${selected?.id === c.id ? 'bg-blue-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 flex items-center gap-1.5">{c.safety_flag && <AlertTriangle className="w-4 h-4 text-red-500" />} {getConversationLabel(c, leads, customers)}</span>
                    {c.photo_count > 0 && <span className="flex items-center gap-1 text-xs text-slate-500"><Camera className="w-3 h-3" /> {c.photo_count}</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{c.disposition === 'Out of Area' ? 'Out of Area' : c.status} • {c.message_count} msgs</span>
                    {getConversationAppliance(c, leads) && <span className="flex items-center gap-0.5"><Wrench className="w-3 h-3" /> {getConversationAppliance(c, leads)}</span>}
                    {getConversationCity(c, leads) && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {getConversationCity(c, leads)}</span>}
                  </div>
                </button>
              ))}
              {conversations.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">No conversations yet.</div>}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
            {!selected ? <div className="text-center text-slate-400 py-12"><MessageSquare className="w-8 h-8 mx-auto mb-2" /> Select a conversation</div> : (
              <>
                <div className="flex items-center justify-between mb-3 pb-3 border-b">
                  <div><div className="font-semibold text-slate-900">{getConversationLabel(selected, leads, customers)}</div><div className="text-xs text-slate-500">{selected.source_page} • {selected.disposition === 'Out of Area' ? 'Out of Area' : selected.status}</div></div>
                  {selected.safety_flag && <span className="flex items-center gap-1 text-xs text-red-600 font-semibold"><AlertTriangle className="w-4 h-4" /> Safety flagged</span>}
                </div>
                {selected.summary && <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 mb-3">{selected.summary}</div>}
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  {messages.map(m => {
                    const messageAttachments = (m.attachment_ids || [])
                      .map(id => attachments.find(a => a.id === id))
                      .filter(Boolean);

                    return (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-brand-accent text-brand-dark' : 'bg-slate-100 text-slate-800'}`}>
                          <div>{m.message}</div>
                          {messageAttachments.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {messageAttachments.map(a => (
                                <a key={a.id} href={a.signed_url || '#'} target="_blank" rel="noopener noreferrer"
                                  className="block rounded-lg border border-black/10 bg-white overflow-hidden text-left">
                                  {a.file_type?.startsWith('image/') && a.signed_url ? (
                                    <img src={a.signed_url} alt={a.file_name || 'Uploaded photo'} className="w-full h-24 object-cover" />
                                  ) : (
                                    <div className="h-20 flex items-center justify-center"><FileText className="w-6 h-6 text-slate-400" /></div>
                                  )}
                                  <div className="px-2 py-1 text-[10px] text-slate-600 truncate">{a.file_name}</div>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}