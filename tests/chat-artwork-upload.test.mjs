import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {uploadLeadArtwork} from '../src/lib/uploadLeadArtwork.js';
const cap={lead_id:'11111111-1111-4111-8111-111111111111',request_key:'chat_12345678901234567890',artwork_token:'a'.repeat(64)};
const file={name:'logo.png',type:'image/png',size:8,arrayBuffer:async()=>new Uint8Array([137,80,78,71,13,10,26,10]).buffer};
test('artwork upload prepares, PUTs, and commits only with lead capability',async()=>{
 const calls=[];
 const fetchImpl=async(url,opts)=>{calls.push({url:String(url),opts});
  if(calls.length===1)return new Response(JSON.stringify({intent_id:'22222222-2222-4222-8222-222222222222',upload_url:'https://upload.example.invalid/signed'}),{status:200});
  if(calls.length===2)return new Response('',{status:200});
  return new Response(JSON.stringify({success:true,file_id:'33333333-3333-4333-8333-333333333333'}),{status:200});
 };
 const id=await uploadLeadArtwork(file,cap,{fetchImpl,cryptoImpl:webcrypto});
 assert.equal(id,'33333333-3333-4333-8333-333333333333');
 assert.equal(calls.length,3);
 assert.equal(calls[1].opts.method,'PUT');
 assert.equal(JSON.parse(calls[0].opts.body).lead_id,cap.lead_id);
 assert.equal(JSON.parse(calls[2].opts.body).intent_id,'22222222-2222-4222-8222-222222222222');
});
test('untrusted file types and missing capability never upload',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw Error('unexpected')};
 await assert.rejects(uploadLeadArtwork({...file,type:'image/heic'},cap,{fetchImpl,cryptoImpl:webcrypto}));
 await assert.rejects(uploadLeadArtwork(file,null,{fetchImpl,cryptoImpl:webcrypto}));
 assert.equal(calls,0);
});
test('failed commit cannot report artwork success',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;
  if(calls===1)return new Response(JSON.stringify({intent_id:'22222222-2222-4222-8222-222222222222',upload_url:'https://upload.example.invalid/signed'}),{status:200});
  if(calls===2)return new Response('',{status:200});
  return new Response(JSON.stringify({error:'artwork_not_confirmed'}),{status:422});
 };
 await assert.rejects(uploadLeadArtwork(file,cap,{fetchImpl,cryptoImpl:webcrypto}),/artwork_commit_unverified/);
});
