// Regression for build-time route HTML in the real Vite output.
// Never removes preview noindex or touches the live website.
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const data=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
const services=(data.ServiceType||[]).filter(s=>s.active&&s.publicly_advertised);
const cities=(data.ServiceArea||[]).filter(a=>a.active&&a.indexable!==false);
const projects=(data.PortfolioProject||[]).filter(p=>p.is_published===true&&p.public_permission_confirmed===true);
if(services.length!==9||cities.length!==20)throw Error('snapshot_catalog_changed_without_review');
const routes=[
 {path:'/services',title:'Custom Apparel'},
 {path:'/service-areas',title:'Service Areas'},
 ...services.map(s=>({path:'/services/'+s.slug,title:s.name,local:s.service_intro||s.short_description})),
 ...cities.map(a=>({path:'/service-areas/'+a.slug,title:a.city,local:a.local_intro})),
 {path:'/',title:'Sew Suite'},
 {path:'/our-work',title:'Portfolio'},
 ...projects.map(p=>({path:'/our-work/'+p.slug,title:p.title,local:p.summary})),
 {path:'/reviews',title:'Reviews'},
 {path:'/about',title:'About Sew Suite'},
 {path:'/why-us',title:'Why Choose Sew Suite'},
 {path:'/faqs',title:'FAQs'},
 {path:'/contact',title:'Contact Sew Suite'},
 {path:'/book-service',title:'Request a Custom Apparel Quote'},
 {path:'/privacy-policy',title:'Privacy Policy'}
];
if(projects.length!==8||routes.length!==48)throw Error('route_count_mismatch');
for(const r of routes){
 const f=join('dist',r.path.slice(1),'index.html');
 if(!existsSync(f))throw Error('missing_static_route_'+r.path);
 const html=readFileSync(f,'utf8');
 if(!html.includes('<title>')||!html.includes('rel="canonical" href="https://sewsuite.com'+r.path+'"'))throw Error('missing_page_metadata_'+r.path);
 if(!html.includes('<meta name="robots" content="noindex, nofollow"'))throw Error('preview_indexing_guard_missing_'+r.path);
 if(!html.includes('id="sew-suite-seo-fallback"')||!html.includes('<script type="module"'))throw Error('seo_or_hydration_missing_'+r.path);
 if(!html.includes('application/ld+json'))throw Error('missing_schema_'+r.path);
 if(!html.includes(r.title))throw Error('incorrect_page_title_'+r.path);
 if(r.local && !html.includes(r.local.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')))throw Error('localized_body_missing_'+r.path);
}
const original=readFileSync('dist/index.html','utf8');
if(!original.includes('<meta name="robots" content="noindex, nofollow"'))throw Error('root_prelaunch_guard_missing');
console.log('RRS_VITE_STATIC_SEO_ACCEPTANCE_PASS '+JSON.stringify({routes:routes.length,services:services.length,cities:cities.length,portfolioPages:projects.length,previewNoindex:true,customerDataTouched:false}));
