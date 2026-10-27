import {PageEditor} from "@/components/editor/PageEditor";
import {prisma} from "@/lib/db";
import {blockPayload} from "@/lib/content";
import {notFound} from "next/navigation";
export default async function EditPost({params}:{params:Promise<{id:string}>}){const {id}=await params;const post=await prisma.post.findUnique({where:{id},include:{blocks:true}});if(!post)notFound();return <PageEditor kind="post" id={id} initial={{title:post.title,slug:post.slug,status:post.status,excerpt:post.excerpt??"",seoTitle:post.seoTitle??"",seoDesc:post.seoDesc??"",ogImage:post.ogImage??"",publishedAt:post.status==="SCHEDULED"?post.publishedAt?.toISOString().slice(0,16)??"":"",blocks:blockPayload(post.blocks)}}/>}
