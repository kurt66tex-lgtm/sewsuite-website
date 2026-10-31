// Isolated customer-intake rehearsal guard.
// In a Vercel preview, never accept a CRM lead unless the operator explicitly
// enabled synthetic-only mode and the recipient is the preapproved test mailbox.
export function previewAllowsSyntheticLead(body,kind,env=process.env) {
 if(env.VERCEL_ENV!=='preview')return true;
 if(env.RRS_PREVIEW_SYNTHETIC_ONLY!=='true')return false;
 const approved=String(env.RRS_PREVIEW_APPROVED_TEST_EMAIL||'').trim().toLowerCase();
 const email=String(body?.email||'').trim().toLowerCase();
 if(!approved || email!==approved || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(approved))return false;
 const key=String(body?.request_key||'');
 if(kind==='website')return /^website_[a-f0-9]{32}$/.test(key);
 if(kind==='chat')return /^chat_[a-f0-9]{32}$/.test(key);
 return false;
}
