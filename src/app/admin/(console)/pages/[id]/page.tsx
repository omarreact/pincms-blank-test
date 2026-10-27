import {prisma} from "@/lib/db";
import {blockPayload} from "@/lib/content";
import {PageEditor} from "@/components/editor/PageEditor";
import {notFound} from "next/navigation";
export default async function EditPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const page=await prisma.page.findUnique({where:{id},include:{blocks:true}});if(!page)notFound();return <PageEditor id={id} initial={{title:page.title,slug:page.slug,status:page.status,excerpt:page.excerpt??"",seoTitle:page.seoTitle??"",seoDesc:page.seoDesc??"",ogImage:page.ogImage??"",publishedAt:page.status==="SCHEDULED"?page.publishedAt?.toISOString().slice(0,16)??"":"",blocks:blockPayload(page.blocks)}}/>}
