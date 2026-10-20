import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";
import SchemaOrg from "@/components/ui/SchemaOrg";
import { localBusinessSchema } from "@/lib/schema";

const services=snapshot.ServiceType.filter(s=>s.active&&s.publicly_advertised);
const aliases:Record<string,string>={
  "branded-apparel":"corporate-apparel",
  "hats-and-caps":"custom-hats-caps",
  "corporate-gifts":"specialty-promotional-items",
  "team-uniforms":"team-school-apparel",
};
function findService(slug:string){return services.find(s=>s.slug===slug);}
export function generateStaticParams(){return services.map(s=>({slug:s.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const service=findService(slug);
  if(!service)return {robots:{index:false,follow:false}};
  const title=service.seo_title||`${service.name} | Sew Suite`;
  const description=service.meta_description||service.short_description;
  const url=`https://sewsuite.com/services/${slug}`;
  return {title,description,alternates:{canonical:url},openGraph:{title,description,url,type:"website"}};
}
export default async function ServicePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  if(aliases[slug])permanentRedirect(`/services/${aliases[slug]}`);
  const service=findService(slug);
  if(!service)notFound();
  const faq=Array.isArray(service.faqs)?service.faqs:[];
  const serviceSchema={"@context":"https://schema.org","@type":"Service",
    name:service.name,description:service.short_description,
    provider:{"@type":"LocalBusiness",name:"Sew Suite",url:"https://sewsuite.com"},
    areaServed:"North Texas",
    url:`https://sewsuite.com/services/${slug}`};
  const faqSchema=faq.length?{"@context":"https://schema.org","@type":"FAQPage",
    mainEntity:faq.map(f=>({"@type":"Question",name:f.question,acceptedAnswer:{"@type":"Answer",text:f.answer}}))}:null;
  return <>
    <SchemaOrg schema={faqSchema?[localBusinessSchema(),serviceSchema,faqSchema]:[localBusinessSchema(),serviceSchema]} />
    <div className="bg-sew-green pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="text-sew-cream/70 text-sm mb-5"><Link href="/">Home</Link> / <Link href="/services">Services</Link> / {service.name}</nav>
        <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">{service.name}</h1>
        <p className="text-sew-cream/80 text-lg max-w-3xl">{service.short_description}</p>
      </div>
    </div>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <section className="space-y-6 text-gray-700 leading-relaxed">
        <p className="text-lg">{service.service_intro}</p>
        {service.page_content&&<p>{service.page_content}</p>}
      </section>
      {faq.length>0&&<section className="mt-14">
        <h2 className="text-2xl font-semibold text-sew-slate mb-6">Frequently Asked Questions About {service.name}</h2>
        <div className="space-y-4">{faq.map((item,i)=><article key={i} className="border-b border-gray-200 pb-5">
          <h3 className="font-semibold text-sew-slate mb-2">{item.question}</h3>
          <p className="text-gray-700">{item.answer}</p>
        </article>)}</div>
      </section>}
      <section className="mt-14 p-9 bg-sew-cream rounded-xl text-center">
        <h2 className="text-2xl font-semibold text-sew-slate mb-3">Discuss Your {service.name} Project</h2>
        <p className="text-gray-700 mb-6">Send the artwork, quantity, product type and timeline. We'll review the details and follow up about your quote.</p>
        <Link href="/contact" className="inline-flex px-7 py-3 bg-sew-green text-white font-semibold rounded-lg hover:opacity-90">Request a Quote</Link>
      </section>
    </main>
  </>;
}
