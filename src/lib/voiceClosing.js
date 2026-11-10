// Restrict automatic hangup to clear conversational sign-offs.
// Never close on routine acknowledgments like "thanks" or unanswered questions.
export function visitorSaidGoodbye(text) {
 const s=String(text||'').trim().replace(/[.!?\s]+$/g,'').toLowerCase();
 return /(?:^|\b)(?:goodbye|good bye|bye(?: bye)?|that's (?:all|it)|that is (?:all|it)|nothing else(?:,? thanks)?|no,? (?:that's|that is) (?:all|it))(?:,? (?:thanks|thank you))?$/.test(s);
}
export function receptionistSaidGoodbye(text){
 const s=String(text||'').trim().replace(/[.!?\s]+$/g,'').toLowerCase();
 return /(?:^|\b)(?:goodbye|good bye|bye(?: bye)?|take care|have a (?:great|good|nice|wonderful) (?:day|evening|weekend)|thanks for (?:calling|reaching out))(?:,? (?:thanks|thank you))?$/.test(s);
}
// A request for Sew Suite staff to contact the caller must not be mistaken
// for a plain conversational farewell. Match only explicit contact intent.
export function visitorRequestedFollowup(text){
 const s=String(text||'').toLowerCase();
 return /(?:have|ask|tell|let|get|please|can|could|would|want|need).{0,80}(?:someone|team|staff|person|you).{0,50}(?:contact|call|email|reach out|follow up)|(?:contact|call|email|reach out|follow up).{0,35}(?:me|us|back)/i.test(s);
}
export function canCloseNaturally({visitorGoodbye=false,assistantGoodbye=false,crmSaved=false,crmPending=false,crmAttempted=false,followupRequested=false}={}){
 // If a caller requested contact, wait for a real tool receipt or a confirmed
 // failure. Do not close merely because the assistant said "bye" first.
 if(crmPending||(followupRequested&&!crmAttempted&&!crmSaved))return false;
 return assistantGoodbye && (visitorGoodbye || crmSaved);
}
