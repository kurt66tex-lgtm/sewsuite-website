import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateSourceFeatureParity} from '../scripts/migration-source-feature-parity.mjs';
const source=JSON.parse(readFileSync(new URL('../docs/migration-factory/sew-suite-base44-control-parity-20261109.json',import.meta.url),'utf8'));
test('original Base44 Sew Suite source inventory records AI and all seven agency tabs',()=>{
 assert.equal(source.original_app_name,'Sew Suite');
 assert.equal(source.original_app_id,'6aba8ad594aac8fa4dde76e6');
 assert.notEqual(source.original_app_name,source.excluded_similar_app);
 assert.ok(source.features.length>=20);
 const names=new Set(source.features.map(f=>f.section));
 assert.deepEqual([...names].sort(),[
  'AI Phone & Chat','Billing & Invoices','Google Local Services','Launch & Readiness',
  'Reputation','SEO','Website'].sort());
 assert.ok(source.features.some(f=>f.id==='voice_knowledge_base'));
 assert.ok(source.features.some(f=>f.id==='voice_billable_usage'));
 assert.ok(source.features.some(f=>f.id==='voice_phone_sip_setup'));
});
test('original screen functionality remains an explicit post-cutover blocker',()=>{
 const out=evaluateSourceFeatureParity(source);
 assert.equal(out.ready,false);
 assert.ok(out.failures.includes('voice_knowledge_base:PENDING'));
 assert.ok(out.failures.includes('voice_phone_sip_setup:PENDING'));
 assert.ok(out.failures.includes('agency_launch_provisioning:PENDING'));
});
test('claiming every tab is complete but omitting source-specific evidence remains blocked',()=>{
 const fake=structuredClone(source);
 for(const f of fake.features){
  f.status='PASS';f.target.real_production_tested=true;
  f.target.preview_only=false;f.target.placeholder_only=false;
  f.target.checks={};f.target.evidence=[];
 }
 const out=evaluateSourceFeatureParity(fake);
 assert.equal(out.ready,false);
 assert.ok(out.failures.includes('voice_knowledge_base:target_evidence_invalid'));
 assert.ok(out.failures.includes('voice_knowledge_base:missing_source_entries_imported'));
});
test('a genuine completed feature manifest passes and unselected features need evidence',()=>{
 const full=structuredClone(source);
 for(const f of full.features){
  f.status='PASS';f.target.real_production_tested=true;
  f.target.preview_only=false;f.target.placeholder_only=false;
  f.target.evidence=['Authenticated tenant-scoped production end-to-end acceptance on 2026-11-09'];
  f.target.checks=Object.fromEntries(f.required_checks.map(c=>[c,true]));
 }
 assert.equal(evaluateSourceFeatureParity(full).ready,true);
 const optional=full.features[0];
 optional.selected=false;optional.status='NOT_SELECTED';optional.source_selection_evidence='';
 assert.ok(evaluateSourceFeatureParity(full).failures.includes(optional.id+':unselected_not_verified'));
 optional.source_selection_evidence='Original Base44 data record confirms this module is not selected';
 assert.equal(evaluateSourceFeatureParity(full).ready,true);
});
test('rejects duplicate or spoofed source app records',()=>{
 const bad=structuredClone(source);bad.original_app_id='not-base44';
 assert.deepEqual(evaluateSourceFeatureParity(bad).failures,['source_manifest_invalid']);
 const bad2=structuredClone(source);bad2.features.push({...bad2.features[0]});
 assert.ok(evaluateSourceFeatureParity(bad2).failures.includes('duplicate_or_invalid_source_feature_id'));
});
