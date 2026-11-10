import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const widget=readFileSync('src/components/site/ChatWidget.jsx','utf8');
const hook=readFileSync('src/hooks/useChatHandoff.js','utf8');
const api=readFileSync('api/chat-lead.js','utf8');
test('website carries the server-issued conversation ID into automatic lead handoff',()=>{
 assert.match(widget,/handoff\.start\(data\.lead_candidate,newMessages,data\.conversation_id\|\|conversationId\)/);
 assert.match(hook,/function start\(lead,messages,conversationId=null\)/);
 assert.match(hook,/pending\.current=\{lead,messages,conversationId\}/);
 assert.match(hook,/conversation_id:conversationId/);
 assert.match(api,/conversation_id:v\.conversation_id/);
});
test('website does not invent IDs or allow unbounded browser-provided conversation references',()=>{
 assert.match(hook,/\/\^\[a-f0-9\]\{24\}\$\//);
 assert.match(api,/\/\^\[a-f0-9\]\{24\}\$\//);
 assert.doesNotMatch(widget,/base44\.entities\.Conversation/);
 assert.doesNotMatch(api,/base44\.entities|base44\.functions/);
});
