import {prisma} from "@/lib/db";
import {BlockRenderer} from "@/components/blocks/BlockRenderer";
import {blockPayload} from "@/lib/content";
import {notFound,permanentRedirect,redirect} from "next/navigation";
import type {Metadata} from "next";
type Params={params:Promise<{slug:string}>};
async function getPost(slug:string){return prisma.post.findFirst({where:{slug,status:"PUBLISHED",OR:[{publishedAt:null},{publishedAt:{lte:new Date()}}]},include:{blocks:true}})}
export async function generateMetadata({params}:Params):Promise<Metadata>{const p=await getPost((await params).slug);return {title:p?.seoTitle??p?.title,description:p?.seoDesc??p?.excerpt??undefined}}
export default async function BlogPost({params}:Params){const slug=(await params).slug;const post=await getPost(slug);
 if(!post){const entry=await prisma.redirect.findUnique({where:{fromPath:`/blog/${slug}`}});if(entry){if(entry.type===301)permanentRedirect(entry.toPath);redirect(entry.toPath)}notFound();}return <main><header className="mx-auto max-w-6xl px-6 py-16"><p className="text-sm font-bold uppercase tracking-wider text-[var(--site-primary)]">Article</p><h1 className="mt-4 max-w-4xl text-5xl font-black">{post.title}</h1><p className="mt-4 text-xl opacity-70">{post.excerpt}</p></header><BlockRenderer blocks={blockPayload(post.blocks)}/></main>}
