import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const script=fileURLToPath(new URL('../scripts/production-cutover-preflight.mjs',import.meta.url));
const version='6b047765-b106-473d-aa3d-b2479ace966f';
const baseline={RRS_PRODUCTION_RELEASE_VERIFIED:'true',RRS_PRODUCTION_MAIL_VERIFIED:'true',RRS_PRODUCTION_ARTWORK_VERIFIED:'true',VITE_PUBLIC_CATALOG_MODE:'independent',RRS_PUBLIC_CATALOG_MODE:'independent',RRS_PUBLIC_CATALOG_ENABLED:'true'};
const check=(extra={})=>spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,...baseline,...extra}});
test('preflight rejects missing browser/server catalog version',()=>{
 const result=check({VITE_APPROVED_CATALOG_VERSION:'',RRS_APPROVED_PUBLIC_CATALOG_VERSION:''});
 assert.equal(result.status,1);
 assert.match(result.stdout,/BLOCKED Browser and server require the same approved catalog version/);
});
test('preflight rejects catalog version mismatch',()=>{
 const result=check({VITE_APPROVED_CATALOG_VERSION:version,RRS_APPROVED_PUBLIC_CATALOG_VERSION:'00000000-0000-4000-8000-000000000000'});
 assert.equal(result.status,1);
 assert.match(result.stdout,/BLOCKED Browser and server require the same approved catalog version/);
});
test('preflight accepts version match but still refuses unfinished launch',()=>{
 const result=check({VITE_APPROVED_CATALOG_VERSION:version,RRS_APPROVED_PUBLIC_CATALOG_VERSION:version});
 assert.equal(result.status,1);
 assert.match(result.stdout,/PASS Browser and server require the same approved catalog version/);
 assert.match(result.stdout,/SEW_SUITE_PRODUCTION_CUTOVER_READY=false/);
});
