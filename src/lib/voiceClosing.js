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
export function canCloseNaturally({visitorGoodbye=false,assistantGoodbye=false,crmSaved=false,crmPending=false}={}){
 return !crmPending && assistantGoodbye && (visitorGoodbye || crmSaved);
}
