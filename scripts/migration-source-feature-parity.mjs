// Additional SOURCE-CONTROL-LEVEL gate for Base44 -> portable CRM cutovers.
// It is independent of site build so ordinary public hotfixes stay deployable.
const sourceFile=/^[a-zA-Z0-9_./-]+\.(?:jsx?|tsx?|mjs)$/;
const known=new Set(['Launch & Readiness','SEO','Website','Reputation','Google Local Services','AI Phone & Chat','Billing & Invoices']);
const validId=/^[a-z0-9][a-z0-9_]{2,100}$/;
export function evaluateSourceFeatureParity(manifest){
 const failures=[];
 if(!manifest||manifest.schema_version!==1||
  !/^[a-f0-9]{24}$/.test(manifest.original_app_id||'')||
  typeof manifest.original_app_name!=='string'||!manifest.original_app_name.trim()||
  manifest.source_inventory_reviewed!==true||
  !Array.isArray(manifest.features)||!manifest.features.length)
  return {ready:false,failures:['source_manifest_invalid']};
 const ids=new Set();
 for(const f of manifest.features){
  const id=f?.id;
  if(typeof id!=='string'||!validId.test(id)||ids.has(id)){
   failures.push('duplicate_or_invalid_source_feature_id');continue;
  }
  ids.add(id);
  if(!known.has(f.section)||typeof f.source_file!=='string'||
    !sourceFile.test(f.source_file)||!f.source_file.startsWith('src/')||
    typeof f.source_control!=='string'||!f.source_control.trim())
   failures.push(id+':source_reference_invalid');
  if(f.selected===false){
   if(f.status!=='NOT_SELECTED'||typeof f.source_selection_evidence!=='string'||
      f.source_selection_evidence.length<15)failures.push(id+':unselected_not_verified');
   continue;
  }
  if(f.selected!==true){failures.push(id+':selection_unverified');continue}
  if(f.status!=='PASS'){
   failures.push(id+':'+String(f.status||'not_passed'));
   continue;
  }
  if(f.target?.real_production_tested!==true||f.target?.preview_only===true||
     f.target?.placeholder_only===true)
   failures.push(id+':production_behavior_not_verified');
  if(!Array.isArray(f.target?.evidence)||!f.target.evidence.length||
    f.target.evidence.some(x=>typeof x!=='string'||x.length<15))
    failures.push(id+':target_evidence_invalid');
  if(!Array.isArray(f.required_checks)||!f.required_checks.length)
    failures.push(id+':missing_required_checks');
  for(const check of f.required_checks||[]){
   if(typeof check!=='string'||!validId.test(check)||f.target?.checks?.[check]!==true)
    failures.push(id+':missing_'+String(check));
  }
 }
 return {ready:failures.length===0,failures,sourceFeatures:ids.size,
  passed:manifest.features.filter(f=>f.status==='PASS'||f.status==='NOT_SELECTED').length};
}
