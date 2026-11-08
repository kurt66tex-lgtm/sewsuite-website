// Portable Base44 -> independent Railway/Vercel migration release evidence gate.
// Conservative: missing, preview-only, placeholder-only or unverified modules block cutover.
const mandatory=[
 'public_pages','dns_and_https','seo_static_dynamic_parity','public_content_images',
 'quote_intake','private_artwork_upload_and_download','customer_office_mail',
 'staff_auth_and_roles','crm_workflows','agency_controls','business_settings',
 'ai_chat_lead_capture','ai_voice_lead_capture','backup_and_restore'
];
const acceptanceKind={
 agency_controls:['real_private_data','authorized_owner_save','client_admin_denial','audit','reload'],
 customer_office_mail:['automated_new_quote','customer_delivery','office_delivery','no_historical_replays'],
 private_artwork_upload_and_download:['browser_put','private_commit','staff_download','unauthorized_denial'],
 ai_voice_lead_capture:['consented_capture','natural_close','crm_record'],
 ai_chat_lead_capture:['consented_capture','auto_submit','crm_record'],
 backup_and_restore:['remote_backup','decrypt','isolated_restore']
};
export function evaluateMigrationRelease(manifest){
 const errors=[];
 if(!manifest||typeof manifest!=='object'||manifest.schema_version!==1||
    typeof manifest.client!=='string'||!manifest.client.trim()||
    !manifest.modules||typeof manifest.modules!=='object')return {ready:false,errors:['manifest_invalid']};
 for(const name of mandatory){
  const row=manifest.modules[name];
  if(!row||typeof row!=='object') {errors.push(name+':missing');continue;}
  if(row.status!=='PASS'){errors.push(name+':'+String(row.status||'not_passed'));continue;}
  if(!Array.isArray(row.evidence)||!row.evidence.length||
      row.evidence.some(v=>typeof v!=='string'||v.trim().length<12))
    errors.push(name+':evidence_missing_or_invalid');
  if(row.real_target_verified!==true)errors.push(name+':real_target_not_verified');
  if(row.preview_only===true||row.placeholder_only===true)errors.push(name+':preview_or_placeholder');
  const req=acceptanceKind[name]||[];
  for(const item of req)if(row.checks?.[item]!==true)errors.push(name+':missing_'+item);
 }
 return {ready:errors.length===0,errors,required:mandatory.length,passed:mandatory.filter(x=>manifest.modules[x]?.status==='PASS').length};
}
export const requiredMigrationCapabilities=Object.freeze([...mandatory]);
