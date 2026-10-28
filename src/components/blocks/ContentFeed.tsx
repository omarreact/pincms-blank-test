"use client";
import {useEffect,useState} from "react";
import {safeHref,safeImage} from "@/lib/safe-content";
type Item={title:string;slug:string;excerpt:string|null;ogImage:string|null;url:string};
export function ContentFeed({kind="posts",limit=9,query="",carousel=false}:{kind?:"pages"|"posts";limit?:number;query?:string;carousel?:boolean}){
 const [rows,setRows]=useState<Item[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();setBusy(true);
  fetch("/api/public/content?kind="+kind+"&limit="+limit+"&q="+encodeURIComponent(query),{signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error("Content feed unavailable");return r.json()})
   .then(v=>{if(!controller.signal.aborted)setRows(Array.isArray(v)?v:[])})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:"Could not load content")})
   .finally(()=>{if(!controller.signal.aborted)setBusy(false)});
  return ()=>controller.abort();
 },[kind,limit,query]);
 if(busy)return <p role="status" className="p-7 text-sm opacity-60">Loading published {kind}…</p>;
 if(error)return <p role="alert" className="p-7 text-sm text-red-600">{error}</p>;
 if(!rows.length)return <p className="p-7 text-sm opacity-60">No published {kind} found.</p>;
 return <div className={carousel?"flex snap-x gap-4 overflow-x-auto pb-4":"grid gap-5 md:grid-cols-2 xl:grid-cols-3"}>{rows.map(item=><a key={item.url} href={safeHref(item.url)} className={"block overflow-hidden rounded-xl border border-current/15 bg-white transition hover:shadow-lg "+(carousel?"w-[260px] flex-none snap-start":"")}>{safeImage(item.ogImage)?<img src={safeImage(item.ogImage)} alt="" loading="lazy" className="aspect-video w-full object-cover"/>:<div className="grid aspect-video place-items-center bg-slate-100 text-slate-400">PinCMS</div>}<div className="p-5"><h3 className="text-lg font-bold">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm opacity-70">{item.excerpt}</p></div></a>)}</div>;
}
export function ContentSearch(){
 const [input,setInput]=useState(""),[query,setQuery]=useState("");
 return <section className="mx-auto max-w-6xl px-6 py-8"><form onSubmit={e=>{e.preventDefault();setQuery(input)}} className="flex gap-2"><input aria-label="Search published content" placeholder="Search pages and posts" className="min-w-0 flex-1 rounded-lg border p-3" value={input} onChange={e=>setInput(e.target.value)}/><button className="rounded-lg bg-[var(--site-primary)] px-5 text-white">Search</button></form>{query&&<div className="mt-5"><ContentFeed query={query} limit={12}/><div className="mt-5"><ContentFeed query={query} kind="pages" limit={12}/></div></div>}</section>;
}
