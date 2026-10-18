import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

export default function PortfolioSection({ serviceSlug=null, areaSlug=null, limit=6, heading='Recent Work' }) {
  const { settings } = useBusinessSettings();
  const [projects,setProjects]=useState([]);
  const enabled=settings?.portfolio_enabled === true;
  useEffect(()=>{ if(!enabled) return; base44.entities.PortfolioProject.filter({is_published:true},'display_order',100).then(rows=>{
    let x=rows||[];
    if(serviceSlug) x=x.filter(p=>(p.service_slugs||[]).includes(serviceSlug));
    if(areaSlug) x=x.filter(p=>(p.service_area_slugs||[]).includes(areaSlug));
    if(!serviceSlug&&!areaSlug) {
      const featured=x.filter(p=>p.featured);
      x=featured.length?featured:x;
    }
    setProjects(x.slice(0,limit));
  }).catch(()=>setProjects([])); },[enabled,serviceSlug,areaSlug,limit]);
  if(!enabled||projects.length===0) return null;
  return <section className="py-10"><div className="flex items-end justify-between gap-3 mb-5"><div><h2 className="text-2xl font-bold text-slate-900">{heading}</h2><p className="text-sm text-slate-500 mt-1">{serviceSlug ? `Examples related to this service from ${settings?.business_name||'our team'}.` : `A selection of completed work from ${settings?.business_name||'our team'}.`}</p></div>{settings?.portfolio_page_enabled!==false&&<Link to="/our-work" className="text-sm font-semibold text-brand-dark">View all →</Link>}</div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{projects.map(p=><Link key={p.id} to={settings?.portfolio_detail_pages_enabled===false?'/our-work':`/our-work/${p.slug}`} className="group border border-slate-200 rounded-xl overflow-hidden bg-white"><div className="aspect-[4/3] bg-slate-100 overflow-hidden">{p.cover_image_url?<img src={p.cover_image_url} alt={p.cover_alt_text||p.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"/>:<div className="w-full h-full grid place-items-center text-slate-400 text-sm">Project photo</div>}</div><div className="p-4">{p.category&&<div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.category}</div>}<h3 className="font-bold text-slate-900 mt-1">{p.title}</h3>{p.summary&&<p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.summary}</p>}</div></Link>)}</div></section>;
}