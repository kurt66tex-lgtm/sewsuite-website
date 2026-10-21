// Compile crawlable, unique public HTML for the actual Vite deployment.
// This is a build-time, read-only projection of the signed-off public snapshot.
// Browser React hydrates the same URL; no Base44 or production CRM calls are made.
import {readFileSync,writeFileSync,mkdirSync,statSync} from 'node:fs';
import {join,dirname} from 'node:path';
const snapshot=JSON.parse(readFileSync('src/data/prelaunch-public-snapshot.json','utf8'));
const template=readFileSync('dist/index.html','utf8');
if(!template.includes('<div id="root"></div>')||!template.includes('</head>'))throw Error('vite_html_template_unexpected');
const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const jsonld=value=>JSON.stringify(value).replace(/</g,'\\u003c');
const para=text=>text?'<p>'+esc(text)+'</p>':'';
const faqBlock=faqs=>Array.isArray(faqs)&&faqs.length?'<section><h2>Frequently Asked Questions</h2>'+faqs.map(q=>'<article><h3>'+esc(q.question)+'</h3>'+para(q.answer)+'</article>').join('')+'</section>':'';
const business={ '@context':'https://schema.org','@type':'LocalBusiness',name:'Sew Suite',url:'https://sewsuite.com',telephone:'+1-469-640-8568',email:'support@sewsuite.com',areaServed:'North Texas'};
const base='https://sewsuite.com';
const serviceRows=(snapshot.ServiceType||[]).filter(s=>s.active===true&&s.publicly_advertised===true);
const cityRows=(snapshot.ServiceArea||[]).filter(a=>a.active===true&&a.indexable!==false);
const routes=[];
function add(path,title,description,body,extraSchemas=[]){
 if(routes.some(x=>x.path===path))throw Error('duplicate_route_'+path);
 if(!path.startsWith('/')||!title||!description||!body)throw Error('invalid_public_route');
 routes.push({path,title,description,body,extraSchemas});
}
const servicesIntro='<h1>Custom Embroidery, Screen Printing &amp; Branded Apparel</h1>'+para('Sew Suite provides custom embroidery, screen printing, DTF, corporate apparel, team and school wear, hats, bags, towels and artwork assistance.');
add('/services','Custom Apparel & Decoration Services | Sew Suite','Nine custom embroidery, screen printing, DTF and branded apparel services available to North Texas businesses, schools, teams and organizations.',
 servicesIntro+'<section>'+serviceRows.map(s=>'<article><h2><a href="/services/'+encodeURIComponent(s.slug)+'">'+esc(s.name)+'</a></h2>'+para(s.short_description)+'</article>').join('')+'</section>');
for(const s of serviceRows){
 const path='/services/'+s.slug;
 const schema={'@context':'https://schema.org','@type':'Service',name:s.name,description:s.meta_description||s.short_description,areaServed:'North Texas',provider:{'@type':'LocalBusiness',name:'Sew Suite',url:base},url:base+path};
 const faq=s.faqs||[];
 if(faq.length)schema.hasOfferCatalog=undefined;
 const faqSchema=faq.length?{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(q=>({'@type':'Question',name:q.question,acceptedAnswer:{'@type':'Answer',text:q.answer}}))}:null;
 add(path,s.seo_title||s.name+' | Sew Suite',s.meta_description||s.short_description,
   '<nav><a href="/services">Services</a></nav><h1>'+esc(s.name)+'</h1>'+para(s.short_description)+
   '<section>'+para(s.service_intro)+para(s.page_content)+'</section>'+faqBlock(faq),
   faqSchema?[schema,faqSchema]:[schema]);
}
add('/service-areas','North Texas Custom Apparel Service Areas | Sew Suite',
 'Sew Suite serves North Texas businesses, schools and teams with custom embroidery, screen printing and DTF apparel, and ships nationwide.',
 '<h1>Custom Apparel Service Areas</h1>'+para('Sew Suite provides custom embroidery, decorated apparel, and printing for North Texas customers, with shipping options across the United States.')+
 '<section>'+cityRows.map(a=>'<article><h2><a href="/service-areas/'+encodeURIComponent(a.slug)+'">'+esc(a.local_heading||'Custom Apparel in '+a.city+', TX')+'</a></h2>'+para(a.local_intro)+'</article>').join('')+'</section>');
