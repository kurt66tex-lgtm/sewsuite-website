import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";
import SchemaOrg from "@/components/ui/SchemaOrg";
import { localBusinessSchema } from "@/lib/schema";

const areas = snapshot.ServiceArea.filter(area => area.active && area.indexable);
function findArea(slug:string){return areas.find(area=>area.slug===slug);}
export function generateStaticParams(){return areas.map(area=>({slug:area.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params;
  const area=findArea(slug);
  if(!area)return {robots:{index:false,follow:false}};
  const title=area.seo_title||`Custom Embroidery & Branded Apparel in ${area.city}, TX | Sew Suite`;
  const description=area.meta_description||`Custom embroidery, screen printing and branded apparel for ${area.city}, Texas. Request a Sew Suite quote.`;
  const url=`https://sewsuite.com/service-areas/${slug}`;
  return {title,description,alternates:{canonical:url},openGraph:{title,description,url,type:"website"}};
}
export default async function CityServiceAreaPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const area=findArea(slug);
  if(!area)notFound();
  const faq=Array.isArray(area.faqs)?area.faqs:[];
  const citySchema={
    "@context":"https://schema.org","@type":"Service",
    name:`Custom Embroidery & Branded Apparel in ${area.city}, TX`,
    description:area.meta_description,
    areaServed:{"@type":"City",name:area.city,address:{"@type":"PostalAddress",addressRegion:"TX",addressCountry:"US"}},
    provider:{"@type":"LocalBusiness",name:"Sew Suite",url:"https://sewsuite.com"},
    url:`https://sewsuite.com/service-areas/${slug}`,
  };
  const faqSchema=faq.length?{"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map(f=>({"@type":"Question",name:f.question,acceptedAnswer:{"@type":"Answer",text:f.answer}}))}:null;
  return (
    <>
      <SchemaOrg schema={faqSchema?[localBusinessSchema(),citySchema,faqSchema]:[localBusinessSchema(),citySchema]} />
      <div className="bg-sew-green pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sew-cream/70 text-sm mb-5">
            <Link href="/">Home</Link> / <Link href="/service-areas">Service Areas</Link> / {area.city}
          </nav>
          <h1 className="text-4xl sm:text-5xl font-semibold text-sew-cream mb-5">{area.local_heading||`Custom Embroidery & Apparel in ${area.city}, TX`}</h1>
          <p className="text-sew-cream/80 text-lg max-w-3xl">{area.hero_subtitle}</p>
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="space-y-6">
          <p className="text-lg leading-relaxed text-gray-700">{area.local_intro}</p>
          <p className="leading-relaxed text-gray-700">{area.local_service_context}</p>
        </div>
        <section className="mt-12 grid md:grid-cols-2 gap-6" aria-label={`${area.city} project information`}>
          {(Array.isArray(area.local_highlights)?area.local_highlights:[]).map((item,i)=>(
            <article key={i} className="border border-gray-200 bg-white rounded-xl p-6">
              <h2 className="font-semibold text-sew-slate text-lg mb-3">{item.title}</h2>
              <p className="text-gray-600 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </section>
        {faq.length>0&&<section className="mt-14">
          <h2 className="text-2xl font-semibold text-sew-slate mb-6">Frequently Asked Questions in {area.city}</h2>
          <div className="space-y-4">{faq.map((item,i)=>(
            <article className="border-b border-gray-200 pb-5" key={i}>
              <h3 className="font-semibold text-sew-slate mb-2">{item.question}</h3>
              <p className="text-gray-700">{item.answer}</p>
            </article>
          ))}</div>
        </section>}
        <section className="mt-14 rounded-xl bg-sew-cream p-8 text-center">
          <h2 className="text-2xl font-semibold text-sew-slate mb-3">Request Custom Apparel in {area.city}</h2>
          <p className="text-gray-700 mb-6">Tell us about your products, quantities, artwork and target date. Our team will review the project details before quoting.</p>
          <Link href="/contact" className="inline-flex px-7 py-3 bg-sew-green text-white font-semibold rounded-lg hover:opacity-90">Request a Quote</Link>
        </section>
      </main>
    </>
  );
}
