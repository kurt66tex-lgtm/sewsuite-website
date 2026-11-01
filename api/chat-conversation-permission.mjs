// A conversational service inquiry may be sent only after the visitor has
// explicitly asked for follow-up or agreed to the assistant's service follow-up question.
// It is not marketing consent. No unverified transcript may create a CRM lead.
const direct=/(?:please|go ahead and|you can|i(?:'d| would) like (?:someone|your team|you) to).{0,90}(?:send|submit|contact|follow.?up|reach out|forward|call|email)/i;
const question=/(?:\b(?:may|can|shall)\s+(?:the\s+)?(?:sew suite\s+)?(?:team|staff)\s+(?:contact|call|email|follow\s*up|reach\s*out)\b|\b(?:may|can|shall|would you like|is it okay)\b.{0,100}\b(?:team|staff|sew suite)\b.{0,60}\b(?:contact|call|email|follow\s*up|reach\s*out|send|forward|submit)\b)/i;
const yes=/^(?:yes(?: please|,? go ahead|,? please do|,? that(?:'s| is) fine|,? that would be great)?|yep|yeah|sure(?: thing|,? please do)?|okay|ok|of course|go ahead|please do|absolutely|that works|you can|sounds good|that would be great)[.! ]*$/i;
const no=/(?:don't|do not|no thanks|not yet|please wait|stop|cancel|not ready)/i;
export function hasChatFollowupPermission(messages){
 if(!Array.isArray(messages)||messages.length<2)return false;
 const i=messages.map(m=>m.role).lastIndexOf('user');
 if(i<0)return false;
 const last=String(messages[i].content||'').trim();
 if(no.test(last))return false;
 if(direct.test(last))return true;
 const previous=[...messages.slice(0,i)].reverse().find(m=>m.role==='assistant');
 const prompt=String(previous?.content||'');
 if(/\b(?:upload|attach|add|provide|send)\b.{0,90}\b(?:artwork|logo|file|image|photo)\b|\b(?:artwork|logo|file|image|photo)\b.{0,90}\b(?:upload|attach)\b/i.test(prompt))return false;
 return Boolean(previous&&question.test(prompt)&&yes.test(last));
}
export function validConversationalLead(body){
 const messages=body?.messages;
 if(!hasChatFollowupPermission(messages))return false;
 if(!Array.isArray(messages)||messages.length>24||messages.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length<1||m.content.length>1500))return false;
 const authored=messages.filter(m=>m.role==='user').map(m=>m.content).join(' ').toLowerCase();
 const email=String(body.email||'').trim().toLowerCase();
 const phone=String(body.phone||'').replace(/\D/g,'').slice(-10);
 if(!email||!phone||phone.length!==10||!authored.includes(email))return false;
 const phones=[...authored.matchAll(/(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]?\d{3}[ .-]?\d{4}/g)].map(x=>x[0].replace(/\D/g,'').slice(-10));
 if(!phones.includes(phone))return false;
 for(const k of ['first_name','last_name','service_type','problem_description']){
  if(typeof body[k]!=='string'||!body[k].trim())return false;
 }
 const words=authored.replace(/[^a-z]/g,' ');
 for(const name of [body.first_name,body.last_name]){
  if(!words.split(/\s+/).includes(name.trim().toLowerCase()))return false;
 }
 if(String(body.problem_description).trim().length<12)return false;
 return body.confirmed===true&&body.consent_to_contact===true;
}
