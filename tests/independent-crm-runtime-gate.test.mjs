import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateIndependentCrmRuntime} from '../scripts/check-independent-crm-runtime.mjs';

const admin="await base44.functions.invoke('manageAgencyAccount', { action: 'get' })";
const app="import AgencyControls from '@/pages/admin/AgencyControls';";
const publicAdapter="auth:{me:denied}, functions:{invoke:async()=>{throw Error('public_function_disabled')}}, entities:{create:denied,update:denied}";

test('a copied Agency Controls screen with a disabled public backend fails cutover',()=>{
 const result=evaluateIndependentCrmRuntime({adapter:publicAdapter,agencyControls:admin,app});
 assert.equal(result.ready,false);
 assert.equal(result.failures.length,3);
});
test('a dedicated independent implementation is not blocked by the public-only signature check',()=>{
 const result=evaluateIndependentCrmRuntime({adapter:"auth:{me:staffAuth},functions:{invoke:agencyApi},entities:{create:crmCreate,update:crmUpdate}",agencyControls:admin,app});
 assert.deepEqual(result,{ready:true,failures:[]});
});
test('a public-only site without an agency route is not misreported as a complete CRM',()=>{
 const result=evaluateIndependentCrmRuntime({adapter:publicAdapter,agencyControls:admin,app:"import Home from './Home';"});
 assert.deepEqual(result,{ready:true,failures:[]});
});
