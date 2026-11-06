import {readFileSync} from 'node:fs';
// Sew Suite public catalog relay. Preview remains snapshot-only; no live Base44 calls.
// Production mode requires independent Railway catalog and a private server-side key.
const approved=new Set(['BusinessSettings','ServiceType','ServiceArea','Brand','Review','PortfolioProject','PortfolioPhoto','ServiceIntakeQuestion']);
const respond=(res,status,obj)=>res.status(status).json(obj);
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return respond(res,405,{error:'method_not_allowed'});
 const on=process.env.RRS_PUBLIC_CATALOG_MODE==='independent'&&
 process.env.RRS_PUBLIC_CATALOG_ENABLED==='true'&&
 !!process.env.RRS_PUBLIC_CATALOG_API_ORIGIN&&
 (process.env.RRS_PUBLIC_CATALOG_READ_KEY?.length||0)>=32;
 // Isolated, public-data-only fixture for this image review branch. Never runs in production.
 // The independent Railway catalog is still required for the actual migration.
 if(!on){
  const fixtureAllowed=process.env.VERCEL_ENV==='preview'&&
   process.env.VERCEL_GIT_COMMIT_REF==='feature/public-image-optimization-20261106'&&
   process.env.RRS_PREVIEW_PUBLIC_SNAPSHOT==='true';
  if(!fixtureAllowed)return respond(res,503,{error:'independent_catalog_not_enabled'});
  try{
   const approvedVersion='e06f162d-8684-4eef-89fa-57bcec31a4fa';
   if(process.env.RRS_APPROVED_PUBLIC_CATALOG_VERSION!==approvedVersion)
    return respond(res,503,{error:'preview_catalog_version_mismatch'});
   const snapshot=JSON.parse(readFileSync(new URL('../src/data/prelaunch-public-snapshot.json',import.meta.url),'utf8'));
   if(snapshot.BusinessSettings?.[0]?.business_name!=='Sew Suite'||
      snapshot.PortfolioProject?.filter(x=>x.is_published).length!==8||
      [...approved].some(key=>!Array.isArray(snapshot[key]))||
      Object.keys(snapshot).some(key=>!approved.has(key)))
    return respond(res,503,{error:'preview_catalog_snapshot_rejected'});
   res.setHeader('X-RRS-Catalog-Source','approved-public-snapshot-preview-only');
   return respond(res,200,{tenant:'sew-suite',version:approvedVersion,data:snapshot});
  }catch{return respond(res,503,{error:'preview_catalog_snapshot_missing'})}
 }
 const expected=process.env.RRS_APPROVED_PUBLIC_CATALOG_VERSION;
 if(typeof expected!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(expected))
  return respond(res,503,{error:'approved_catalog_version_required'});
 let base;
 try{
  base=new URL(process.env.RRS_PUBLIC_CATALOG_API_ORIGIN);
  if(base.protocol!=='https:'||base.pathname!=='/'||base.search||base.hash||
    base.username||base.password)throw Error();
 }catch{return respond(res,503,{error:'catalog_config_invalid'})}
 try{
  const upstream=await fetch(new URL('/internal/catalog',base),{
   method:'GET',headers:{'x-rrs-public-catalog-key':process.env.RRS_PUBLIC_CATALOG_READ_KEY,
   accept:'application/json'},redirect:'manual',signal:AbortSignal.timeout(10000),cache:'no-store'
  });
  if(upstream.status!==200)return respond(res,503,{error:'catalog_unavailable'});
  const wire=await upstream.text();
  if(wire.length>450000)return respond(res,503,{error:'catalog_exceeds_limit'});
  const decoded=JSON.parse(wire);
  if(decoded?.tenant!=='sew-suite'||typeof decoded.version!=='string'||
     !decoded.data||typeof decoded.data!=='object'||Array.isArray(decoded.data)||
     Object.keys(decoded.data).some(k=>!approved.has(k))||
     [...approved].some(k=>!Array.isArray(decoded.data[k])))return respond(res,503,{error:'catalog_shape_rejected'});
  if(decoded.version.toLowerCase()!==expected.toLowerCase())
   return respond(res,503,{error:'catalog_version_mismatch'});
  res.setHeader('ETag','"'+expected.toLowerCase()+'"');
  return respond(res,200,{tenant:'sew-suite',version:decoded.version,data:decoded.data});
 }catch{return respond(res,503,{error:'catalog_unavailable'})}
}
