"use client";
import {useState} from "react";
import type {Block} from "@/lib/blocks";
import {breakpoints, styleLabels, validatedStyle} from "@/lib/block-style";
import type {Breakpoint, StyleField, BlockStyles} from "@/lib/block-style";

type Field={key:string;label:string;multiline?:boolean;choices?:string[];boolean?:boolean};
const fields:Record<string,Field[]>={
 hero:[{key:"headline",label:"Headline"},{key:"subheadline",label:"Supporting text",multiline:true},{key:"buttonText",label:"Button label"},{key:"buttonUrl",label:"Button URL"},{key:"backgroundImage",label:"Background image URL"}],
 heading:[{key:"text",label:"Heading"}],
 dualHeading:[{key:"before",label:"First text"},{key:"accent",label:"Highlighted text"},{key:"after",label:"Ending text"}],
 text:[{key:"content",label:"Text",multiline:true}],
 image:[{key:"src",label:"Image URL"},{key:"alt",label:"Alternative text"},{key:"caption",label:"Caption"}],
 video:[{key:"src",label:"Video URL"}],
 cta:[{key:"headline",label:"Heading"},{key:"description",label:"Description",multiline:true},{key:"buttonText",label:"Button label"},{key:"buttonUrl",label:"URL"}],
 button:[{key:"label",label:"Label"},{key:"url",label:"Destination URL"}],
 iconBox:[{key:"icon",label:"Icon (symbol)"},{key:"title",label:"Title"},{key:"content",label:"Description",multiline:true},{key:"url",label:"Link URL"}],
 spacer:[{key:"height",label:"Size: sm, md, lg, xl"}],
 form:[{key:"slug",label:"Form slug (create under Admin → Forms)"}],
 starRating:[{key:"rating",label:"Rating (0 to 5)"},{key:"label",label:"Rating label"}],
 progressBar:[{key:"value",label:"Progress percentage (0–100)"},{key:"label",label:"Progress label"}],
 alert:[{key:"title",label:"Title"},{key:"content",label:"Description",multiline:true},{key:"tone",label:"Appearance",choices:["info","success","warning","error"]}],
 countdown:[{key:"label",label:"Countdown label"},{key:"target",label:"Target date (ISO 8601, e.g. 2027-01-01T00:00:00Z)"}],
 contactButtons:[{key:"floating",label:"Floating position",boolean:true}],
 html:[{key:"code",label:"Source displayed as safe text",multiline:true}]
};
const itemFields:Record<string,Field[]>={
 gallery:[{key:"src",label:"Image URL"},{key:"alt",label:"Alt text"}],
 faq:[{key:"question",label:"Question"},{key:"answer",label:"Answer",multiline:true}],
 stats:[{key:"value",label:"Value"},{key:"label",label:"Label"}],
 testimonials:[{key:"title",label:"Customer"},{key:"content",label:"Quote",multiline:true}],
 pricing:[{key:"title",label:"Plan"},{key:"content",label:"Description",multiline:true}],
 columns:[{key:"title",label:"Title"},{key:"content",label:"Content",multiline:true}],
 features:[{key:"title",label:"Title"},{key:"content",label:"Content",multiline:true}],
 iconList:[{key:"icon",label:"Icon"},{key:"title",label:"Text"},{key:"url",label:"Destination URL"}],
 socialIcons:[{key:"icon",label:"Icon"},{key:"title",label:"Label"},{key:"url",label:"Destination URL"}],
 contactButtons:[{key:"icon",label:"Icon"},{key:"title",label:"Label"},{key:"url",label:"Destination URL"}],
 tabs:[{key:"title",label:"Tab label"},{key:"content",label:"Tab content",multiline:true}],
 imageCarousel:[{key:"src",label:"Image URL"},{key:"alt",label:"Alt text"}]
};
const inputClass="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
function InputField({field,value,onChange}:{field:Field;value:string;onChange:(value:string)=>void}){
 return <label className="block text-xs font-semibold text-slate-700">{field.label}{field.boolean?<input className="ml-2" type="checkbox" checked={value==="true"} onChange={e=>onChange(String(e.target.checked))}/>:field.choices?<select className={inputClass} value={value} onChange={e=>onChange(e.target.value)}>{field.choices.map(x=><option key={x} value={x}>{x}</option>)}</select>:field.multiline?
 <textarea rows={3} className={inputClass} value={value} onChange={e=>onChange(e.target.value)}/>:
 <input className={inputClass} value={value} onChange={e=>onChange(e.target.value)}/>}</label>;
}
export function BlockInspector({block,onUpdate}:{block:Block;onUpdate:(patch:Record<string,unknown>)=>void}){
 const [tab,setTab]=useState<"content"|"style"|"advanced">("content");
 const [device,setDevice]=useState<Breakpoint>("desktop");
 const [error,setError]=useState("");
 const [raw,setRaw]=useState("");
 const [showJson,setShowJson]=useState(false);
 const data=block.data||{};
 const styles=(data.styles||{}) as BlockStyles;
 const updateStyle=(field:StyleField,value:string)=>{
  if(value.trim()&&!validatedStyle(field,value)){setError("Invalid value for "+styleLabels[field]+". Use hex colors or safe CSS lengths (for example 16px, 1rem).");return;}
  setError("");
  const cleaned=validatedStyle(field,value);
  const next={...(styles[device]||{})};
  if(cleaned)next[field]=cleaned;else delete next[field];
  onUpdate({styles:{...styles,[device]:next}});
 };
 const listKey=Array.isArray(data.items)?"items":Array.isArray(data.images)?"images":null;
 const listFields=listKey?(itemFields[block.type]||[]):[];
 const listItems=listKey?(data[listKey] as Record<string,unknown>[]):[];
 const setItem=(index:number,key:string,value:string)=>{
  if(!listKey)return;
  onUpdate({[listKey]:listItems.map((item,i)=>i===index?{...item,[key]:value}:item)});
 };
 return <div className="space-y-4" key={block.id}>
  <div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Block inspector">
   {(["content","style","advanced"] as const).map(name=><button key={name} type="button" role="tab" aria-selected={tab===name} onClick={()=>{setTab(name);setError("");}} className={"flex-1 rounded-lg px-2 py-2 text-xs font-bold capitalize "+(tab===name?"bg-white text-indigo-700 shadow":"text-slate-600")}>{name}</button>)}
  </div>
  {tab==="content"&&<div className="space-y-4">
    {(fields[block.type]||[]).map(f=><InputField key={f.key} field={f} value={String(data[f.key]??"")} onChange={v=>onUpdate({[f.key]:v})}/>)}
    {listKey&&listFields.length>0&&<div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Repeatable items</p>
      {listItems.map((item,i)=><div key={i} className="space-y-3 rounded-xl border border-slate-200 p-3">
       <div className="flex items-center justify-between"><strong className="text-xs">Item {i+1}</strong><button type="button" className="text-xs font-bold text-red-600" onClick={()=>onUpdate({[listKey]:listItems.filter((_,n)=>n!==i)})}>Remove</button></div>
       {listFields.map(f=><InputField key={f.key} field={f} value={String(item?.[f.key]??"")} onChange={v=>setItem(i,f.key,v)}/>)}
       </div>)}
      <button type="button" className="w-full rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700" onClick={()=>onUpdate({[listKey]:[...listItems,Object.fromEntries(listFields.map(f=>[f.key,""]))]})}>+ Add item</button>
    </div>}
    {!fields[block.type]&&!listKey&&<p className="text-sm text-slate-600">This block has no text controls. Choose Style or Advanced.</p>}
   </div>}
  {tab==="style"&&<div className="space-y-4">
    <p className="text-xs text-slate-500">Responsive styles apply to the selected block and appear on the published page. Mobile inherits tablet and desktop values.</p>
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">{breakpoints.map(bp=><button key={bp} type="button" aria-pressed={device===bp} className={"flex-1 rounded-md px-2 py-2 text-xs capitalize "+(device===bp?"bg-white font-bold shadow":"")} onClick={()=>setDevice(bp)}>{bp}</button>)}</div>
    {Object.entries(styleLabels).map(([key,name])=>{
     const field=key as StyleField;const value=String(styles[device]?.[field]??"");
     return <label key={key} className="block text-xs font-semibold text-slate-700">{name}
      {["color","backgroundColor","borderColor"].includes(field)?<div className="mt-1 flex gap-2"><input type="color" aria-label={name+" picker"} value={/^#[0-9a-f]{6}$/i.test(value)?value:"#4657e8"} onChange={e=>updateStyle(field,e.target.value)} className="h-10 w-12 cursor-pointer rounded-md border p-1"/><input className={inputClass+" mt-0"} placeholder="Inherit (#rrggbb)" key={block.id+device+field+value} defaultValue={value} onBlur={e=>updateStyle(field,e.target.value)}/></div>:
      field==="textAlign"?<select className={inputClass} value={value} onChange={e=>updateStyle(field,e.target.value)}><option value="">Inherit</option>{["left","center","right","justify"].map(v=><option key={v} value={v}>{v}</option>)}</select>:
      field==="fontWeight"?<select className={inputClass} value={value} onChange={e=>updateStyle(field,e.target.value)}><option value="">Inherit</option>{["300","400","500","600","700","800","900"].map(v=><option key={v} value={v}>{v}</option>)}</select>:
      <input className={inputClass} key={block.id+device+field+value} defaultValue={value} placeholder={field==="padding"?"24px 16px":"e.g. 16px"} onBlur={e=>updateStyle(field,e.target.value)}/>}
     </label>;
    })}
    <button type="button" onClick={()=>onUpdate({styles:{...styles,[device]:{}}})} className="text-xs font-semibold text-indigo-700">Reset {device} overrides</button>
   </div>}
  {tab==="advanced"&&<div className="space-y-4">
    <InputField field={{key:"anchor",label:"HTML anchor ID"}} value={String(data.anchor??"")} onChange={v=>onUpdate({anchor:v.replace(/[^a-zA-Z0-9_-]/g,"").slice(0,80)})}/>
    <InputField field={{key:"ariaLabel",label:"Accessible group label"}} value={String(data.ariaLabel??"")} onChange={v=>onUpdate({ariaLabel:v.slice(0,150)})}/>
    <p className="text-xs text-slate-500">Scripts, arbitrary CSS and plugin PHP are never executed from content blocks.</p>
    <button type="button" onClick={()=>{setShowJson(!showJson);setRaw(JSON.stringify(data,null,2));}} className="text-xs font-semibold text-indigo-700">{showJson?"Close data editor":"Advanced data (JSON)"}</button>
    {showJson&&<><textarea spellCheck={false} aria-label="Block data JSON" rows={10} className={inputClass+" font-mono"} value={raw} onChange={e=>setRaw(e.target.value)}/><button type="button" className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white" onClick={()=>{try{const value=JSON.parse(raw);if(!value||Array.isArray(value)||typeof value!=="object")throw Error("Expected an object");onUpdate(value);setError("");}catch{setError("Invalid JSON object")}}}>Apply JSON data</button></>}
   </div>}
  {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
 </div>;
}
