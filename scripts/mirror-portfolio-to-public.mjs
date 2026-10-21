/**
 * One-time, replay-safe public media migration from the client's LIVE Base44
 * portfolio into Vercel-served static assets committed to this Git repository.
 * Never connects to Base44 APIs or modifies Base44 LIVE.
 *
 * Run on a trusted CI worker: node scripts/mirror-portfolio-to-public.mjs
 * Each image must have an explicitly approved origin, type and exact byte count.
 * This migration is preview-only; no Base44 LIVE or DNS changes are made.
 */
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=JSON.parse(await readFile(resolve(root,'scripts/portfolio-media-sources.json'),'utf8'));
const snapshotPath=resolve(root,'src/data/prelaunch-public-snapshot.json');
const snapshot=JSON.parse(await readFile(snapshotPath,'utf8'));
if(src.schema_version!==1||src.source_app!=='69e39cd9aef38e2e50456a73'||src.assets?.length!==9||
   snapshot.PortfolioProject?.length!==9)throw Error('portfolio_inventory_mismatch');
const recs=new Map(snapshot.PortfolioProject.map(x=>[x.slug,x]));
const hashes=[];
for(const entry of src.assets){
 if(!entry||typeof entry.slug!=='string'||!recs.has(entry.slug))throw Error('unknown_portfolio_slug');
 if(!/^\/media\/portfolio\/[A-Za-z0-9_.-]+\.(jpg|jpeg|png)$/.test(entry.local_path))throw Error('unsafe_public_asset_path');
 const url=new URL(entry.source_url);
 if(url.protocol!=='https:'||url.hostname!=='media.base44.com'||
    !url.pathname.startsWith('/images/public/'+src.source_app+'/')||
    url.search||url.hash||entry.expected_bytes<100||entry.expected_bytes>3000000)throw Error('source_not_allowlisted');
 const file=resolve(root,'public',entry.local_path.slice(1));
 if(!file.startsWith(resolve(root,'public/media/portfolio')+'/'))throw Error('path_escape');
 const portfolio=recs.get(entry.slug);
 if(!portfolio.is_published||portfolio.public_permission_confirmed!==true)throw Error('unpublished_or_unapproved');
 if(![entry.source_url,entry.local_path].includes(portfolio.cover_image_url))throw Error('source_changed_since_inventory');
 let buffer;let reused=false;
 try{
  const info=await stat(file);
  if(!info.isFile()||info.size!==entry.expected_bytes)throw Error('existing_asset_changed_'+entry.slug);
  buffer=await readFile(file);reused=true;
 }catch(err){
  if(err.code!=='ENOENT')throw err;
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(response.status!==200)throw Error('source_download_rejected_'+entry.slug);
  const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
  const expected=entry.local_path.endsWith('.png')?'image/png':'image/jpeg';
  if(mime!==expected)throw Error('source_content_type_rejected_'+entry.slug);
  buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.length!==entry.expected_bytes)throw Error('source_size_mismatch_'+entry.slug);
  const isPng=buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const isJpeg=buffer.length>4&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
  if(expected==='image/png'?!isPng:!isJpeg)throw Error('source_magic_mismatch_'+entry.slug);
  await mkdir(dirname(file),{recursive:true});
  await writeFile(file,buffer,{flag:'wx'});
 }
 const isPng=buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const isJpeg=buffer.length>4&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255;
 if(!((entry.local_path.endsWith('.png')&&isPng)||(entry.local_path.endsWith('.jpg')&&isJpeg)))throw Error('local_content_signature_changed');
 const sha256=createHash('sha256').update(buffer).digest('hex');
 hashes.push({slug:entry.slug,local_path:entry.local_path,sha256,bytes:buffer.length,reused});
 portfolio.cover_image_url=entry.local_path;
 console.log('RRS_PORTFOLIO_MEDIA_MIRROR_PASS',entry.slug,buffer.length,reused?'reused':'copied');
}
if(new Set(hashes.map(x=>x.local_path)).size!==9)throw Error('duplicate_media_destination');
await writeFile(snapshotPath,JSON.stringify(snapshot,null,2)+'\n');
const evidence={schema_version:1,source_app:src.source_app,total:hashes.length,total_bytes:hashes.reduce((n,x)=>n+x.bytes,0),assets:hashes.map(({reused,...x})=>x)};
await writeFile(resolve(root,'scripts/portfolio-media-verified.json'),JSON.stringify(evidence,null,2)+'\n');
console.log('RRS_PORTFOLIO_MEDIA_INDEPENDENCE_READY',JSON.stringify({images:hashes.length,total_bytes:evidence.total_bytes,refs_local:true}));
