"use client";
import {useEffect,useState} from "react";
import {starterForm} from "@/lib/forms";
import type {FormDefinition,FormField} from "@/lib/forms";

type FormRecord=FormDefinition&{id:string;submissions:number};
type Submission={id:string;createdAt:string;values:Record<string,string>};
const input="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900";
export function FormStudio(){
 const [forms,setForms]=useState<FormRecord[]>([]);
 const [id,setId]=useState<string|null>(null);
 const [form,setForm]=useState<FormDefinition>(structuredClone(starterForm));
 const [items,setItems]=useState<Submission[]>([]);
 const [inbox,setInbox]=useState(false);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [loaded,setLoaded]=useState(false);
 async function reload(){
  const res=await fetch("/api/forms",{cache:"no-store"}),json=await res.json();
  if(!res.ok)throw Error(json.error||"Unable to load forms");
  setForms(json);setLoaded(true);
 }
 useEffect(()=>{reload().catch(e=>setNotice(e instanceof Error?e.message:"Could not load forms"))},[]);
 function select(record:FormRecord){setId(record.id);setForm({name:record.name,slug:record.slug,fields:record.fields,settings:record.settings});setInbox(false);setNotice("")}
 function begin(){setId(null);setForm(structuredClone(starterForm));setInbox(false);setNotice("")}
 function updateField(index:number,patch:Partial<FormField>){setForm(old=>({...old,fields:old.fields.map((f,i)=>i===index?{...f,...patch}:f)}))}
 function addField(){
  const id="field_"+crypto.randomUUID().replaceAll("-","").slice(0,10);
  setForm(old=>({...old,fields:[...old.fields,{id,label:"New field",type:"text",required:false,placeholder:"",options:[]}]}));
 }
 function reorder(index:number,direction:number){
  const other=index+direction;
  if(other<0||other>=form.fields.length)return;
  setForm(old=>{const fields=[...old.fields];[fields[index],fields[other]]=[fields[other],fields[index]];return {...old,fields}});
 }
 async function save(){
  setBusy(true);setNotice("");
  try{
   const response=await fetch(id?"/api/forms/"+id:"/api/forms",{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||"Could not save. Check labels, unique field IDs and dropdown options.");
   await reload();if(!id)setId(data.id);
   setNotice("Form saved. Add a Form widget to any page with slug: "+form.slug);
  }catch(e){setNotice(e instanceof Error?e.message:"Save failed")}
  finally{setBusy(false)}
 }
 async function showInbox(formId:string){
  setBusy(true);setNotice("");
  try{
   const r=await fetch("/api/forms/"+formId+"/submissions",{cache:"no-store"});const data=await r.json();
   if(!r.ok)throw Error(data.error||"Cannot load inbox");
   setItems(data.submissions);setInbox(true);
  }catch(e){setNotice(e instanceof Error?e.message:"Cannot load inbox")}
  finally{setBusy(false)}
 }
 return <div className="space-y-5">
  <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-black">Forms & submissions</h1><p className="mt-2 text-sm text-slate-500">Build a form, publish it inside a page and review messages securely.</p></div><button type="button" onClick={begin} className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white">+ New form</button></div>
  {notice&&<p role="status" className="rounded-lg border bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{notice}</p>}
  <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
   <aside className="space-y-2 rounded-xl border bg-white p-4"><h2 className="font-bold">Saved forms</h2>
    {!loaded?<p className="text-sm">Loading…</p>:forms.length===0?<p className="text-sm text-slate-500">No forms yet. Create one and save it.</p>:
    forms.map(f=><button key={f.id} onClick={()=>select(f)} className={"w-full rounded-lg border px-3 py-3 text-left "+(f.id===id?"border-indigo-500 bg-indigo-50":"hover:bg-slate-50")}><strong className="block text-sm">{f.name}</strong><small className="text-slate-500">{f.slug} · {f.submissions} submissions</small></button>)}
   </aside>
   <div className="space-y-5 min-w-0">
    {inbox&&id?<section className="space-y-4 rounded-xl border bg-white p-6">
     <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Recent submissions</h2><button onClick={()=>setInbox(false)} className="rounded-lg border px-4 py-2 text-sm">Back to editor</button></div>
     <p className="text-sm text-slate-500">Latest 100 messages. Only authorized editors and administrators can view submissions.</p>
     {items.length===0?<p className="p-6 text-center text-slate-500">No messages received yet.</p>:
      items.map(item=><article key={item.id} className="rounded-xl border p-4"><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time><dl className="mt-3 grid gap-3 sm:grid-cols-2">{Object.entries(item.values).map(([key,value])=><div key={key}><dt className="text-xs font-semibold text-slate-500">{form.fields.find(f=>f.id===key)?.label||key}</dt><dd className="break-words whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl></article>)}
    </section>:
    <section className="space-y-5 rounded-xl border bg-white p-6">
     <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-bold">{id?"Edit form":"Create form"}</h2><div className="flex gap-2">{id&&<button onClick={()=>showInbox(id)} className="rounded-lg border px-4 py-2 text-sm" disabled={busy}>View submissions</button>}<button onClick={save} disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white">{busy?"Saving…":"Save form"}</button></div></div>
     <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Form name<input className={input} value={form.name} maxLength={100} onChange={e=>setForm(v=>({...v,name:e.target.value}))}/></label><label className="text-sm font-semibold">Unique slug<input className={input} value={form.slug} maxLength={100} onChange={e=>setForm(v=>({...v,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")}))}/></label></div>
     <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Submit button text<input className={input} value={form.settings.buttonLabel} onChange={e=>setForm(v=>({...v,settings:{...v.settings,buttonLabel:e.target.value}}))}/></label><label className="text-sm font-semibold">Success message<input className={input} value={form.settings.successMessage} onChange={e=>setForm(v=>({...v,settings:{...v.settings,successMessage:e.target.value}}))}/></label></div>
     <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={form.settings.enabled} onChange={e=>setForm(v=>({...v,settings:{...v.settings,enabled:e.target.checked}}))}/>Accept new submissions</label>
     <div className="space-y-4"><div className="flex justify-between"><h3 className="font-bold">Fields</h3><button className="rounded-lg border px-4 py-2 text-sm font-semibold text-indigo-600" onClick={addField}>+ Add field</button></div>
      {form.fields.map((field,i)=><div key={field.id+"-"+i} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
       <div className="flex flex-wrap items-center justify-between"><strong className="text-sm">Field {i+1}</strong><div className="flex gap-3 text-xs"><button disabled={i===0} onClick={()=>reorder(i,-1)}>↑</button><button disabled={i===form.fields.length-1} onClick={()=>reorder(i,1)}>↓</button><button disabled={form.fields.length<=1} onClick={()=>setForm(v=>({...v,fields:v.fields.filter((_,j)=>j!==i)}))} className="text-red-600">Remove</button></div></div>
       <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Label<input className={input} value={field.label} onChange={e=>updateField(i,{label:e.target.value})}/></label><label className="text-xs font-semibold">Field ID<input className={input} value={field.id} onChange={e=>updateField(i,{id:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,"")})}/></label>
        <label className="text-xs font-semibold">Type<select className={input} value={field.type} onChange={e=>updateField(i,{type:e.target.value as FormField["type"],options:e.target.value==="select"?["First option"]:field.options})}>{["text","email","tel","textarea","select","checkbox"].map(type=><option value={type} key={type}>{type}</option>)}</select></label>
        <label className="text-xs font-semibold">Placeholder<input className={input} value={field.placeholder} onChange={e=>updateField(i,{placeholder:e.target.value})}/></label></div>
       {field.type==="select"&&<label className="block text-xs font-semibold">Dropdown options (one per line)<textarea className={input} rows={3} value={field.options.join("\n")} onChange={e=>updateField(i,{options:e.target.value.split("\n").map(x=>x.trim()).filter(Boolean)})}/></label>}
       <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={field.required} onChange={e=>updateField(i,{required:e.target.checked})}/>Required field</label>
      </div>)}
     </div>
     <div className="rounded-lg bg-slate-100 p-4 text-sm">Add the <strong>Form</strong> widget to a page and enter <code className="font-mono">{form.slug}</code> as its form slug. Save the page to publish it.</div>
    </section>}
   </div>
  </div>
 </div>;
}
