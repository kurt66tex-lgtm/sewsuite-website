import {readFileSync} from 'node:fs';
import {evaluateMigrationRelease} from './migration-factory-release-gates.mjs';
import {evaluateSourceFeatureParity} from './migration-source-feature-parity.mjs';
const inputs=[
 ['release','docs/migration-factory/sew-suite-cutover-evidence-20261108.json',evaluateMigrationRelease],
 ['source','docs/migration-factory/sew-suite-base44-control-parity-20261109.json',evaluateSourceFeatureParity]
];
let failed=false;
for(const [label,file,check] of inputs){
 let m;
 try{m=JSON.parse(readFileSync(file,'utf8'));}catch(e){
  console.error('MIGRATION_'+label.toUpperCase()+'_EVIDENCE_INVALID');failed=true;continue;
 }
 const result=check(m),problems=result.errors||result.failures||[];
 if(result.ready)console.log('MIGRATION_'+label.toUpperCase()+'_PASS '+m.client);
 else{
  console.error('MIGRATION_'+label.toUpperCase()+'_BLOCKED '+m.client);
  for(const item of problems)console.error(' - '+item);
  failed=true;
 }
}
if(failed)process.exitCode=1;
