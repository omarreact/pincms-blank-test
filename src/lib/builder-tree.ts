import type {Block} from "./blocks";
export const layoutTypes=["container","row","column","grid"] as const;
export function isLayout(type:string){return (layoutTypes as readonly string[]).includes(type)}
export function childrenOf(node:Block):Block[]{return Array.isArray(node.data?.children)?node.data.children as Block[]:[]}
export function findNode(tree:Block[],id:string):Block|undefined{
 for(const node of tree){if(node.id===id)return node;const found=findNode(childrenOf(node),id);if(found)return found}
}
export function findParent(tree:Block[],id:string,parent:string|null=null):{parent:string|null;index:number}|null{for(let i=0;i<tree.length;i++){if(tree[i].id===id)return {parent,index:i};const found=findParent(childrenOf(tree[i]),id,tree[i].id);if(found)return found}return null}
export function normalize(tree:Block[]):Block[]{return tree.map((node,index)=>({...node,order:index,data:isLayout(node.type)?{...node.data,children:normalize(childrenOf(node))}:node.data}))}
export function insertNode(tree:Block[],node:Block,parentId:string|null,index?:number):Block[]{
 if(!parentId){const next=[...tree];next.splice(index===undefined?next.length:Math.max(0,Math.min(index,next.length)),0,node);return normalize(next)}
 return normalize(tree.map(item=>item.id===parentId&&isLayout(item.type)?{...item,data:{...item.data,children:insertNode(childrenOf(item),node,null,index)}}:isLayout(item.type)?{...item,data:{...item.data,children:insertNode(childrenOf(item),node,parentId,index)}}:item))
}
export function removeNode(tree:Block[],id:string):Block[]{
 return normalize(tree.filter(n=>n.id!==id).map(n=>isLayout(n.type)?{...n,data:{...n.data,children:removeNode(childrenOf(n),id)}}:n))
}
export function patchNode(tree:Block[],id:string,patch:Record<string,unknown>):Block[]{
 return normalize(tree.map(n=>n.id===id?{...n,data:{...n.data,...patch}}:isLayout(n.type)?{...n,data:{...n.data,children:patchNode(childrenOf(n),id,patch)}}:n))
}
export function moveNode(tree:Block[],id:string,parentId:string|null,index?:number):Block[]{
 const picked=findNode(tree,id);if(!picked)return tree;
 if(id===parentId||parentId&&findNode(childrenOf(picked),parentId))return tree;
 const without=removeNode(tree,id);
 if(parentId&&!findNode(without,parentId))return tree;
 const origin=findParent(tree,id);const adjusted=index!==undefined&&origin?.parent===parentId&&origin.index<index?index-1:index;
 return insertNode(without,picked,parentId,adjusted);
}
export function cloneNode(node:Block):Block{
 const copy=structuredClone(node);const renew=(n:Block):Block=>({...n,id:crypto.randomUUID(),data:isLayout(n.type)?{...n.data,children:childrenOf(n).map(renew)}:n.data});
 return renew(copy);
}
export function makeNode(type:string,defaults:Record<string,Record<string,unknown>>):Block{
 return {id:crypto.randomUUID(),type,order:0,data:structuredClone(defaults[type]||{})};
}
export function countNodes(tree:Block[]):number{return tree.reduce((total,n)=>total+1+countNodes(childrenOf(n)),0)}