for(const a of cityRows){
 const path='/service-areas/'+a.slug;
 const faq=a.faqs||[];
 const schema={'@context':'https://schema.org','@type':'Service',name:a.local_heading||'Custom Embroidery & Apparel in '+a.city+', TX',
  description:a.meta_description,provider:{'@type':'LocalBusiness',name:'Sew Suite',url:base},areaServed:{'@type':'City',name:a.city+', TX'},url:base+path};
 const faqSchema=faq.length?{'@context':'https://schema.org','@type':'FAQPage',mainEntity:faq.map(q=>({'@type':'Question',name:q.question,acceptedAnswer:{'@type':'Answer',text:q.answer}}))}:null;
 const highlights=(a.local_highlights||[]).map(x=>'<article><h2>'+esc(x.title)+'</h2>'+para(x.body)+'</article>').join('');
 add(path,a.seo_title||'Custom Embroidery & Apparel in '+a.city+', TX | Sew Suite',
  a.meta_description||'Custom embroidery and branded apparel in '+a.city+', TX from Sew Suite.',
  '<nav><a href="/service-areas">Service Areas</a></nav><h1>'+esc(a.local_heading||'Custom Apparel in '+a.city+', TX')+'</h1>'+para(a.hero_subtitle)+
  '<section>'+para(a.local_intro)+para(a.local_service_context)+'</section><section>'+highlights+'</section>'+faqBlock(faq),
  faqSchema?[schema,faqSchema]:[schema]);
}

// The sitemap also publishes home, nine approved portfolio examples, and seven
// standard information/quote pages. Render actual crawlable HTML for those too,
// instead of serving an empty SPA shell to visitors without JavaScript.
const settings=snapshot.BusinessSettings?.[0]||{};
const projects=(snapshot.PortfolioProject||[]).filter(p=>p.is_published===true&&p.public_permission_confirmed===true);
const homeDescription=settings.seo_default_meta_description||'Custom embroidery, screen printing, DTF and corporate apparel for businesses, schools and teams in North Texas.';
add('/','Sew Suite | Custom Embroidery, Screen Printing & Apparel',homeDescription,
 '<h1>Custom Branded Apparel, Built Around Your Logo</h1>'+para(settings.home_hero_description||homeDescription)+
 '<p><a href="/services">Browse services</a> or <a href="/book-service">request a quote</a>.</p>');
add('/our-work','Sew Suite Portfolio | Custom Embroidery & Decorated Apparel',
 'View examples of Sew Suite custom embroidery, caps, corporate apparel, team wear and decorated bags.',
 '<h1>Our Custom Apparel Work</h1><section>'+projects.map(p=>
 '<article><h2><a href="/our-work/'+encodeURIComponent(p.slug)+'">'+esc(p.title)+'</a></h2>'+
 para(p.summary)+'</article>').join('')+'</section>');
for(const p of projects){
 if(!/^\/(?:portfolio-[a-z0-9-]+\.jpg|media\/portfolio\/[A-Za-z0-9_.-]+\.(?:jpg|png))$/.test(p.cover_image_url||''))
  throw Error('unverified_portfolio_asset_'+p.slug);
 const path='/our-work/'+p.slug;
 const schema={'@context':'https://schema.org','@type':'CreativeWork',name:p.title,
  description:p.description||p.summary,url:base+path,
  image:base+p.cover_image_url,creator:{'@type':'Organization',name:'Sew Suite'}};
 add(path,p.seo_title||p.title+' | Sew Suite',
  p.meta_description||p.summary,
  '<nav><a href="/our-work">Portfolio</a></nav><h1>'+esc(p.title)+'</h1>'+
  '<figure><img src="'+esc(p.cover_image_url)+'" alt="'+esc(p.cover_alt_text||p.title)+'" loading="lazy"></figure>'+
  para(p.summary)+para(p.description),[schema]);
}
const support=settings.customer_support_email||'support@sewsuite.com';
const phone=settings.phone||'469-640-8568';
add('/reviews','Sew Suite Reviews | Custom Apparel & Embroidery',
 'Learn about Sew Suite custom apparel and how customer inquiries and reviews are handled.',
 '<h1>Customer Reviews</h1>'+para('Learn more about our custom embroidery, branded apparel and customer service.')+
 '<p><a href="/our-work">Browse completed apparel examples</a>.</p>');
add('/about','About Sew Suite | North Texas Custom Apparel',
 'Learn about Sew Suite custom embroidery, screen printing and branded apparel for businesses, teams and schools.',
 '<h1>About Sew Suite</h1>'+para(settings.home_services_intro||'Sew Suite provides branded apparel, embroidery and printing for businesses, teams, schools and organizations.')+
 '<p><a href="/services">Explore apparel services</a>.</p>');
add('/why-us','Why Choose Sew Suite | Branded Apparel & Embroidery',
 'Explore Sew Suite services for corporate branded apparel, teamwear, caps and custom decorated products.',
 '<h1>Why Sew Suite</h1>'+para('Explore options for custom embroidery, screen printing, hats, corporate apparel and team wear.')+
 '<p><a href="/our-work">View our work</a> and <a href="/book-service">request a project quote</a>.</p>');
