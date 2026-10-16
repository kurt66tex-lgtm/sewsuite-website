// Independent, read-only prelaunch adapter. No Base44 SDK or network calls.
import dataset from '@/data/prelaunch-public-snapshot.json';
const settings=dataset.BusinessSettings?.[0] || {};
function readonlyRows(name){return dataset[name] || []}
const entities=new Proxy({}, {get(_target,name){
 return {
  filter:async (query={},sort,limit)=>{let a=readonlyRows(name).filter(row=>Object.entries(query||{}).every(([k,v])=>row[k]===v));if(typeof sort==='string'){const descending=sort.startsWith('-'),field=descending?sort.slice(1):sort;a=a.sort((x,y)=>((x[field]??'')>(y[field]??'')?1:(x[field]??'')<(y[field]??'')?-1:0)*(descending?-1:1))}return typeof limit==='number'?a.slice(0,limit):a},
  list:async(sort,limit)=>{let a=[...readonlyRows(name)];if(sort){const desc=sort.startsWith('-'),field=desc?sort.slice(1):sort;a.sort((x,y)=>(String(x[field]??'').localeCompare(String(y[field]??'')))*(desc?-1:1))}return limit?a.slice(0,limit):a},
  get:async id=>readonlyRows(name).find(r=>r.id===id)||null,
  create:async()=>{throw Error('prelaunch_read_only')},
  update:async()=>{throw Error('prelaunch_read_only')},
  delete:async()=>{throw Error('prelaunch_read_only')}
 } }});
const denied=async()=>{throw Error('prelaunch_read_only')};
export const base44={
 app:{getPublicSettings:async()=>({id:'prelaunch',public_settings:{}})},
 auth:{me:denied,logout:()=>{window.location.assign('/')},redirectToLogin:()=>{window.location.assign('/')},isAuthenticated:async()=>false},
 functions:{invoke:async(name)=>{if(name==='getPublicBusinessSettings')return {data:settings};throw Error('prelaunch_function_disabled')}},
 entities,integrations:{Core:{UploadFile:denied,SendEmail:denied}},
 users:{inviteUser:denied},
 asServiceRole:{entities},
};
