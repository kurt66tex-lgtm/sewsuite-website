import {readFileSync} from 'node:fs';
import {evaluateSourceFeatureParity} from './migration-source-feature-parity.mjs';
const file=process.argv[2];
if(!file){console.error('Usage: node scripts/check-migration-source-features.mjs <source-feature-parity.json>');process.exit(2);}
let manifest;
try{manifest=JSON.parse(readFileSync(file,'utf8'));}catch{console.error('BASE44_SOURCE_PARITY_EVIDENCE_INVALID');process.exit(2);}
const result=evaluateSourceFeatureParity(manifest);
if(result.ready)console.log('BASE44_SOURCE_FEATURE_PARITY_PASS client='+manifest.client+' source_features='+result.sourceFeatures);
else{
 console.error('BASE44_SOURCE_FEATURE_PARITY_BLOCKED client='+manifest.client+' accepted='+result.passed+'/'+result.sourceFeatures);
 for(const x of result.failures)console.error(' - '+x);
 process.exitCode=1;
}
