import manifest from '../../../public/optimized/manifest.json';
const bySource=new Map((manifest.images||[]).map(item=>[item.source,item]));
export default function PublicOptimizedImage({src,alt='',sizes='100vw',loading='lazy',className='',...props}){
 const item=bySource.get(src);
 const variants=item?.variants||[];
 const srcSet=variants.map(v=>v.src+' '+v.width+'w').join(', ');
 const fallback=variants.at(-1)?.src||src;
 return <img src={fallback} srcSet={srcSet||undefined} sizes={srcSet?sizes:undefined} alt={alt} loading={loading} decoding="async" className={className} {...props}/>;
}
