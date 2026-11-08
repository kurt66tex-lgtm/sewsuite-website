import {readFileSync} from 'node:fs';
import {evaluateMigrationRelease} from './migration-factory-release-gates.mjs';
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/check-migration-factory-readiness.mjs <evidence.json>');process.exit(2);}
let manifest;
try{manifest=JSON.parse(readFileSync(file,'utf8'));}catch{console.error('MIGRATION_FACTORY_EVIDENCE_INVALID');process.exit(2)}
const check=evaluateMigrationRelease(manifest);
if(check.ready){
 console.log('MIGRATION_FACTORY_FULL_PARITY_READY client='+manifest.client+' modules='+check.required);
}else{
 console.error('MIGRATION_FACTORY_RELEASE_BLOCKED client='+manifest.client+' passed='+check.passed+'/'+check.required);
 for(const item of check.errors)console.error(' - '+item);
 process.exitCode=1;
}
