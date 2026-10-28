"use client";
import {useEffect,useId,useState} from "react";
import {safeHref,safeImage,plainText} from "@/lib/safe-content";
type Item=Record<string,unknown>;
function str(value:unknown){return typeof value==="string"?value:""}
export function TabsWidget({items}:{items:Item[]}){
 const [active,setActive]=useState(0);
 const uid=useId().replaceAll(":","");
 if(!items.length)return <p className="p-6">Add a tab in the widget inspector.</p>;
 const index=Math.min(active,items.length-1);
 function keydown(e:React.KeyboardEvent<HTMLButtonElement>,n:number){
  let next:number|null=null;
  if(e.key==="ArrowRight")next=(n+1)%items.length;
  if(e.key==="ArrowLeft")next=(n+items.length-1)%items.length;
  if(e.key==="Home")next=0;
  if(e.key==="End")next=items.length-1;
  if(next!==null){e.preventDefault();setActive(next);const buttons=e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');buttons?.[next]?.focus()}
 }
 return <div className="overflow-hidden rounded-xl border border-current/15">
  <div role="tablist" aria-label="Content tabs" className="flex flex-wrap gap-1 border-b border-current/15 p-3">{items.map((item,n)=><button key={n} role="tab" id={"tab-"+uid+"-"+n} aria-selected={index===n} aria-controls={"tabpanel-"+uid+"-"+n} tabIndex={index===n?0:-1} onClick={()=>setActive(n)} onKeyDown={e=>keydown(e,n)} className={"rounded-lg px-5 py-3 text-sm font-semibold "+(index===n?"bg-[var(--site-primary)] text-white":"bg-[var(--site-muted)]")} >{str(item.title)||"Tab "+(n+1)}</button>)}</div>
  <div role="tabpanel" id={"tabpanel-"+uid+"-"+index} aria-labelledby={"tab-"+uid+"-"+index} tabIndex={0} className="min-h-28 p-6 leading-relaxed whitespace-pre-line">{plainText(items[index]?.content)}</div>
 </div>;
}
export function CountdownWidget({target,label}:{target:string;label:string}){
 const [seconds,setSeconds]=useState<number|null>(null);
 useEffect(()=>{
  const date=Date.parse(target);
  if(!Number.isFinite(date)){setSeconds(-1);return}
  const update=()=>setSeconds(Math.max(0,Math.floor((date-Date.now())/1000)));
  update();const timer=setInterval(update,1000);
  return ()=>clearInterval(timer);
 },[target]);
 if(seconds===null)return <p role="status">Loading countdown…</p>;
 if(seconds<0)return <p className="text-sm text-red-700">Configure a valid countdown date.</p>;
 const pieces=[Math.floor(seconds/86400),Math.floor(seconds%86400/3600),Math.floor(seconds%3600/60),seconds%60];
 return <div className="text-center"><h3 className="mb-5 text-2xl font-bold">{label}</h3><div role="timer" aria-label={label} className="grid grid-cols-4 gap-3">{pieces.map((v,i)=><div key={i} className="rounded-lg bg-[var(--site-muted)] px-2 py-5"><strong className="block text-2xl tabular-nums sm:text-4xl">{String(v).padStart(2,"0")}</strong><span className="text-xs opacity-70">{["Days","Hours","Minutes","Seconds"][i]}</span></div>)}</div></div>;
}
export function ImageCarouselWidget({items}:{items:Item[]}){
 const [current,setCurrent]=useState(0);
 const slides=items.filter(i=>safeImage(i.src));
 if(!slides.length)return <p className="p-6">Add images in the widget inspector.</p>;
 const index=Math.min(current,slides.length-1);
 const item=slides[index];
 return <div className="relative rounded-2xl border border-current/10 p-3" role="region" aria-roledescription="carousel" aria-label="Image carousel">
  <img src={safeImage(item.src)} alt={str(item.alt)} loading="lazy" className="h-64 w-full rounded-xl object-cover sm:h-96"/>
  <div className="mt-4 flex items-center justify-between gap-4"><button type="button" aria-label="Previous image" className="rounded-lg border px-4 py-2" onClick={()=>setCurrent((index+slides.length-1)%slides.length)} disabled={slides.length===1}>←</button><span className="text-sm" aria-live="polite">{index+1} / {slides.length}</span><button type="button" aria-label="Next image" className="rounded-lg border px-4 py-2" disabled={slides.length===1} onClick={()=>setCurrent((index+1)%slides.length)}>→</button></div>
 </div>;
}
export function IconListWidget({items}:{items:Item[]}){
 return <ul className="space-y-3">{items.map((item,i)=><li key={i} className="flex items-center gap-3"><span className="text-xl" aria-hidden="true">{str(item.icon)||"✓"}</span>{item.url?<a className="underline underline-offset-2" href={safeHref(item.url)}>{str(item.title)}</a>:<span>{str(item.title)}</span>}</li>)}</ul>;
}
export function ContactButtonsWidget({items,floating=false}:{items:Item[];floating?:boolean}){
 return <nav aria-label="Contact links" className={(floating?"fixed bottom-5 right-5 z-40 ":"")+"flex max-w-full flex-wrap justify-end gap-2"}>{items.map((item,i)=><a key={i} href={safeHref(item.url)} rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--site-primary)] px-4 py-3 text-sm font-semibold text-white shadow-lg"><span aria-hidden="true">{str(item.icon)||"✉"}</span>{str(item.title)||"Contact"}</a>)}</nav>;
}
