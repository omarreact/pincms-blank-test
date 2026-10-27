import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {denied,hasRole} from "@/lib/security";
import {postSchema,problem} from "@/lib/validators";
import {normalizedBlocks} from "@/lib/content";
import {revalidatePath} from "next/cache";
import {mirrorPageToFirestore} from "@/lib/firebase";
export async function GET(){if(!await hasRole())return denied();return NextResponse.json(await prisma.post.findMany({orderBy:{updatedAt:"desc"},select:{id:true,title:true,slug:true,status:true}}));}
export async function POST(req:NextRequest){const user=await hasRole("AUTHOR");if(!user)return denied();try{const d=postSchema.parse(await req.json());const post=await prisma.post.create({data:{title:d.title,slug:d.slug,excerpt:d.excerpt,seoTitle:d.seoTitle,seoDesc:d.seoDesc,ogImage:d.ogImage,status:d.status,publishedAt:d.status==="PUBLISHED"?new Date():d.status==="SCHEDULED"&&d.publishedAt?new Date(d.publishedAt):null,authorId:user.id,blocks:{create:normalizedBlocks(d.blocks)}}});try{await mirrorPageToFirestore({...post,slug:`blog/${post.slug}`},d.blocks)}catch(error){console.error("Optional Firebase mirror failed:",error)}revalidatePath("/blog");return NextResponse.json(post,{status:201});}catch(e){return NextResponse.json(problem(e),{status:400})}}
