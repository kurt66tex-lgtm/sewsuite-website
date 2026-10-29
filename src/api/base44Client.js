// RRS independent public content compatibility adapter.
// Existing React components still import {base44}; there are NO Base44 SDK/network calls.
// Protected preview defaults to its signed-off snapshot. Production must explicitly
// select independent mode and pass a real owned catalog API acceptance gate.
import snapshot from '@/data/prelaunch-public-snapshot.json';
const independent=import.meta.env.VITE_PUBLIC_CATALOG_MODE==='independent';
const allowed=new Set(['BusinessSettings','ServiceType','ServiceArea','Brand','Review','PortfolioProject','PortfolioPhoto','ServiceIntakeQuestion']);
const denied=async()=>{throw Error('public_write_not_allowed')};
let activeRequest=null,expiresAt=0;
async function document(){
 if(!independent)return snapshot;
 if(activeRequest&&Date.now()<expiresAt)return activeRequest;
 activeRequest=fetch('/api/public-catalog',{cache:'no-store',headers:{accept:'application/json'}})
  .then(async response=>{
   if(!response.ok)throw Error('independent_catalog_unavailable');
   const message=await response.json();
   if(message.tenant!=='sew-suite'||!message.version||
      !import.meta.env.VITE_APPROVED_CATALOG_VERSION||
      message.version!==import.meta.env.VITE_APPROVED_CATALOG_VERSION||
      !message.data||typeof message.data!=='object'||
      Object.keys(message.data).some(key=>!allowed.has(key))||
      [...allowed].some(key=>!Array.isArray(message.data[key])))throw Error('catalog_shape_invalid');
   return message.data;
  }).catch(error=>{activeRequest=null;expiresAt=0;throw error});
 expiresAt=Date.now()+60000;
 return activeRequest;
}
function repairDisplayText(value){
 if(typeof value==='string')return value.replace(/Ã©/g,'é').replace(/Ã¨/g,'è').replace(/Ã¢/g,'â').replace(/â€”|â€\u0094|â\u20ac\u201d/g,'—').replace(/â€“/g,'–');
 if(Array.isArray(value))return value.map(repairDisplayText);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,repairDisplayText(item)]));
 return value;
}
async function records(name){
 const data=await document();
 return allowed.has(String(name))?(data[name]||[]).map(repairDisplayText):[];
}
function sorted(rows,sort){
 if(typeof sort!=='string'||!sort)return rows;
 const descending=sort.startsWith('-'),field=descending?sort.slice(1):sort;
 return rows.sort((a,b)=>{const av=a?.[field],bv=b?.[field];const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:String(av??'').localeCompare(String(bv??''),undefined,{numeric:true});return cmp*(descending?-1:1);});
}
const entities=new Proxy({}, {get(_target,name){
 return {
  filter:async(query={},sort,limit)=>{
   const result=sorted((await records(name)).filter(row=>Object.entries(query||{}).every(([k,v])=>row?.[k]===v)),sort);
   return typeof limit==='number'?result.slice(0,limit):result;
  },
  list:async(sort,limit)=>{
   const result=sorted(await records(name),sort);
   return typeof limit==='number'?result.slice(0,limit):result;
  },
  get:async id=>(await records(name)).find(row=>row.id===id)||null,
  create:denied,update:denied,delete:denied
 }
}});
export const base44={
 app:{getPublicSettings:async()=>({id:'rrs-independent-public',public_settings:{}})},
 auth:{me:denied,logout:()=>{window.location.assign('/')},
  redirectToLogin:()=>{window.location.assign('/')},isAuthenticated:async()=>false},
 functions:{invoke:async(name)=>{
  if(name==='getPublicBusinessSettings')return {data:(await document()).BusinessSettings?.[0]||{}};
  throw Error('public_function_disabled');
 }},
 entities,integrations:{Core:{UploadFile:denied,SendEmail:denied}},
 users:{inviteUser:denied},
 asServiceRole:{entities}
};
