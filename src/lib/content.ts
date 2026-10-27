import { prisma } from "@/lib/db";
import type { z } from "zod";
import {pageSchema} from "@/lib/validators";
import {revalidatePath} from "next/cache";
import {mirrorPageToFirestore} from "@/lib/firebase";
import {randomUUID} from "node:crypto";
export type PageInput=z.infer<typeof pageSchema>;
export function normalizedBlocks(blocks: PageInput["blocks"]) {
 return blocks.map((b,i)=>({id:b.id||randomUUID(),type:b.type,data:JSON.stringify(b.data),order:i}));
}
/** Preserve stable IDs while updating/reordering; remove only deleted blocks. */
export function updatedBlocks(blocks:PageInput["blocks"]){
 const next=normalizedBlocks(blocks);
 return {
  deleteMany:{id:{notIn:next.map(b=>b.id)}},
  upsert:next.map(b=>({where:{id:b.id},update:{type:b.type,data:b.data,order:b.order},create:b}))
 };
}
export async function savePage(input:PageInput,id?:string,authorId?:string) {
  const old=id?await prisma.page.findUnique({where:{id},select:{publishedAt:true}}):null;
  const data={title:input.title,slug:input.slug,status:input.status,excerpt:input.excerpt??null,seoTitle:input.seoTitle??null,seoDesc:input.seoDesc??null,ogImage:input.ogImage??null,parentId:input.parentId??null,publishedAt:input.status==="PUBLISHED"?(old?.publishedAt??new Date()):input.status==="SCHEDULED"&&input.publishedAt?new Date(input.publishedAt):null};
  const page = id ? await prisma.page.update({where:{id},data:{...data,blocks:updatedBlocks(input.blocks)}}) : await prisma.page.create({data:{...data,authorId,blocks:{create:normalizedBlocks(input.blocks)}}});
  try { await mirrorPageToFirestore(page,input.blocks); } catch(error) { console.error("Optional Firebase mirror failed:",error); }
  revalidatePath("/");revalidatePath("/"+page.slug);if(id)revalidatePath("/admin/pages/"+id);
  return page;
}
export async function publishedPage(slug:string) {
  return prisma.page.findFirst({where:{slug,status:"PUBLISHED",OR:[{publishedAt:null},{publishedAt:{lte:new Date()}}]},include:{blocks:{orderBy:{order:"asc"}}}});
}
export function blockPayload(blocks:{id:string;type:string;data:string;order:number}[]) {return blocks.map(b=>({id:b.id,type:b.type,data:JSON.parse(b.data),order:b.order}));}
