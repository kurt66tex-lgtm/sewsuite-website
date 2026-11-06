// Public website images only. Never scan CRM uploads, R2, or customer artwork.
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join,dirname,extname,basename} from 'node:path';
import sharp from 'sharp';
const snapshot=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
const items=(snapshot.PortfolioProject||[]).filter(p=>p.is_published&&p.public_permission_confirmed);
const settings=snapshot.BusinessSettings?.[0]||{};
const candidates=[
 ...items.map(p=>({src:p.cover_image_url,alt:p.cover_alt_text,context:'portfolio',slug:p.slug})),
 {src:settings.hero_image_url,alt:'Sew Suite custom embroidery and branded apparel',context:'hero',slug:'home'}
].filter(x=>x.src);
const result=[];
for(const item of candidates){
 if(!/^\/(?:portfolio-[a-z0-9-]+\.jpg|media\/portfolio\/[A-Za-z0-9_.-]+\.(?:jpg|png)|sew-suite-[a-z0-9-]+\.png)$/.test(item.src))throw Error('unapproved_public_image_'+item.src);
 if(!item.alt?.trim())throw Error('missing_alt_'+item.slug);
 const input=join('public',item.src.slice(1));
 const original=statSync(input).size;
 const stem=basename(item.src,extname(item.src));
 const variants=[];
 for(const width of [480,800,1200,1600]){
  const meta=await sharp(input).metadata();
  if(meta.width<width&&width!==480)continue;
  const target='/optimized/'+stem+'-'+Math.min(width,meta.width)+'.webp';
  mkdirSync(dirname(join('public',target.slice(1))),{recursive:true});
  await sharp(input).rotate().resize({width,withoutEnlargement:true}).webp({quality:78,effort:5}).toFile(join('public',target.slice(1)));
  const bytes=statSync(join('public',target.slice(1))).size;
  variants.push({width:Math.min(width,meta.width),src:target,bytes});
 }
 result.push({source:item.src,alt:item.alt,context:item.context,slug:item.slug,originalBytes:original,variants});
}
mkdirSync('public/optimized',{recursive:true});
writeFileSync('public/optimized/manifest.json',JSON.stringify({version:1,scope:'public-website-only',images:result},null,2)+'\n');
console.log('PUBLIC_WEBSITE_IMAGE_OPTIMIZATION_PASS '+JSON.stringify({images:result.length,variants:result.reduce((n,x)=>n+x.variants.length,0)}));
