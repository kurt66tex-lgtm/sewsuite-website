// Public-site presentation media only; intentionally never used for CRM/customer artwork.
import manifest from '../../../public/optimized/manifest.json';
const indexed=new Map((manifest.images||[]).map(item=>[item.source,item]));
export default function PublicOptimizedImage({
 src,alt='',sizes='100vw',loading='lazy',decoding='async',className='',...props
}){
 const item=indexed.get(src);
 const variants=item?.variants||[];
 const srcSet=variants.map(v=>v.src+' '+v.width+'w').join(', ');
 const fallback=variants.at(-1)?.src||src;
 return <img
  src={fallback}
  srcSet={srcSet||undefined}
  sizes={srcSet?sizes:undefined}
  width={item?.width}
  height={item?.height}
  alt={alt}
  loading={loading}
  decoding={decoding}
  className={className}
  {...props}
 />;
}
