import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('src/pages/BookService.jsx','utf8');
test('artwork retry is possible only after a durable lead and never reposts the quote',()=>{
 const start=source.indexOf('const retryArtworkOnly = async () => {');
 const end=source.indexOf('const submit = async (e) => {');
 assert.ok(start>0&&end>start,'retry code missing');
 const retry=source.slice(start,end);
 assert.match(retry,/result\?\.success/);
 assert.match(retry,/result\.artwork_error/);
 assert.match(retry,/retryingArtwork/);
 assert.match(retry,/artworkRetryAttempts>=2/);
 assert.match(retry,/uploadConfirmedArtwork\(result\.lead_id,token,pending\)/);
 assert.doesNotMatch(retry,/api\/intake|\/internal\/lead|requestKey\.current\s*=|new.*lead/i);
 assert.match(source,/Do not submit the quote again/);
 assert.match(source,/Retry artwork upload only/);
});
test('partial completed attachments are preserved and only missing files are retried',()=>{
 assert.match(source,/error\.completedFiles=done/);
 assert.match(source,/sourceIndex:photos\.indexOf\(item\)/);
 assert.match(source,/const already=new Set\(\(result\.artwork_files\|\|\[\]\)\.map\(x=>x\.sourceIndex\)\)/);
 assert.match(source,/photos\.filter\(\(_,i\)=>!already\.has\(i\)\)/);
 assert.match(source,/artworkFiles=uploadError\.completedFiles\|\|\[\]/);
 assert.match(source,/artworkCapability\.current=.*data\.artwork_token/);
 assert.doesNotMatch(source,/localStorage\.setItem\([^)]*artwork/);
});
