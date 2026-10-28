"use client";
import {useState} from "react";
import {GripVertical,Copy,Trash2,Plus,ArrowUp,ArrowDown} from "lucide-react";
import type {Block} from "@/lib/blocks";
import {blockLabels} from "@/lib/blocks";
import {childrenOf,isLayout} from "@/lib/builder-tree";
import {BlockRenderer} from "@/components/blocks/BlockRenderer";
import {frameStyleVariables,validatedStyle} from "@/lib/block-style";
export type DropPayload={kind:"new";type:string}|{kind:"move";id:string};
export function readDrop(event:React.DragEvent):DropPayload|null{
 try{const data=JSON.parse(event.dataTransfer.getData("application/x-pincms"));if(data?.kind==="new"&&typeof data.type==="string")return data;if(data?.kind==="move"&&typeof data.id==="string")return data}catch{}
 return null;
}
type Props={blocks:Block[];selected:string|null;onSelect:(id:string)=>void;onDropNode:(payload:DropPayload,parent:string|null,index:number)=>void;onDuplicate:(id:string)=>void;onDelete:(id:string)=>void;onMove:(id:string,parent:string|null,index:number)=>void};
function DropTarget({parent,index,onDropNode,empty=false}:{parent:string|null;index:number;onDropNode:Props["onDropNode"];empty?:boolean}){
 const [active,setActive]=useState(false);
 return <div className={"pc-drop-target "+(active?"pc-drop-active ":"")+(empty?"pc-drop-empty":"")} onDragEnter={e=>{e.preventDefault();e.stopPropagation();setActive(true)}} onDragOver={e=>{e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect="move"}} onDragLeave={e=>{e.stopPropagation();setActive(false)}} onDrop={e=>{e.preventDefault();e.stopPropagation();setActive(false);const payload=readDrop(e);if(payload)onDropNode(payload,parent,index)}}><span>{empty?"Drop a widget or container here":"Drop here"}</span></div>;
}
function NodeView({node,parent,index,...p}:{node:Block;parent:string|null;index:number}&Props){
 const nested=isLayout(node.type),kids=childrenOf(node);
 const direction=node.type==="row"?"row":node.type==="grid"?"grid":node.type==="column"?"column":String(node.data.direction||"column");
 const gap=Math.min(64,Math.max(0,Number(node.data.gap)||16));
 const style:React.CSSProperties={gap:gap+"px"};
 if(direction==="grid"){style.display="grid";style.gridTemplateColumns="repeat(auto-fit,minmax(min(100%,200px),1fr))";}
 else {style.display="flex";style.flexDirection=direction==="row"?"row":"column";style.flexWrap=direction==="row"?"wrap":"nowrap";}
 return <div className={"pc-builder-node pincms-block-frame "+(p.selected===node.id?"pc-node-selected":"")} style={{...frameStyleVariables(node.data.styles),padding:validatedStyle("padding",node.data.padding)||undefined}} data-block-id={node.id} onClick={e=>{e.stopPropagation();p.onSelect(node.id)}}>
 <div className="pc-node-toolbar" onClick={e=>e.stopPropagation()}>
  <span draggable className="pc-grip" title="Drag widget" onDragStart={e=>{e.stopPropagation();e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("application/x-pincms",JSON.stringify({kind:"move",id:node.id}));}}><GripVertical size={15}/></span>
  <button type="button" onClick={()=>p.onSelect(node.id)} className="pc-node-label">{blockLabels[node.type]||node.type}</button>
  <button type="button" aria-label="Move up" onClick={()=>p.onMove(node.id,parent,index-1)}><ArrowUp size={13}/></button>
  <button type="button" aria-label="Move down" onClick={()=>p.onMove(node.id,parent,index+1)}><ArrowDown size={13}/></button>
  <button type="button" aria-label="Duplicate widget" onClick={()=>p.onDuplicate(node.id)}><Copy size={13}/></button>
  <button type="button" aria-label="Delete widget" onClick={()=>p.onDelete(node.id)}><Trash2 size={13}/></button>
 </div>
 {nested?<div className="pc-container-inside" style={style}>
  {kids.length===0?<DropTarget parent={node.id} index={0} onDropNode={p.onDropNode} empty/>:kids.map((child,i)=><div key={child.id} className="pc-child-slot"><DropTarget parent={node.id} index={i} onDropNode={p.onDropNode}/><NodeView node={child} parent={node.id} index={i} {...p}/>{i===kids.length-1&&<DropTarget parent={node.id} index={kids.length} onDropNode={p.onDropNode}/>}</div>)}
  <button type="button" className="pc-inside-add" title="Select this container and click a widget in the library" onClick={e=>{e.stopPropagation();p.onSelect(node.id)}}><Plus size={14}/> Add inside</button>
 </div>:<div className="pc-render-leaf"><BlockRenderer blocks={[node]} onSelect={p.onSelect} selectedId={p.selected||undefined}/></div>}
 </div>;
}
export function BuilderCanvas(p:Props){
 return <div className="pc-builder-canvas" aria-label="Visual page canvas">
  {p.blocks.length===0?<DropTarget parent={null} index={0} onDropNode={p.onDropNode} empty/>:p.blocks.map((node,i)=><div key={node.id}><DropTarget parent={null} index={i} onDropNode={p.onDropNode}/><NodeView node={node} parent={null} index={i} {...p}/>{i===p.blocks.length-1&&<DropTarget parent={null} index={p.blocks.length} onDropNode={p.onDropNode}/>}</div>)}
 </div>;
}
