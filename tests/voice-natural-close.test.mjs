import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visitorSaidGoodbye,receptionistSaidGoodbye,canCloseNaturally} from '../src/lib/voiceClosing.js';
const widget=readFileSync('src/components/site/VoiceCallWidget.jsx','utf8');

test('explicit customer goodbyes register without confusing routine thanks',()=>{
 for(const s of ['Bye.','Goodbye','That is all, thank you','No, that is it.','Nothing else, thanks']){
  assert.equal(visitorSaidGoodbye(s),true,s);
 }
 for(const s of ['Thank you','Thanks for helping','Maybe next week','I need a quote']){
  assert.equal(visitorSaidGoodbye(s),false,s);
 }
});
test('assistant sign-off is recognized but unrelated phrases are not',()=>{
 for(const s of ['Goodbye!','Take care.','Have a great day.','Thanks for calling.']){
  assert.equal(receptionistSaidGoodbye(s),true,s);
 }
 assert.equal(receptionistSaidGoodbye('Can I help with anything else?'),false);
});
test('hangup follows a two-sided farewell or a confirmed submission and a farewell',()=>{
 assert.equal(canCloseNaturally({visitorGoodbye:true,assistantGoodbye:true}),true);
 assert.equal(canCloseNaturally({crmSaved:true,assistantGoodbye:true}),true);
 assert.equal(canCloseNaturally({visitorGoodbye:true,assistantGoodbye:false}),false);
 assert.equal(canCloseNaturally({visitorGoodbye:true,assistantGoodbye:true,crmPending:true}),false);
 assert.equal(canCloseNaturally({assistantGoodbye:true}),false);
});
test('voice only passes a friendly confirmation to the model, not a UUID',()=>{
 assert.match(widget,/confirmation:'Your inquiry has been sent to our team for review\.'/);
 assert.doesNotMatch(widget,/outcome=.+lead_id:/);
 assert.match(widget,/natural_goodbye/);
 assert.match(widget,/setTimeout\(\(\)=>\{/);
 assert.match(widget,/s\.goodbyeTimer/);
 assert.match(widget,/session\.input_transcript\.delta/);
 assert.match(widget,/session\.output_transcript\.delta/);
});
