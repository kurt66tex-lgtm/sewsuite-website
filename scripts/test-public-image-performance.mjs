// Public website image performance/SEO regression. Never accesses CRM or uploads.
import {readFileSync,existsSync,statSync} from 'node:fs';
import {join} from 'node:path';
const manifest=JSON.parse(readFileSync('public/optimized/manifest.json','utf8'));
const snapshot=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
if(manifest.version!==2||manifest.scope!=='public-website-only')throw Error('public_image_manifest_version_or_scope_invalid');
const settings=snapshot.BusinessSettings[0];
const published=snapshot.PortfolioProject.filter(p=>p.is_published&&p.public_permission_confirmed);
const required=[settings.hero_image_url,settings.logo_url,settings.logo_reversed_url,...published.map(p=>p.cover_image_url)];
const map=new Map(manifest.images.map(i=>[i.source,i]));
if(new Set(manifest.images.map(i=>i.source)).size!==manifest.images.length)throw Error('duplicate_public_image');
if(required.some(p=>!map.has(p)))throw Error('public_image_coverage_incomplete');
let saved=0,variantCount=0,largest=0;
for(const item of manifest.images){
 if(!item.source.startsWith('/')||/\/(?:crm|uploads?|artwork|proofs?|private)\//i.test(item.source))throw Error('private_or_unapproved_image_scope');
 if(!item.alt?.trim()||!/^[1-9]\d*$/.test(String(item.width))||!/^[1-9]\d*$/.test(String(item.height)))throw Error('missing_image_seo_or_dimensions_'+item.source);
 if(!existsSync(join('public',item.source.slice(1))))throw Error('source_image_missing_'+item.source);
 if(!Array.isArray(item.variants))throw Error('no_variants_recorded');
 if(item.context!=='brand'&&!item.variants.length)throw Error('photo_variants_missing_'+item.source);
 if(item.context!=='brand'&&item.variants.at(-1).width!==item.width)throw Error('missing_native_width_variant_'+item.source);
 let best=item.originalBytes;
 for(const v of item.variants){
  variantCount++;
  if(!v.src.startsWith('/optimized/')||!v.src.endsWith('.webp')||v.width>item.width||v.height>item.height)throw Error('invalid_webp_variant_'+item.source);
  for(const root of ['public','dist']){
   const file=join(root,v.src.slice(1));
   if(!existsSync(file))throw Error('missing_built_image_'+file);
   if(statSync(file).size!==v.bytes)throw Error('webp_bytes_mismatch_'+file);
  }
  const bytes=readFileSync(join('dist',v.src.slice(1)));
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('invalid_webp_format_'+v.src);
  largest=Math.max(largest,v.bytes);
  best=Math.min(best,v.bytes);
 }
 saved+=item.originalBytes-best;
}
const home=readFileSync('src/pages/Home.jsx','utf8');
const section=readFileSync('src/components/site/PortfolioSection.jsx','utf8');
const about=readFileSync('src/pages/About.jsx','utf8');
const site=readFileSync('src/components/site/SiteLayout.jsx','utf8');
if(!home.includes('<PublicOptimizedImage src={heroImageUrl}')||!home.includes('fetchPriority="high"')||!home.includes('loading="eager"'))throw Error('homepage_hero_not_prioritized');
if(!section.includes('<PublicOptimizedImage src={p.cover_image_url}'))throw Error('featured_images_not_optimized');
if(!about.includes('<PublicOptimizedImage'))throw Error('about_image_not_optimized');
if(!site.includes('<PublicOptimizedImage'))throw Error('brand_and_public_media_not_optimized');
const homepageHtml=readFileSync('dist/index.html','utf8');
if(!homepageHtml.includes('imagesrcset=')||!homepageHtml.includes('fetchpriority="high"'))throw Error('seo_fallback_hero_not_responsive');
for(const p of published){
 const html=readFileSync(join('dist','our-work',p.slug,'index.html'),'utf8');
 if(!html.includes(p.cover_alt_text.replace(/&/g,'&amp;').replace(/'/g,'&#39;'))||
    !html.includes('ImageObject')||!html.includes('og:image'))throw Error('portfolio_image_metadata_missing_'+p.slug);
}
console.log('PUBLIC_WEBSITE_IMAGE_SEO_PERFORMANCE_PASS '+JSON.stringify({
 images:manifest.images.length,webpVariants:variantCount,largestVariantBytes:largest,
 sumOfPerImageBestCaseSavedBytes:saved,
 scope:'public website only',customerArtworkTouched:false
}));
