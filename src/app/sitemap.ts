import type {MetadataRoute} from "next";
import {prisma} from "@/lib/db";
// Metadata routes are otherwise prerendered at build time, before a database exists.
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXTAUTH_URL||"http://localhost:3000";const [pages,posts]=await Promise.all([prisma.page.findMany({where:{status:"PUBLISHED",OR:[{publishedAt:null},{publishedAt:{lte:new Date()}}]},select:{slug:true,updatedAt:true}}),prisma.post.findMany({where:{status:"PUBLISHED"},select:{slug:true,updatedAt:true}})]);return [{url:base,lastModified:new Date()},{url:`${base}/blog`,lastModified:new Date()},...pages.map(p=>({url:`${base}/${p.slug}`,lastModified:p.updatedAt})),...posts.map(p=>({url:`${base}/blog/${p.slug}`,lastModified:p.updatedAt}))]}
