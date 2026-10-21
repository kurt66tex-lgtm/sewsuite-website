// Build-time validation: published Sew Suite portfolio media must be
// independent of Base44, bundled with the preview, and safe to display.
// No network access; never changes public content, DNS, or customer data.
import {readFileSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const snapshot=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
const items=(snapshot.PortfolioProject||[]).filter(x=>x.is_published);
if(items.length!==9)throw Error('published_portfolio_count_mismatch');
const paths=new Set();
for(const item of items){
 if(item.public_permission_confirmed!==true||!item.cover_alt_text?.trim())throw Error('public_media_permission_or_alt_missing_'+item.slug);
 const route=item.cover_image_url||'';
 if(!/^\/(?:portfolio-[a-z0-9-]+\.jpg|media\/portfolio\/[A-Za-z0-9_.-]+\.(?:jpg|png))$/.test(route))
  throw Error('external_or_unsafe_media_url_'+item.slug);
 if(paths.has(route))throw Error('duplicate_media_file');
 paths.add(route);
 const file=join('public',route.slice(1));
 if(!existsSync(file)||statSync(file).size<100)throw Error('missing_static_media_'+item.slug);
 const bytes=readFileSync(file);
 const isPng=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const isJpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!(route.endsWith('.png')?isPng:isJpeg))throw Error('invalid_media_signature_'+item.slug);
}
const evidence=JSON.parse(readFileSync('scripts/portfolio-media-verified.json','utf8'));
if(evidence.total!==1||evidence.assets?.length!==1)throw Error('media_mirror_evidence_missing');
for(const item of evidence.assets){
 const bytes=readFileSync(join('public',item.local_path.slice(1)));
 if(bytes.length!==item.bytes||createHash('sha256').update(bytes).digest('hex')!==item.sha256)
  throw Error('portfolio_media_sha256_verification_failed_'+item.slug);
}
console.log('RRS_INDEPENDENT_PORTFOLIO_MEDIA_PASS '+JSON.stringify({images:items.length,externalBase44Media:false,verifiedNewAssets:evidence.assets.length}));
