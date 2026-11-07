// Build-only optimization of approved PUBLIC website assets. CRM and customer uploads are out of scope.
import {readFileSync,writeFileSync,mkdirSync,statSync,existsSync} from 'node:fs';
import {join,dirname,extname,basename} from 'node:path';
import sharp from 'sharp';

const snapshot=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
const projects=(snapshot.PortfolioProject||[]).filter(p=>p.is_published===true&&p.public_permission_confirmed===true);
const photos=(snapshot.PortfolioPhoto||[]).filter(p=>p.is_published===true&&p.public_permission_confirmed===true);
const settings=snapshot.BusinessSettings?.[0]||{};
const candidates=[
 ...projects.map(p=>({src:p.cover_image_url,alt:p.cover_alt_text,context:'portfolio',slug:p.slug})),
 ...photos.map(p=>({src:p.image_url,alt:p.alt_text,context:'portfolio-photo',slug:p.slug||p.id})),
 {src:settings.hero_image_url,alt:settings.hero_image_alt||'Sew Suite branded embroidered cap and polo shirt',context:'hero',slug:'home'},
 {src:settings.about_image_url,alt:settings.about_image_alt||'Sew Suite team and custom apparel work',context:'about',slug:'about'},
 {src:settings.logo_url,alt:settings.business_name||'Sew Suite',context:'brand',slug:'header-logo'},
 {src:settings.logo_reversed_url,alt:settings.business_name||'Sew Suite',context:'brand',slug:'footer-logo'}
].filter(x=>x.src);
// EXPLICIT PUBLIC-ASSET ALLOWLIST. Do not add CRM/artwork paths, private URLs or arbitrary uploads.
const allowed=/^\/(?:portfolio-[a-z0-9-]+\.(?:jpg|jpeg|png)|media\/portfolio\/[A-Za-z0-9_.-]+\.(?:jpg|jpeg|png)|sew-suite-(?:hero|logo-standard|logo-reversed)\.png)$/;
const seen=new Set(),images=[];
for(const item of candidates){
 if(!allowed.test(item.src))throw Error('unapproved_public_asset_'+item.context+'_'+item.src);
 if(!item.alt?.trim())throw Error('public_image_alt_missing_'+item.slug);
 if(seen.has(item.src))continue;
 seen.add(item.src);
 const input=join('public',item.src.slice(1));
 if(!existsSync(input))throw Error('public_image_missing_'+input);
 const originalBytes=statSync(input).size;
 const metadata=await sharp(input).metadata();
 const width=metadata.autoOrient?.width||metadata.width, height=metadata.autoOrient?.height||metadata.height;
 if(!width||!height||width>8000||height>8000)throw Error('public_image_dimensions_invalid_'+item.src);
 const lossless=item.context==='brand';
 const targetWidths=[480,800,1200,1600,width].filter(w=>w<=width);
 const widths=[...new Set(targetWidths)].sort((a,b)=>a-b);
 const variants=[];
 for(const w of widths){
  const dst='/optimized/'+basename(item.src,extname(item.src))+'-'+w+'.webp';
  const file=join('public',dst.slice(1));
  mkdirSync(dirname(file),{recursive:true});
  await sharp(input).rotate().resize({width:w,withoutEnlargement:true})
   .webp(lossless?{lossless:true,effort:6}:{quality:82,effort:5}).toFile(file);
  const bytes=statSync(file).size;
  // Keep logos as pixel-perfect PNG if lossless WebP isn't smaller.
  if(lossless&&bytes>=originalBytes)continue;
  variants.push({width:w,height:Math.round(height*w/width),src:dst,bytes});
 }
 images.push({source:item.src,alt:item.alt,context:item.context,slug:item.slug,
  width,height,originalBytes,variants});
}
mkdirSync('public/optimized',{recursive:true});
const manifest={version:2,scope:'public-website-only',images};
writeFileSync('public/optimized/manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('PUBLIC_WEBSITE_IMAGE_OPTIMIZATION_PASS '+JSON.stringify({
 images:images.length,variants:images.reduce((n,x)=>n+x.variants.length,0),
 publicOnly:true,crmUploadsTouched:false
}));
