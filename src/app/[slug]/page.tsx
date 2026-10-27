import type {Metadata} from "next";
import {notFound,redirect,permanentRedirect} from "next/navigation";
import {prisma} from "@/lib/db";
import {publishedPage,blockPayload} from "@/lib/content";
import {BlockRenderer} from "@/components/blocks/BlockRenderer";
export const dynamic="force-dynamic";
type Params={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Params):Promise<Metadata>{const {slug}=await params;const page=await publishedPage(slug);return {title:page?.seoTitle??page?.title,description:page?.seoDesc??page?.excerpt??undefined,openGraph:{images:page?.ogImage?[page.ogImage]:undefined}};}
export default async function PublicPage({params}:Params){const {slug}=await params;const page=await publishedPage(slug);if(!page){const r=await prisma.redirect.findUnique({where:{fromPath:`/${slug}`}});if(r){if(r.type===301)permanentRedirect(r.toPath);redirect(r.toPath)}notFound()}return <main><BlockRenderer blocks={blockPayload(page.blocks)}/></main>}
