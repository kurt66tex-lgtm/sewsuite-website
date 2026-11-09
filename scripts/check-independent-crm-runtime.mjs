// Fail independent migration acceptance if the original admin UI still depends on
// a public-only compatibility adapter instead of real authenticated CRM APIs.
// Diagnostic gate only: never enables provider, billing, or production functions.
import {readFileSync} from 'node:fs';

export function evaluateIndependentCrmRuntime({adapter,agencyControls,app}) {
 const failures=[];
 const usesAgencyFunction=/base44\.functions\.invoke\(['"]manageAgencyAccount['"]/.test(agencyControls);
 const publicOnlyFunctions=/public_function_disabled/.test(adapter);
 const noStaffAuth=/auth\s*:\s*\{[^}]*me\s*:\s*denied/s.test(adapter);
 const noEntityWrites=/create\s*:\s*denied\s*,\s*update\s*:\s*denied/.test(adapter);
 const agencyRoute=/AgencyControls/.test(app);
 if(agencyRoute && usesAgencyFunction && publicOnlyFunctions)
   failures.push('agency_controls_backend_unimplemented: manageAgencyAccount is routed to public_function_disabled');
 if(agencyRoute && noStaffAuth)
   failures.push('independent_admin_auth_unimplemented: auth.me is denied by public-only adapter');
 if(agencyRoute && noEntityWrites)
   failures.push('independent_crm_writes_unimplemented: entity create/update are denied by public-only adapter');
 return {ready:failures.length===0,failures};
}

export function checkIndependentCrmRuntime(){
 return evaluateIndependentCrmRuntime({
  adapter:readFileSync('src/api/base44Client.js','utf8'),
  agencyControls:readFileSync('src/pages/admin/AgencyControls.jsx','utf8'),
  app:readFileSync('src/App.jsx','utf8')
 });
}
