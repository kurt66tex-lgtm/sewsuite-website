import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const quote=readFileSync('src/pages/BookService.jsx','utf8');
const voice=readFileSync('src/components/site/VoiceCallWidget.jsx','utf8');
test('quote error handles partial artwork failure without speaking or exposing UUID',()=>{
 assert.match(quote,/quote request was received, but we could not confirm one or more artwork attachments/);
 assert.match(quote,/Do not submit the quote again/);
 assert.doesNotMatch(quote,/mention your request ID:/);
 assert.match(quote,/data\.lead_id,data\.artwork_token/);
});
test('public voice confirmation remains readable and hides technical ID',()=>{
 assert.match(voice,/confirmation:'Your inquiry has been sent to our team for review\.'/);
 assert.doesNotMatch(voice,/outcome=.+lead_id:/);
});
