"use client";
import {useCallback,useState} from "react";
import {useRouter} from "next/navigation";
import {Layers,Blocks,Monitor,Tablet,Smartphone,Undo2,Redo2,Save,Send,Search,PanelLeftClose,Plus} from "lucide-react";
import {BlockInspector} from "@/components/editor/BlockInspector";
import {BuilderCanvas,type DropPayload} from "@/components/editor/BuilderCanvas";
import {Block,blockLabels,defaultBlockData} from "@/lib/blocks";
import {childrenOf,cloneNode,countNodes,findNode,findParent,insertNode,isLayout,makeNode,moveNode,normalize,patchNode,removeNode} from "@/lib/builder-tree";
const base={title:"",slug:"",status:"DRAFT",excerpt:"",seoTitle:"",seoDesc:"",ogImage:"",publishedAt:"",blocks:[] as Block[]};
type DocumentData=typeof base;
function Navigator({nodes,selected,onSelect,depth=0}:{nodes:Block[];selected:string|null;onSelect:(id:string)=>void;depth?:number}){
 return <>{nodes.map(n=><div key={n.id}>
  <button type="button" className={"pc-nav-node "+(selected===n.id?"active":"")} style={{paddingLeft:12+depth*15}} onClick={()=>onSelect(n.id)}><span>{isLayout(n.type)?"▦":"◇"}</span>{blockLabels[n.type]||n.type}</button>
  {childrenOf(n).length>0&&<Navigator nodes={childrenOf(n)} selected={selected} onSelect={onSelect} depth={depth+1}/>}
 </div>)}</>;
}
export function PageEditor({initial,kind="page",id}:{initial?:Partial<DocumentData>;kind?:"page"|"post";id?:string}){
 const router=useRouter();
 const [doc,setDoc]=useState<DocumentData>(()=>({...base,...initial,blocks:normalize((initial?.blocks??[]) as Block[])}));
 const [past,setPast]=useState<DocumentData[]>([]),[future,setFuture]=useState<DocumentData[]>([]);
 const [selected,setSelected]=useState<string|null>(null),[view,setView]=useState("desktop"),[panel,setPanel]=useState<"widgets"|"tree"|"document">("widgets");
 const [search,setSearch]=useState(""),[working,setWorking]=useState(false),[dirty,setDirty]=useState(false),[notice,setNotice]=useState("");
 const apply=useCallback((change:(v:DocumentData)=>DocumentData)=>{setPast(history=>[...history.slice(-29),structuredClone(doc)]);setFuture([]);setDoc(change(doc));setDirty(true)},[doc]);
 const setField=(key:keyof DocumentData,value:string)=>apply(v=>({...v,[key]:value}));
 const update=(nodeId:string,patch:Record<string,unknown>)=>apply(v=>({...v,blocks:patchNode(v.blocks,nodeId,patch)}));
 const add=(type:string,parent?:string|null,index?:number)=>{
  if(countNodes(doc.blocks)+(type==="row"||type==="grid"?3:1)>120){setNotice("Maximum 120 widgets per page.");return}
  let target=parent===undefined?(selected&&isLayout(findNode(doc.blocks,selected)?.type||"")?selected:null):parent;
  const node=makeNode(type,defaultBlockData);
  if(type==="row"){node.data.children=[makeNode("column",defaultBlockData),makeNode("column",defaultBlockData)]}
  if(type==="grid"){node.data.children=[makeNode("column",defaultBlockData),makeNode("column",defaultBlockData)]}
  apply(v=>({...v,blocks:insertNode(v.blocks,node,target,index)}));setSelected(node.id);
 };
 const onDropNode=(payload:DropPayload,parent:string|null,index:number)=>{
  if(payload.kind==="new"){add(payload.type,parent,index);return}
  if(!findNode(doc.blocks,payload.id))return;
  apply(v=>({...v,blocks:moveNode(v.blocks,payload.id,parent,index)}));setSelected(payload.id);
 };
 const remove=(nodeId:string)=>{apply(v=>({...v,blocks:removeNode(v.blocks,nodeId)}));if(selected===nodeId)setSelected(null)};
 const duplicate=(nodeId:string)=>{const item=findNode(doc.blocks,nodeId);if(!item||countNodes(doc.blocks)>=120)return;const copy=cloneNode(item);const location=findParent(doc.blocks,nodeId);apply(v=>({...v,blocks:insertNode(v.blocks,copy,location?.parent??null,location?location.index+1:undefined)}));setSelected(copy.id)};
 const nudge=(nodeId:string,parent:string|null,index:number)=>{const original=findParent(doc.blocks,nodeId);const target=original?.parent===parent&&original.index<index?index+1:index;apply(v=>({...v,blocks:moveNode(v.blocks,nodeId,parent,Math.max(0,target))}))};
 const undo=()=>{if(!past.length)return;setFuture(v=>[structuredClone(doc),...v]);setDoc(past[past.length-1]);setPast(v=>v.slice(0,-1));setDirty(true)};
 const redo=()=>{if(!future.length)return;setPast(v=>[...v,structuredClone(doc)]);setDoc(future[0]);setFuture(v=>v.slice(1));setDirty(true)};
 const picked=selected?findNode(doc.blocks,selected):undefined;
 async function save(status:string){
  if(!doc.title.trim()){setNotice("Enter a page title in the Page settings tab.");setPanel("document");return}
  setWorking(true);setNotice("");
  try{
   const slug=(doc.slug||doc.title).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
   const publishedAt=doc.publishedAt?new Date(doc.publishedAt).toISOString():null;
   const res=await fetch("/api/"+(kind==="page"?"pages":"posts")+(id?"/"+id:""),{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...doc,blocks:normalize(doc.blocks),slug,status,publishedAt})});
   const result=await res.json();if(!res.ok)throw Error(result.error||"Unable to save");
   setDoc(d=>({...d,slug,status}));setDirty(false);setNotice(status==="PUBLISHED"?"Published successfully":"Saved successfully");
   if(!id)router.replace("/admin/"+(kind==="page"?"pages":"posts")+"/"+result.id);
   router.refresh();
  }catch(e){setNotice(e instanceof Error?e.message:"Save failed")}finally{setWorking(false)}
 }
 const grouped:[string,string[]][]=[
  ["Layout",["container","row","column","grid","divider","spacer"]],
  ["Essentials",["heading","dualHeading","text","image","video","button","icon","iconBox","imageBox","hero","cta"]],
  ["Pro & Interactive",["form","tabs","accordion","slides","flipBox","hotspot","priceTable","priceList","loopGrid","animatedHeadline","countdown","imageCarousel","socialIcons"]],
  ["All widgets",Object.keys(blockLabels).filter(x=>!["container","row","column","grid","divider","spacer","heading","dualHeading","text","image","video","button","icon","iconBox","imageBox","hero","cta","form","tabs","accordion","slides","flipBox","hotspot","priceTable","priceList","loopGrid","animatedHeadline","countdown","imageCarousel","socialIcons"].includes(x))]
 ];
 return <div className="pc-app">
  <header className="pc-topbar">
   <div className="pc-wordmark"><span className="pc-mark">✳</span> PinCMS <span className="pc-studio-label">STUDIO</span></div>
   <div className="pc-top-title">{doc.title||"Untitled "+kind}<span className="pc-save-indicator">{dirty?"● Unsaved":"✓ Saved"}</span></div>
   <div className="pc-top-actions">
    <button title="Undo" aria-label="Undo" disabled={!past.length} onClick={undo}><Undo2 size={16}/></button>
    <button title="Redo" aria-label="Redo" disabled={!future.length} onClick={redo}><Redo2 size={16}/></button>
    <button disabled={working||!doc.publishedAt} title="Schedule publishing" onClick={()=>save("SCHEDULED")}>Schedule</button>
    <button disabled={working||(!!id&&doc.status==="PUBLISHED")} onClick={()=>save("DRAFT")}><Save size={14}/> Save draft</button>
    <button className="pc-publish" disabled={working} onClick={()=>save("PUBLISHED")}><Send size={14}/>{id&&doc.status==="PUBLISHED"?"Update":"Publish"}</button>
   </div>
  </header>
  {notice&&<div className="pc-notice" role="status">{notice}<button onClick={()=>setNotice("")} aria-label="Dismiss">×</button></div>}
  <div className="pc-workspace">
   <aside className="pc-sidebar">
    <div className="pc-panel-tabs">
     <button className={panel==="widgets"?"active":""} onClick={()=>setPanel("widgets")} title="Elements"><Blocks size={17}/> Elements</button>
     <button className={panel==="tree"?"active":""} onClick={()=>setPanel("tree")} title="Navigator"><Layers size={17}/> Layers</button>
     <button className={panel==="document"?"active":""} onClick={()=>setPanel("document")} title="Page settings"><PanelLeftClose size={17}/> Page</button>
    </div>
    {panel==="widgets"&&<div className="pc-sidebar-scroll">
      <div className="pc-search"><Search size={15}/><input aria-label="Search widgets" placeholder="Search widgets..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <p className="pc-help">Click to add, or drag into a container or row. Select a layout first to add inside it.</p>
      {grouped.map(([name,types])=>{const filtered=types.filter(t=>(blockLabels[t]||t).toLowerCase().includes(search.toLowerCase()));return filtered.length?<section key={name} className="pc-widget-group"><h3>{name}<span>{filtered.length}</span></h3><div className="pc-widget-grid">{filtered.map(type=><button key={type} draggable onDragStart={e=>{e.dataTransfer.effectAllowed="copy";e.dataTransfer.setData("application/x-pincms",JSON.stringify({kind:"new",type}))}} onClick={()=>add(type)} className="pc-widget" title={"Add "+(blockLabels[type]||type)}><span className="pc-widget-icon">{isLayout(type)?"▦":type.toLowerCase().includes("image")?"▧":type.toLowerCase().includes("text")?"T":"◇"}</span><span>{blockLabels[type]}</span></button>)}</div></section>:null})}
    </div>}
    {panel==="tree"&&<div className="pc-sidebar-scroll"><div className="pc-tree-heading"><Layers size={16}/> Page structure <span>{countNodes(doc.blocks)}</span></div><Navigator nodes={doc.blocks} selected={selected} onSelect={setSelected}/><button className="pc-add-layout" onClick={()=>add("container",null)}><Plus size={16}/> New container</button></div>}
    {panel==="document"&&<div className="pc-sidebar-scroll pc-document-fields"><h3>Page settings</h3><label>Publish at<input type="datetime-local" value={doc.publishedAt} onChange={e=>setField("publishedAt",e.target.value)}/></label>{(["title","slug","excerpt","seoTitle","seoDesc","ogImage"] as const).map(key=><label key={key}>{key.replace(/([A-Z])/g," $1")}<input value={String(doc[key]||"")} onChange={e=>setField(key,e.target.value)}/></label>)}<p>Published changes update the live page immediately. Revision drafts are not supported yet.</p></div>}
   </aside>
   <main className="pc-stage">
    <div className="pc-stage-toolbar"><span>Canvas <span className="pc-toolbar-note">• Drag & drop editor</span></span><div className="pc-device-toggle">{([["desktop",Monitor],["tablet",Tablet],["mobile",Smartphone]] as const).map(([name,Icon])=><button key={name} aria-label={name+" preview"} title={name} className={view===name?"active":""} onClick={()=>setView(name)}><Icon size={16}/></button>)}</div><span>{countNodes(doc.blocks)} elements</span></div>
    <div className="pc-stage-scroll"><div className={"pc-preview pc-preview-"+view} style={{"--site-bg":"#ffffff","--site-fg":"#142038","--site-primary":"#4657e8","--site-accent":"#21cda4","--site-muted":"#f1f5ff"} as React.CSSProperties}>
      <BuilderCanvas blocks={doc.blocks} selected={selected} onSelect={setSelected} onDropNode={onDropNode} onDuplicate={duplicate} onDelete={remove} onMove={nudge}/>
    </div></div>
   </main>
   <aside className="pc-inspector"><div className="pc-inspector-head"><span>PROPERTIES</span><strong>{picked?(blockLabels[picked.type]||picked.type):"Select element"}</strong></div><div className="pc-inspector-body">{picked?<BlockInspector key={picked.id} block={picked} onUpdate={patch=>update(picked.id,patch)}/>:<div className="pc-inspector-empty"><Layers size={29}/><h3>Nothing selected</h3><p>Choose an element on the canvas to edit its content, styles, and responsive settings.</p></div>}</div></aside>
  </div>
 </div>;
}
