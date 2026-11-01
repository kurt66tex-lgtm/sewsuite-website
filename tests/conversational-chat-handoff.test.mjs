import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hasChatFollowupPermission,validConversationalLead} from '../api/chat-conversation-permission.mjs';

const base=[
 {role:'assistant',content:'What project are you planning?'},
 {role:'user',content:'I need 24 embroidered shirts.'},
 {role:'assistant',content:'May I have your contact information?'},
 {role:'user',content:'Synthetic Test, 972-442-1285, kurt66tex@gmail.com.'},
 {role:'assistant',content:'May the Sew Suite team follow up with you about the project?'},
 {role:'user',content:'Yes please'}
];
const lead={first_name:'Synthetic',last_name:'Test',phone:'9724421285',
 email:'kurt66tex@gmail.com',service_type:'Custom Embroidery',
 problem_description:'24 embroidered shirts with an existing logo',
 consent_to_contact:true,confirmed:true,messages:base};
test('spoken followup permission suffices without separate checkbox',()=>{
 assert.equal(hasChatFollowupPermission(base),true);
 for(const consent of ['Yes, go ahead','Sure thing','Yes, that would be great','Sure, please do']){
  assert.equal(hasChatFollowupPermission([...base.slice(0,-1),{role:'user',content:consent}]),true);
 }
 assert.equal(validConversationalLead(lead),true);
});
test('do not create leads when approval or details are missing or invented',()=>{
 assert.equal(hasChatFollowupPermission([...base.slice(0,-2),{role:'assistant',content:'Do you have a logo?'},{role:'user',content:'Yes'}]),false);
 assert.equal(hasChatFollowupPermission([...base.slice(0,-1),{role:'user',content:'No, do not contact me'}]),false);
 for(const patch of [{email:'other@example.com'},{phone:'9720000000'},
  {first_name:'Unknown'},{last_name:''},{problem_description:''},{consent_to_contact:false},{confirmed:false}]){
  assert.equal(validConversationalLead({...lead,...patch}),false,JSON.stringify(patch));
 }
});
test('browser no longer contains separate form or manual send button',()=>{
 const widget=readFileSync('src/components/site/ChatWidget.jsx','utf8');
 const hook=readFileSync('src/hooks/useChatHandoff.js','utf8');
 const api=readFileSync('api/chat-lead.js','utf8');
 assert.doesNotMatch(widget,/quoteFormOpen|quoteDraft|Confirm and send request|Send this conversation as a quote request/);
 assert.match(widget,/handoff\.start\(data\.lead_candidate,newMessages\)/);
 assert.match(widget,/data\.handoff_needs_details/);
 assert.match(widget,/handoff\.status\]\);/);
 assert.match(hook,/appearance:'interaction-only'/);
 assert.match(hook,/execution:'execute'/);
 assert.match(hook,/response\.status!==202/);
 assert.match(hook,/request_key:key\.current/);
 assert.match(hook,/messages:messages\.map\(m=>\(\{role:m\.role,content:m\.content\}\)\)/,'CRM transcript must exclude UI attachment metadata');
 assert.match(widget,/Your request was sent to the Sew Suite team/);
 assert.ok(widget.indexOf('id="sew-chat-turnstile"')<widget.indexOf('{/* Pending attachments + input */}'),'mobile verification must appear adjacent to input, not hidden in scrolled messages');
 assert.match(api,/validConversationalLead\(v\)/);
 assert.match(api,/verification_failed/);
});

test('yes to artwork upload does not count as follow-up permission',()=>{
 const upload=[...base.slice(0,-2),{role:'assistant',content:'You can upload artwork to help the Sew Suite team review it. Would you like to do that?'},{role:'user',content:'Yes'}];
 assert.equal(hasChatFollowupPermission(upload),false);
});

test('artwork can be selected before CRM submission and is uploaded only after saved receipt',()=>{
 const widget=readFileSync('src/components/site/ChatWidget.jsx','utf8');
 assert.match(widget,/setArtworkStatus\('queued'\)/);
 assert.match(widget,/handoff\.status!=='saved'/);
 assert.match(widget,/await uploadLeadArtwork\(item\.file,handoff\.artworkCapability\)/);
 assert.doesNotMatch(widget,/Attachments are not enabled in the comparison chat/);
 assert.match(widget,/Attach artwork anytime/);
});

test('final no-more-details answer completes a requested quote only',()=>{
 const final=[...base.slice(0,-2),{role:'assistant',content:'Is there anything else you would like us to know?'},{role:'user',content:'No'}];
 assert.equal(hasChatFollowupPermission(final),true);
 const artwork=[...base.slice(0,-2),{role:'assistant',content:'Do you have artwork?'},{role:'user',content:'No'}];
 assert.equal(hasChatFollowupPermission(artwork),false);
});
