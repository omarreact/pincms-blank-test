"use client";
import {useState} from "react";
import {safeHref,safeImage,plainText} from "@/lib/safe-content";
import {extraLabels,integrationWidgets} from "@/lib/extra-widgets";
import {ImageCarouselWidget} from "@/components/blocks/InteractiveWidgets";
import {ContentFeed,ContentSearch} from "@/components/blocks/ContentFeed";
type Props={type:string;data:Record<string,any>;preview?:boolean};
const section="mx-auto max-w-6xl px-6 py-9";
const s=(v:unknown)=>String(v??"");
const items=(v:unknown):Record<string,any>[]=>Array.isArray(v)?v.slice(0,24):[];
function LinkItem({item}:{item:Record<string,any>}){return <a href={safeHref(item.url)} className="rounded-xl border border-current/15 p-4 hover:bg-black/5">{item.icon&&<span className="mr-2">{s(item.icon)}</span>}{s(item.title)||"Link"}</a>}
export function ExtraWidgetRenderer({type,data:d,preview=false}:Props){
 const [open,setOpen]=useState(false);
 const list=items(d.items);
 if(integrationWidgets.has(type))return preview?<div className="mx-auto max-w-3xl rounded-xl border border-dashed border-amber-400 bg-amber-50 px-6 py-5 text-amber-950"><strong>{extraLabels[type]}</strong><p className="mt-1 text-sm">This widget needs a provider integration or dynamic content source. It is intentionally disabled on published pages until configured.</p></div>:null;
 switch(type){
 case "posts":case "loopGrid":case "portfolio":case "archivePosts":return <section className={section}><ContentFeed limit={Number(d.limit)||9}/></section>;
 case "loopCarousel":return <section className={section}><ContentFeed carousel limit={Number(d.limit)||9}/></section>;
 case "icon":return <div className={section+" text-5xl"} aria-label={s(d.title)}>{s(d.icon)||"✦"}</div>;
 case "imageBox":return <div className={section}><div className="max-w-xl rounded-xl border border-current/15 p-6">{safeImage(d.src)&&<img src={safeImage(d.src)} alt={s(d.title)} className="mb-4 aspect-video w-full rounded-lg object-cover"/>}<h3 className="text-2xl font-bold">{s(d.title)}</h3><p className="mt-2 opacity-70">{plainText(d.content)}</p></div></div>;
 case "counter":return <div className={section+" text-center"}><div className="text-6xl font-black text-[var(--site-primary)]">{s(d.prefix)}{s(d.value)}{s(d.suffix)}</div><p className="mt-3 text-lg">{s(d.label)}</p></div>;
 case "testimonial":case "blockquote":return <blockquote className={section+" text-center"}><p className="text-2xl font-medium italic">“{plainText(d.content)}”</p><footer className="mt-4 text-sm opacity-70">— {s(d.title)}</footer></blockquote>;
 case "accordion":case "toggle":return <section className={section+" max-w-4xl"}>{list.map((i,n)=><details key={n} className="border-b border-current/15 py-4"><summary className="cursor-pointer text-lg font-semibold">{s(i.title)||"Question"}</summary><p className="mt-3 whitespace-pre-line opacity-75">{plainText(i.content)}</p></details>)}</section>;
 case "soundCloud":return <section className={section}>{safeHref(d.src,"").startsWith("https://soundcloud.com/")?<iframe title={s(d.title)||"SoundCloud"} loading="lazy" className="h-40 w-full rounded-xl border" allow="autoplay" src={"https://w.soundcloud.com/player/?url="+encodeURIComponent(s(d.src))}/>:<p>Add a public SoundCloud track URL.</p>}</section>;
 case "googleMaps":return <section className={section}><iframe className="h-80 w-full rounded-xl border" title={s(d.title)||"Map"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://www.google.com/maps?q="+encodeURIComponent(s(d.location||"Dhaka"))+"&output=embed"}/></section>;
 case "menuAnchor":return <span id={s(d.anchor).replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80)} aria-hidden="true"/>;
 case "readMore":return <section className={section}><details><summary className="cursor-pointer font-semibold">{s(d.title)||"Read more"}</summary><p className="mt-3 whitespace-pre-line">{plainText(d.content)}</p></details></section>;
 case "textPath":return <section className={section+" text-center text-5xl font-black tracking-wide"}>{s(d.text)}</section>;
 case "slides":case "mediaCarousel":case "carousel":return <section className={section}><ImageCarouselWidget items={list}/></section>;
 case "priceList":case "priceTable":return <section className={section+" grid gap-4 md:grid-cols-2"}>{list.map((i,n)=><article key={n} className="rounded-2xl border border-current/15 p-8"><h3 className="text-2xl font-bold">{s(i.title)}</h3><p className="mt-3 text-3xl font-bold text-[var(--site-primary)]">{s(i.price)}</p><p className="mt-3 opacity-75">{plainText(i.content)}</p>{i.url&&<a className="mt-5 inline-flex rounded-lg bg-[var(--site-primary)] px-5 py-3 font-semibold text-white" href={safeHref(i.url)}>Choose</a>}</article>)}</section>;
 case "flipBox":return <section className={section}><div className="group mx-auto max-w-lg rounded-xl border border-current/15 p-9 text-center" tabIndex={0}><h3 className="text-2xl font-bold">{s(d.title)}</h3><p className="mt-3 opacity-70">{plainText(d.content)}</p><a className="mt-4 inline-flex text-[var(--site-primary)] underline" href={safeHref(d.url)}>{s(d.buttonText||"Learn more")}</a></div></section>;
 case "animatedHeadline":return <section className={section}><h2 className="text-4xl font-extrabold md:text-6xl">{s(d.before)}<span className="text-[var(--site-primary)]">{s(d.accent)}</span>{s(d.after)}</h2></section>;
 case "hotspot":return <section className={section}><div className="relative mx-auto max-w-4xl rounded-xl border border-current/10 bg-slate-100">{safeImage(d.src)?<img src={safeImage(d.src)} alt={s(d.title)} className="w-full rounded-xl"/>:<div className="grid h-72 place-items-center opacity-60">Select a background image</div>}{list.map((i,n)=><button key={n} type="button" title={s(i.title)+": "+s(i.content)} className="absolute grid h-9 w-9 place-items-center rounded-full bg-[var(--site-primary)] font-bold text-white shadow" style={{left:Math.min(95,Math.max(2,Number(i.x)||50))+"%",top:Math.min(95,Math.max(2,Number(i.y)||50))+"%"}}>{n+1}</button>)}</div></section>;
 case "testimonialCarousel":case "reviews":return <section className={section+" grid gap-4 md:grid-cols-2"}>{list.map((i,n)=><blockquote className="rounded-xl border border-current/15 p-6" key={n}><div className="text-amber-500">★★★★★</div><p className="mt-3">{plainText(i.content)}</p><footer className="mt-4 font-bold">{s(i.title)}</footer></blockquote>)}</section>;
 case "tableOfContents":return <section className={section}><h3 className="text-lg font-bold">On this page</h3><p className="mt-2 text-sm opacity-70">Use heading blocks and anchor IDs to build an accessible contents list.</p></section>;
 case "shareButtons":return <section className={section+" flex flex-wrap gap-3"}>{["Facebook","LinkedIn","X"].map(n=><a key={n} rel="noopener noreferrer" target="_blank" href={n==="Facebook"?"https://www.facebook.com/sharer/sharer.php":n==="LinkedIn"?"https://www.linkedin.com/sharing/share-offsite/":"https://twitter.com/intent/tweet"} className="rounded-lg border px-5 py-3">{n}</a>)}</section>;
 case "facebookButton":return <section className={section}><a rel="noopener noreferrer" target="_blank" className="rounded-lg bg-blue-600 px-5 py-3 text-white" href={safeHref(d.url)}>{s(d.title)}</a></section>;
 case "lottie":return <section className={section}><p className="text-sm opacity-70">Animation asset: {s(d.src)||"Add a Lottie JSON URL"} — playback requires a Lottie integration.</p></section>;
 case "codeHighlight":return <section className={section}><pre className="overflow-x-auto rounded-xl bg-slate-950 p-6 text-sm text-slate-100"><code>{s(d.code)}</code></pre></section>;
 case "videoPlaylist":return <section className={section+" grid gap-3"}>{list.map((i,n)=><a key={n} href={safeHref(i.src||i.url)} className="rounded-lg border p-4">{n+1}. {s(i.title)}</a>)}</section>;
 case "progressTracker":return <div className="h-1 w-full bg-[var(--site-muted)]"><div className="h-full w-1/2 bg-[var(--site-primary)]"/></div>;
 case "offCanvas":return <section className={section}><button type="button" onClick={()=>setOpen(!open)} className="rounded-lg bg-[var(--site-primary)] px-5 py-3 font-semibold text-white" aria-expanded={open}>{s(d.title)||"Open panel"}</button>{open&&<div className="mt-4 rounded-xl border p-8"><button type="button" onClick={()=>setOpen(false)} className="float-right" aria-label="Close">×</button><p>{plainText(d.content)}</p></div>}</section>;
 case "navMenu":case "linkInBio":case "sitemap":return <nav className={section+" flex flex-wrap gap-3"} aria-label={s(d.title)||"Links"}>{list.map((i,n)=><LinkItem item={i} key={n}/>)}</nav>;
 case "siteTitle":case "pageTitle":return <section className={section}><h1 className="text-5xl font-bold">{s(d.text)||s(d.title)||"Page title"}</h1></section>;
 case "breadcrumbs":return <nav aria-label="Breadcrumb" className={section+" text-sm opacity-70"}>{s(d.title)}</nav>;
 case "search":return <ContentSearch/>;
 default:return <section className={section}><h3 className="text-xl font-semibold">{s(d.title)||extraLabels[type]||type}</h3>{d.content&&<p className="mt-3 whitespace-pre-line opacity-75">{plainText(d.content)}</p>}</section>;
 }
}
