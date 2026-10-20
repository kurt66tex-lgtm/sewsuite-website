"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import snapshot from "@/src/data/prelaunch-public-snapshot.json";

interface TurnstileApi {
 render: (selector:string, config:{sitekey:string,callback:(value:string)=>void,
   "expired-callback":()=>void,"error-callback":()=>void})=>string;
 reset: (id?:string)=>void;
 remove: (id:string)=>void;
}
declare global {interface Window {turnstile?:TurnstileApi}}
const services=snapshot.ServiceType.filter(service=>service.active&&service.publicly_advertised)
 .slice().sort((a,b)=>a.display_order-b.display_order);
const siteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||"";

export default function ContactForm(){
 const [available,setAvailable]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const [token,setToken]=useState("");
 const [pending,setPending]=useState(false);
 const [confirmed,setConfirmed]=useState(false);
 const [error,setError]=useState("");
 const requestKey=useRef("");
 useEffect(()=>{
   let mounted=true;
   fetch("/api/production-intake",{cache:"no-store"}).then(r=>r.json())
     .then(d=>{if(mounted)setAvailable(d.available===true);}).catch(()=>{});
   return()=>{mounted=false};
 },[]);
 useEffect(()=>{
   if(!available||!siteKey)return;
   let mounted=true,widgetId="";
   const render=()=>{
     if(!mounted||!window.turnstile||widgetId)return;
     widgetId=window.turnstile.render("#sew-quote-turnstile",{sitekey:siteKey,
       callback:v=>{if(mounted)setToken(v)},
       "expired-callback":()=>{if(mounted)setToken("")},
       "error-callback":()=>{if(mounted)setToken("")}});
     if(mounted)setLoaded(true);
   };
   if(window.turnstile)render();
   else{
     const script=document.createElement("script");
     script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
     script.async=true;
     script.onload=render;
     document.head.appendChild(script);
   }
   return()=>{mounted=false;if(widgetId&&window.turnstile)window.turnstile.remove(widgetId);};
 },[available]);
 async function submit(event:FormEvent<HTMLFormElement>){
   event.preventDefault();
   if(pending||confirmed)return;
   if(!available||!siteKey||!token){setError("Please complete the verification before submitting.");return;}
   const form=new FormData(event.currentTarget);
   if(form.get("consent_to_contact")!=="on"){setError("Please confirm Sew Suite may contact you about this inquiry.");return;}
   if(!requestKey.current)requestKey.current="website_"+crypto.randomUUID().replaceAll("-","");
   const lead={
     first_name:String(form.get("first_name")||"").trim(),last_name:String(form.get("last_name")||"").trim(),
     email:String(form.get("email")||"").trim(),phone:String(form.get("phone")||"").trim(),
     service_type:String(form.get("service_type")||"").trim(),
     problem_description:String(form.get("problem_description")||"").trim(),
     request_key:requestKey.current,consent_to_contact:true,turnstile_token:token,
     website_company:String(form.get("website_company")||""),
     intake_answers:{
       company:String(form.get("business")||"").slice(0,300),
       approximate_quantity:String(form.get("quantity")||"").slice(0,300),
       desired_completion_date:String(form.get("desired_completion_date")||"").slice(0,300),
       artwork_status:String(form.get("artwork_status")||"").slice(0,300),
     }
   };
   setError("");setPending(true);
   try{
     const response=await fetch("/api/production-intake",{
       method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(lead)
     });
     const result=await response.json().catch(()=>({}));
     if(response.status!==202||result.success!==true||!result.lead_id)throw Error("lead_not_confirmed");
     setConfirmed(true);
   }catch{
     setError("We could not confirm that your request was saved. Please email support@sewsuite.com or call 469-640-8568. Do not assume your request was received.");
     setToken("");
     if(window.turnstile)window.turnstile.reset();
   }finally{setPending(false)}
 }
 if(confirmed)return (
  <div className="rounded-xl border border-sew-green bg-sew-cream p-8" role="status">
   <h3 className="font-semibold text-sew-green text-xl mb-3">Quote Request Received</h3>
   <p className="text-gray-700">Your request was saved. Sew Suite will review the details and follow up. This is not an order confirmation or a promised delivery date.</p>
  </div>);
 if(!available||!siteKey)return (
  <div className="rounded-xl border border-gray-300 bg-sew-cream p-8" role="status">
   <h3 className="font-semibold text-sew-slate text-xl mb-3">Request a Quote</h3>
   <p className="text-gray-700">The independent online request system is being prepared. For now, email <a className="underline text-sew-green" href="mailto:support@sewsuite.com">support@sewsuite.com</a> or call <a className="underline text-sew-green" href="tel:4696408568">469-640-8568</a>. No online information is submitted from this preview.</p>
  </div>);
 return <form onSubmit={submit} className="space-y-5">
   <div className="grid sm:grid-cols-2 gap-5">
     <label className="block text-sm font-medium text-sew-slate">First name *
       <input name="first_name" required maxLength={100} autoComplete="given-name" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
     </label>
     <label className="block text-sm font-medium text-sew-slate">Last name *
       <input name="last_name" required maxLength={100} autoComplete="family-name" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
     </label>
   </div>
   <div className="grid sm:grid-cols-2 gap-5">
     <label className="block text-sm font-medium text-sew-slate">Email *
       <input name="email" type="email" required maxLength={240} autoComplete="email" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
     </label>
     <label className="block text-sm font-medium text-sew-slate">Phone *
       <input name="phone" type="tel" required maxLength={100} autoComplete="tel" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
     </label>
   </div>
   <label className="block text-sm font-medium text-sew-slate">Company or organization
     <input name="business" maxLength={300} className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
   </label>
   <div className="grid sm:grid-cols-2 gap-5">
     <label className="block text-sm font-medium text-sew-slate">Project type *
       <select name="service_type" required defaultValue="" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md">
         <option value="" disabled>Select a service</option>
         {services.map(s=><option value={s.name} key={s.slug}>{s.name}</option>)}
       </select>
     </label>
     <label className="block text-sm font-medium text-sew-slate">Approximate quantity
       <input name="quantity" maxLength={300} className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
     </label>
   </div>
   <div className="grid sm:grid-cols-2 gap-5">
     <label className="block text-sm font-medium text-sew-slate">Desired completion date
       <input name="desired_completion_date" type="date" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" />
     </label>
     <label className="block text-sm font-medium text-sew-slate">Artwork status
       <select name="artwork_status" className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md">
         <option value="">Select one</option><option>I have artwork</option><option>Need artwork assistance</option><option>Unsure</option>
       </select>
     </label>
   </div>
   <label className="block text-sm font-medium text-sew-slate">Project details *
     <textarea name="problem_description" required rows={5} maxLength={4000} className="block w-full mt-2 px-4 py-3 border border-gray-300 rounded-md" placeholder="Products, logo or design details, quantities, and timing" />
   </label>
   <div className="absolute -left-[10000px]" aria-hidden="true"><label>Website company<input name="website_company" tabIndex={-1} autoComplete="off"/></label></div>
   <label className="flex items-start gap-3 text-sm text-gray-700">
     <input name="consent_to_contact" type="checkbox" required className="mt-1"/>
     <span>I agree that Sew Suite may contact me about this quote request. This is not consent to marketing messages.</span>
   </label>
   <div id="sew-quote-turnstile" aria-label="Spam protection verification" />
   {error&&<p role="alert" className="text-red-700 text-sm">{error}</p>}
   <button type="submit" disabled={pending||!loaded||!token} className="bg-sew-green text-white px-8 py-3 rounded-md font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
     {pending?"Submitting...":"Submit Quote Request"}
   </button>
 </form>;
}
