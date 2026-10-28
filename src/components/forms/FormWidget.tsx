"use client";
import {useEffect,useState} from "react";
import type {FormField} from "@/lib/forms";
type PublicForm={name:string;fields:FormField[];buttonLabel:string};
export function FormWidget({slug,preview=false}:{slug:string;preview?:boolean}){
 const [form,setForm]=useState<PublicForm|null>(null);
 const [loading,setLoading]=useState(!preview);
 const [status,setStatus]=useState("");
 const [error,setError]=useState("");
 const [sending,setSending]=useState(false);
 useEffect(()=>{
  if(preview||!slug)return;
  const controller=new AbortController();
  setLoading(true);
  fetch("/api/forms/public/"+encodeURIComponent(slug),{cache:"no-store",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("Form is not published");return r.json()})
   .then(data=>{setForm(data);setError("");})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Unable to load form");})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return ()=>controller.abort();
 },[slug,preview]);
 if(preview)return <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-indigo-300 bg-indigo-50 p-10 text-center">
  <strong className="text-lg text-indigo-900">Form widget</strong><p className="mt-2 text-sm text-indigo-700">Connected form: {slug||"Choose a form slug in the inspector"}</p>
  <p className="mt-2 text-xs text-indigo-600">The real form and submission processing appear on the published page.</p></div>;
 if(!slug)return <p className="mx-auto max-w-3xl rounded-lg bg-amber-50 p-6 text-amber-800">Choose a form slug in the page editor.</p>;
 if(loading)return <p className="mx-auto max-w-3xl p-6" role="status">Loading form…</p>;
 if(!form)return <p className="mx-auto max-w-3xl rounded-lg bg-amber-50 p-6" role="alert">{error||"Form unavailable"}</p>;
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(!form)return;
  const formElement=event.currentTarget;
  setSending(true);setError("");setStatus("");
  const native=new FormData(event.currentTarget);
  const values:Record<string,string>={};
  for(const field of form.fields){
   values[field.id]=field.type==="checkbox"?(native.has(field.id)?"true":"") :String(native.get(field.id)||"");
  }
  const website=String(native.get("website")||"");
  try{
   const response=await fetch("/api/forms/public/"+encodeURIComponent(slug),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({website,values})});
   const result=await response.json();
   if(!response.ok)throw Error(result.error||"Unable to submit");
   setStatus(result.message||"Thank you. Your message has been received.");
   formElement.reset();
  }catch(e){setError(e instanceof Error?e.message:"Unable to submit form")}
  finally{setSending(false)}
 }
 return <form onSubmit={submit} className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-current/10 bg-[var(--site-bg,#fff)] p-6 md:p-10" aria-label={form.name}>
  <h2 className="text-2xl font-bold">{form.name}</h2>
  <div className="absolute -left-[10000px]" aria-hidden="true"><label>Website<input tabIndex={-1} name="website" autoComplete="off"/></label></div>
  {form.fields.map(f=><div key={f.id}>
    {f.type==="checkbox"?<label className="flex items-center gap-3 text-sm font-medium"><input name={f.id} type="checkbox" required={f.required}/>{f.label}{f.required?" *":""}</label>:
    <label className="block text-sm font-semibold">{f.label}{f.required?" *":""}
     {f.type==="textarea"?<textarea name={f.id} rows={4} required={f.required} maxLength={3000} placeholder={f.placeholder} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900"/>:
     f.type==="select"?<select name={f.id} required={f.required} defaultValue="" className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900"><option value="">Select an option</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>:
     <input name={f.id} type={f.type} required={f.required} maxLength={f.type==="email"?254:3000} placeholder={f.placeholder} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900"/>}</label>}
   </div>)}
  <button type="submit" disabled={sending} className="rounded-lg bg-[var(--site-primary,#4657e8)] px-6 py-3 font-semibold text-white disabled:opacity-50">{sending?"Sending…":form.buttonLabel}</button>
  {status&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-800">{status}</p>}
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
 </form>;
}
