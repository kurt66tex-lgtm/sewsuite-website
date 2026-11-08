import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateMigrationRelease,requiredMigrationCapabilities} from '../scripts/migration-factory-release-gates.mjs';
const current=JSON.parse(readFileSync(new URL('../docs/migration-factory/sew-suite-cutover-evidence-20261108.json',import.meta.url),'utf8'));
test('real Sew Suite website remains blocked until Agency Owner and all critical modules are verified',()=>{
 const outcome=evaluateMigrationRelease(current);
 assert.equal(outcome.ready,false);
 assert.equal(outcome.required,14);
 assert.ok(outcome.errors.some(x=>x.startsWith('agency_controls:FAIL')));
 assert.ok(outcome.errors.some(x=>x.startsWith('customer_office_mail:PENDING')));
 assert.ok(outcome.errors.some(x=>x.startsWith('private_artwork_upload_and_download:PENDING')));
 assert.ok(outcome.errors.some(x=>x.startsWith('backup_and_restore:PENDING')));
});
test('an actual completed evidence manifest can pass when every required capability is real',()=>{
 const full=structuredClone(current);
 for(const x of requiredMigrationCapabilities){
  const row=full.modules[x];
  row.status='PASS';row.preview_only=false;row.placeholder_only=false;
  row.real_target_verified=true;
  row.evidence=['Live production browser/database acceptance receipt 2026-11-08'];
  for(const key of Object.keys(row.checks||{}))row.checks[key]=true;
 }
 assert.deepEqual(evaluateMigrationRelease(full).errors,[]);
 assert.equal(evaluateMigrationRelease(full).ready,true);
});
test('a copied Agency Owner tab without saved settings or negative access tests cannot pass',()=>{
 const full=structuredClone(current);
 for(const x of requiredMigrationCapabilities){
  const row=full.modules[x];row.status='PASS';row.real_target_verified=true;
  row.placeholder_only=false;row.preview_only=false;
  for(const check of Object.keys(row.checks||{}))row.checks[check]=true;
 }
 full.modules.agency_controls.checks.client_admin_denial=false;
 assert.ok(evaluateMigrationRelease(full).errors.includes('agency_controls:missing_client_admin_denial'));
 full.modules.agency_controls.checks.client_admin_denial=true;
 full.modules.agency_controls.placeholder_only=true;
 assert.ok(evaluateMigrationRelease(full).errors.includes('agency_controls:preview_or_placeholder'));
});
test('no missing module or empty evidence can be marked ready',()=>{
 const full=structuredClone(current);
 delete full.modules.staff_auth_and_roles;
 assert.ok(evaluateMigrationRelease(full).errors.includes('staff_auth_and_roles:missing'));
 full.modules.staff_auth_and_roles={status:'PASS',real_target_verified:true,evidence:[]};
 assert.ok(evaluateMigrationRelease(full).errors.includes('staff_auth_and_roles:evidence_missing_or_invalid'));
});