add('/faqs','Sew Suite FAQs | Embroidery, Screen Printing & Orders',
 'Find information about custom apparel quotes, artwork, embroidery, printing and project requests.',
 '<h1>Frequently Asked Questions</h1>'+para('Browse our services and project details before requesting a custom apparel quote.')+
 '<p><a href="/services">View services</a> or <a href="/contact">contact Sew Suite</a>.</p>');
add('/contact','Contact Sew Suite | Custom Apparel in North Texas',
 'Contact Sew Suite for embroidery, screen printing, corporate apparel and custom teamwear in North Texas.',
 '<h1>Contact Sew Suite</h1><p>Email <a href="mailto:'+esc(support)+'">'+esc(support)+'</a> or call <a href="tel:'+esc(phone.replace(/[^0-9]/g,''))+'">'+esc(phone)+'</a>.</p>'+
 '<p><a href="/book-service">Request a project quote</a>.</p>');
add('/book-service','Request a Custom Apparel Quote | Sew Suite',
 'Request a quote for custom embroidery, screen printing, apparel, caps and artwork projects at Sew Suite.',
 '<h1>Request a Custom Apparel Quote</h1>'+para('Tell us about your project, quantity, artwork and contact information. Our team reviews inquiries before confirming price or production dates.')+
 '<p>For assistance, email <a href="mailto:'+esc(support)+'">'+esc(support)+'</a>.</p>');
add('/privacy-policy','Privacy Policy | Sew Suite',
 'Read the Sew Suite privacy policy and information about contacting the business.',
 '<h1>Privacy Policy</h1>'+para('Read the privacy information displayed on this page and contact Sew Suite if you have questions about a submitted inquiry.')+
 '<p>Email <a href="mailto:'+esc(support)+'">'+esc(support)+'</a> for privacy-related questions.</p>');
if(projects.length!==9)throw Error('published_portfolio_count_changed_without_review');
if(serviceRows.length!==9||cityRows.length!==20||routes.length!==49)throw Error('catalog_parity_failure_'+JSON.stringify({services:serviceRows.length,cities:cityRows.length,routes:routes.length}));
function render(route){
 const url=base+route.path;
 const replace=(html,search,replacement)=>{if(!search.test(html))throw Error('missing_meta_marker_'+route.path);return html.replace(search,replacement)};
 let html=template;
 html=replace(html,/<title>[^<]*<\/title>/,'<title>'+esc(route.title)+'</title>');
 html=replace(html,/<meta name="description"[^>]*>/,'<meta name="description" content="'+esc(route.description)+'" />');
 html=replace(html,/<link rel="canonical"[^>]*>/,'<link rel="canonical" href="'+esc(url)+'" />');
 for(const [property,value] of [['og:title',route.title],['og:description',route.description],['og:url',url]]){
  const reg=new RegExp('<meta property="'+property+'"[^>]*>');
  html=replace(html,reg,'<meta property="'+property+'" content="'+esc(value)+'" />');
 }
 for(const [name,value] of [['twitter:title',route.title],['twitter:description',route.description]]){
  const reg=new RegExp('<meta name="'+name+'"[^>]*>');
  html=replace(html,reg,'<meta name="'+name+'" content="'+esc(value)+'" />');
 }
 // Keep the preview's existing noindex policy; production indexing requires a separate owner-approved release.
 const schemas=[business,...route.extraSchemas];
 html=html.replace('</head>','<script type="application/ld+json">'+jsonld(schemas)+'</script>\n</head>');
 const style='style="max-width:1000px;margin:3rem auto;padding:1.25rem;font:16px/1.6 system-ui,sans-serif;color:#263238"';
 const fallback='<main id="sew-suite-seo-fallback" '+style+'><article>'+route.body+'</article><p><a href="/book-service">Request a quote</a> or call <a href="tel:4696408568">469-640-8568</a>.</p></main>';
 html=replace(html,/<div id="root"><\/div>/,'<div id="root">'+fallback+'</div>');
 const dst=join('dist',route.path.slice(1),'index.html');
 mkdirSync(dirname(dst),{recursive:true});
 writeFileSync(dst,html,'utf8');
 if(statSync(dst).size<2000)throw Error('static_page_too_small');
}
routes.forEach(render);
console.log('RRS_VITE_STATIC_SEO_ROUTES_OK '+JSON.stringify({servicePages:serviceRows.length,cityPages:cityRows.length,portfolioPages:projects.length,htmlRoutes:routes.length,indexing:'intentionally_disabled_on_preview'}));
