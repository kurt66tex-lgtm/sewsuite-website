// Sew Suite public catalog relay. Preview remains snapshot-only; no live Base44 calls.
// Production mode requires independent Railway catalog and a private server-side key.
const approved=new Set(['BusinessSettings','ServiceType','ServiceArea','Brand','Review','PortfolioProject','PortfolioPhoto','ServiceIntakeQuestion']);
const respond=(res,status,obj)=>res.status(status).json(obj);
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=60, stale-while-revalidate=120');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return respond(res,405,{error:'method_not_allowed'});
 const on=process.env.RRS_PUBLIC_CATALOG_MODE==='independent'&&
 process.env.RRS_PUBLIC_CATALOG_ENABLED==='true'&&
 !!process.env.RRS_PUBLIC_CATALOG_API_ORIGIN&&
 (process.env.RRS_PUBLIC_CATALOG_READ_KEY?.length||0)>=32;
 if(!on)return respond(res,503,{error:'independent_catalog_not_enabled'});
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
  res.setHeader('ETag','"'+decoded.version.replace(/[^A-Za-z0-9_-]/g,'').slice(0,100)+'"');
  return respond(res,200,{tenant:'sew-suite',version:decoded.version,data:decoded.data});
 }catch{return respond(res,503,{error:'catalog_unavailable'})}
}
