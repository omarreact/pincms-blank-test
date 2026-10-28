"use client";
import {safeHref,safeImage,plainText} from "@/lib/safe-content";
import type {Block} from "@/lib/blocks";
import React from "react";
import {frameStyleVariables} from "@/lib/block-style";
import {FormWidget} from "@/components/forms/FormWidget";
import {TabsWidget,CountdownWidget,ImageCarouselWidget,IconListWidget,ContactButtonsWidget} from "@/components/blocks/InteractiveWidgets";
const section="mx-auto max-w-6xl px-6";
const button="inline-flex items-center rounded-xl bg-[var(--site-primary)] px-7 py-3 font-semibold text-white transition hover:opacity-85";
function link(url:unknown){return safeHref(url);}
function field(d:Record<string,any>,key:string){return String(d[key]??"");}
function pic(url:unknown,alt:unknown,cls="w-full rounded-2xl object-cover"){const src=safeImage(url);return src?<img loading="lazy" alt={String(alt??"")} src={src} className={cls}/>:null;}
export function BlockRenderer({blocks,selectedId,onSelect}:{blocks:Block[];selectedId?:string;onSelect?:(id:string)=>void}){
 return <div className="site-blocks">{[...blocks].sort((a,b)=>a.order-b.order).map((b)=>{const d=b.data as Record<string,any>;
  const render=()=>{switch(b.type){
  case "hero": return <section key={b.id} className="site-hero relative overflow-hidden px-6 py-24 md:py-36" style={safeImage(d.backgroundImage)?{backgroundImage:`linear-gradient(90deg,rgba(9,18,39,.82),rgba(9,18,39,.54)), url('${safeImage(d.backgroundImage)}')`,backgroundSize:"cover",backgroundPosition:"center"}:undefined}><div className={`${section} ${d.alignment==="center"?"text-center":""}`}><span className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-1 text-sm font-semibold text-white">Made with PinCMS</span><h1 className="max-w-4xl text-5xl font-bold tracking-tight text-white md:text-7xl">{field(d,"headline")}</h1><p className="mt-6 max-w-2xl text-xl text-white/85">{field(d,"subheadline")}</p>{d.buttonText&&<a className="mt-8 inline-flex rounded-xl bg-white px-7 py-3 font-semibold text-slate-950" href={link(d.buttonUrl)}>{field(d,"buttonText")} →</a>}</div></section>;
  case "heading":return <section key={b.id} className={`${section} py-8`}><h2 className="text-3xl font-bold tracking-tight md:text-5xl">{field(d,"text")}</h2></section>;
  case "dualHeading":return <section className={section+" py-8"}><h2 className="text-3xl font-bold tracking-tight md:text-5xl">{field(d,"before")} <span className="text-[var(--site-primary)]">{field(d,"accent")}</span> {field(d,"after")}</h2></section>;
  case "iconBox":return <section className={section+" py-12"}><article className="site-tile max-w-lg rounded-2xl border border-current/10 p-8"><span aria-hidden="true" className="mb-5 block text-4xl">{field(d,"icon")}</span><h3 className="text-2xl font-semibold">{field(d,"title")}</h3><p className="mt-3 whitespace-pre-line opacity-75">{plainText(d.content)}</p>{d.url&&<a className="mt-5 inline-block underline" href={link(d.url)}>Learn more</a>}</article></section>;
  case "text":return <section key={b.id} className={`${section} py-8`}><p className="max-w-4xl whitespace-pre-line text-lg leading-relaxed opacity-85">{plainText(d.content)}</p></section>;
  case "image":return <section key={b.id} className={`${section} py-8`}><figure>{pic(d.src,d.alt)}{d.caption&&<figcaption className="mt-3 text-center text-sm opacity-60">{field(d,"caption")}</figcaption>}</figure></section>;
  case "gallery":return <section key={b.id} className={`${section} grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-3`}>{(Array.isArray(d.images)?d.images:[]).slice(0,18).map((i:any,n:number)=><div key={n}>{pic(i?.src,i?.alt,"h-60 w-full rounded-2xl object-cover")}</div>)}</section>;
  case "video":{const src=safeImage(d.src);return <section key={b.id} className={`${section} py-12`}>{src&&<video className="w-full rounded-2xl" controls preload="metadata" src={src}/>}</section>}
  case "cta":return <section key={b.id} className="my-12 bg-[var(--site-muted)] px-6 py-20"><div className={`${section} text-center`}><h2 className="text-4xl font-bold">{field(d,"headline")}</h2><p className="mx-auto mt-4 max-w-2xl text-lg opacity-75">{field(d,"description")}</p>{d.buttonText&&<a href={link(d.buttonUrl)} className={`${button} mt-8`}>{field(d,"buttonText")}</a>}</div></section>;
  case "columns":case "features":case "pricing":case "team":case "testimonials":return <section key={b.id} className={`${section} grid gap-5 py-16 sm:grid-cols-2 lg:grid-cols-3`}>{(Array.isArray(d.items)?d.items:[]).slice(0,18).map((item:any,n:number)=><article key={n} className="site-tile rounded-2xl border border-current/10 p-8">{pic(item.image,item.title,"mb-4 h-36 w-full rounded-xl object-cover")}<h3 className="text-2xl font-semibold">{String(item.title??item.name??`Item ${n+1}`)}</h3><p className="mt-3 whitespace-pre-line leading-relaxed opacity-75">{plainText(item.content??item.quote??item.description)}</p></article>)}</section>;
  case "stats":return <section key={b.id} className={`${section} grid gap-5 py-12 sm:grid-cols-3`}>{(Array.isArray(d.items)?d.items:[]).map((item:any,n:number)=><div key={n} className="text-center"><strong className="block text-5xl">{String(item.value??"")}</strong><span className="opacity-70">{String(item.label??"")}</span></div>)}</section>;
  case "faq":return <section key={b.id} className={`${section} max-w-4xl py-12`}>{(Array.isArray(d.items)?d.items:[]).map((item:any,n:number)=><details key={n} className="border-b border-current/15 py-5"><summary className="cursor-pointer text-lg font-semibold">{String(item.question??"")}</summary><p className="mt-3 whitespace-pre-line opacity-75">{plainText(item.answer)}</p></details>)}</section>;
  case "button":return <div key={b.id} className={`${section} py-6`}><a className={button} href={link(d.url)}>{field(d,"label")}</a></div>;
  case "divider":return <hr key={b.id} className="mx-auto my-8 max-w-6xl opacity-20"/>;
  case "spacer":return <div key={b.id} style={{height:({sm:28,md:60,lg:100,xl:160} as Record<string,number>)[String(d.height)]??60}}/>;
  case "starRating":{const rating=Math.min(5,Math.max(0,Number(d.rating)||0));return <section className={section+" py-9"}><div role="img" aria-label={field(d,"label")+": "+rating+" out of 5 stars"}><span className="text-4xl tracking-widest text-amber-500" aria-hidden="true">{"★★★★★".slice(0,Math.round(rating))}{"☆☆☆☆☆".slice(Math.round(rating))}</span><span className="ml-4 font-semibold">{rating.toFixed(1)} / 5</span></div><p className="mt-2 opacity-75">{field(d,"label")}</p></section>}
  case "progressBar":{const value=Math.min(100,Math.max(0,Number(d.value)||0));return <section className={section+" py-9"}><div className="mb-3 flex justify-between text-sm font-semibold"><span>{field(d,"label")}</span><span>{value}%</span></div><div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={field(d,"label")||"Progress"} className="h-3 overflow-hidden rounded-full bg-[var(--site-muted)]"><div className="h-full rounded-full bg-[var(--site-primary)]" style={{width:value+"%"}}/></div></section>}
  case "alert":{const tones:Record<string,string>={info:"border-sky-300 bg-sky-50 text-sky-950",success:"border-green-300 bg-green-50 text-green-950",warning:"border-amber-300 bg-amber-50 text-amber-950",error:"border-red-300 bg-red-50 text-red-950"};return <section className={section+" py-7"}><div role="status" className={"rounded-xl border p-6 "+(tones[String(d.tone)]||tones.info)}><strong className="text-lg">{field(d,"title")}</strong><p className="mt-2 whitespace-pre-line">{plainText(d.content)}</p></div></section>}
  case "iconList":return <section className={section+" py-9"}><IconListWidget items={Array.isArray(d.items)?d.items:[]}/></section>;
  case "socialIcons":return <section className={section+" py-9"}><ContactButtonsWidget items={Array.isArray(d.items)?d.items:[]}/></section>;
  case "contactButtons":return <section className={section+" py-7"}><ContactButtonsWidget items={Array.isArray(d.items)?d.items:[]} floating={(d.floating===true||d.floating==="true")&&!onSelect}/></section>;
  case "tabs":return <section className={section+" py-9"}><TabsWidget items={Array.isArray(d.items)?d.items:[]}/></section>;
  case "countdown":return <section className={section+" py-9"}><CountdownWidget target={field(d,"target")} label={field(d,"label")}/></section>;
  case "imageCarousel":return <section className={section+" py-9"}><ImageCarouselWidget items={Array.isArray(d.items)?d.items:[]}/></section>;
  case "form":return <section className={section+" py-10"}><FormWidget slug={String(d.slug||"")} preview={Boolean(onSelect)}/></section>;
  case "html":return <pre key={b.id} className={`${section} overflow-x-auto whitespace-pre-wrap text-sm opacity-70`}>{field(d,"code")}</pre>;
  default:return <div key={b.id} className={`${section} py-6 text-sm opacity-60`}>Unsupported block type: {b.type}</div>;

 }};
 const anchor=typeof d.anchor==="string"&&/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(d.anchor)?d.anchor:undefined;
 const aria=typeof d.ariaLabel==="string"&&d.ariaLabel.trim()?d.ariaLabel.slice(0,150):undefined;
 return <div key={b.id} id={anchor} role="group" aria-label={aria|| (onSelect?"Editable "+b.type+" block":undefined)}
   tabIndex={onSelect?0:undefined}
   className={"pincms-block-frame"+(onSelect?" pincms-editable":"")+(selectedId===b.id?" pincms-selected":"")}
   style={frameStyleVariables(d.styles)}
   onClickCapture={onSelect?event=>{event.preventDefault();onSelect(b.id);}:undefined}
   onKeyDown={onSelect?event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect(b.id);}}:undefined}>
   {render()}
  </div>;
 })}</div>
}
