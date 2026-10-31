import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {previewAllowsSyntheticLead} from '../api/preview-synthetic-only.mjs';
const email='kurt66tex@gmail.com';
const configured={VERCEL_ENV:'preview',RRS_PREVIEW_SYNTHETIC_ONLY:'true',RRS_PREVIEW_APPROVED_TEST_EMAIL:email};
const website={email,request_key:'website_'+('a'.repeat(32))};
const chat={email,request_key:'chat_'+('b'.repeat(32))};
test('normal production release never uses preview synthetic-only address allowlist',()=>{
 assert.equal(previewAllowsSyntheticLead({email:'actual@example.com'},'website',{VERCEL_ENV:'production'}),true);
});
test('preview is held until explicit exact recipient and test enablement',()=>{
 assert.equal(previewAllowsSyntheticLead(website,'website',{VERCEL_ENV:'preview'}),false);
 assert.equal(previewAllowsSyntheticLead(website,'website',{...configured,RRS_PREVIEW_SYNTHETIC_ONLY:'false'}),false);
 assert.equal(previewAllowsSyntheticLead(website,'website',{...configured,RRS_PREVIEW_APPROVED_TEST_EMAIL:''}),false);
});
test('only exact approved mailbox and service-generated request key pass',()=>{
 assert.equal(previewAllowsSyntheticLead(website,'website',configured),true);
 assert.equal(previewAllowsSyntheticLead(chat,'chat',configured),true);
 assert.equal(previewAllowsSyntheticLead({...website,email:'actual@example.com'},'website',configured),false);
 assert.equal(previewAllowsSyntheticLead({...website,request_key:chat.request_key},'website',configured),false);
 assert.equal(previewAllowsSyntheticLead({...chat,request_key:website.request_key},'chat',configured),false);
 assert.equal(previewAllowsSyntheticLead({...website,request_key:'website_bad'},'website',configured),false);
});
test('both public API handlers enforce synthetic mailbox before Turnstile provider call',()=>{
 const intake=readFileSync('api/intake.js','utf8');
 const chatSrc=readFileSync('api/chat-lead.js','utf8');
 assert.match(intake,/previewAllowsSyntheticLead\(body,'website'\)/);
 assert.match(chatSrc,/previewAllowsSyntheticLead\(v,'chat'\)/);
 assert.ok(intake.indexOf('previewAllowsSyntheticLead(body')<intake.indexOf("fetch('https://challenges.cloudflare.com"));
 assert.ok(chatSrc.indexOf('previewAllowsSyntheticLead(v')<chatSrc.indexOf("fetch('https://challenges.cloudflare.com"));
});
