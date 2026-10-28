"use client";
import {useState} from "react";
import {ImagePlus,Upload,Check} from "lucide-react";
type Asset={id:string;url:string;alt?:string;filename?:string;originalName?:string};
export function MediaPicker({onPick}:{onPick:(url:string)=>void}){
 const [open,setOpen]=useState(false),[assets,setAssets]=useState<Asset[]>([]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function load(){
  setBusy(true);setNotice("");
  try{const res=await fetch("/api/media",{cache:"no-store"});if(!res.ok)throw Error("Media library could not be loaded");const data=await res.json();setAssets(Array.isArray(data)?data:[])}
  catch(e){setNotice(e instanceof Error?e.message:"Media unavailable")}finally{setBusy(false)}
 }
 async function upload(file:File){
  setBusy(true);setNotice("");
  try{const form=new FormData();form.set("file",file);const res=await fetch("/api/media",{method:"POST",body:form});const data=await res.json();if(!res.ok)throw Error(data.error||"Upload failed");onPick(data.url);setOpen(false)}
  catch(e){setNotice(e instanceof Error?e.message:"Upload failed")}finally{setBusy(false)}
 }
 return <div className="mt-2">
  <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700" onClick={()=>{setOpen(!open);if(!open)void load()}}><ImagePlus size={15}/> {open?"Close media":"Choose from media library"}</button>
  {open&&<div className="mt-2 rounded-xl border border-slate-200 p-3">
   <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-900 p-3 text-xs font-bold text-white"><Upload size={15}/> Upload image<input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={e=>{const file=e.target.files?.[0];if(file)void upload(file)}}/></label>
   {busy&&<p className="mt-3 text-xs text-slate-500">Loading media…</p>}
   {notice&&<p role="alert" className="mt-3 text-xs text-red-700">{notice}</p>}
   <div className="mt-3 grid max-h-52 grid-cols-3 gap-2 overflow-y-auto">{assets.map(asset=><button key={asset.id} type="button" title={asset.originalName||asset.filename||"Choose image"} onClick={()=>{onPick(asset.url);setOpen(false)}} className="relative aspect-square overflow-hidden rounded-md border border-slate-200"><img src={asset.url} alt={asset.alt||asset.filename||""} className="h-full w-full object-cover"/><Check size={13} className="absolute right-1 top-1 rounded-full bg-white p-0.5 text-indigo-700"/></button>)}</div>
   {!busy&&assets.length===0&&<p className="mt-3 text-xs text-slate-500">No images yet. Upload one to get started.</p>}
  </div>}
 </div>;
}
