import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {denied,hasRole} from "@/lib/security";
import {postSchema,problem} from "@/lib/validators";
import {normalizedBlocks,updatedBlocks,blockPayload} from "@/lib/content";
import {revalidatePath} from "next/cache";
import {mirrorPageToFirestore} from "@/lib/firebase";
type Ctx={params:Promise<{id:string}>};
export async function GET(_r:NextRequest,{params}:Ctx){if(!await hasRole())return denied();const p=await prisma.post.findUnique({where:{id:(await params).id},include:{blocks:true}});return p?NextResponse.json({...p,blocks:blockPayload(p.blocks)}):NextResponse.json({error:"Not found"},{status:404});}
export async function PUT(req:NextRequest,{params}:Ctx){const user=await hasRole("AUTHOR");if(!user)return denied();const id=(await params).id;const old=await prisma.post.findUnique({where:{id}});if(!old)return NextResponse.json({error:"Not found"},{status:404});if(user.role==="AUTHOR"&&old.authorId!==user.id)return NextResponse.json({error:"Forbidden"},{status:403});try{const d=postSchema.parse(await req.json());const post=await prisma.post.update({where:{id},data:{title:d.title,slug:d.slug,excerpt:d.excerpt,seoTitle:d.seoTitle,seoDesc:d.seoDesc,ogImage:d.ogImage,status:d.status,publishedAt:d.status==="PUBLISHED"?old.publishedAt??new Date():d.status==="SCHEDULED"&&d.publishedAt?new Date(d.publishedAt):null,blocks:updatedBlocks(d.blocks)}});try{await mirrorPageToFirestore({...post,slug:`blog/${post.slug}`},d.blocks)}catch(error){console.error("Optional Firebase mirror failed:",error)}revalidatePath("/blog");revalidatePath("/blog/"+old.slug);revalidatePath("/blog/"+d.slug);return NextResponse.json(post)}catch(e){return NextResponse.json(problem(e),{status:400})}}
export async function DELETE(_r:NextRequest,{params}:Ctx){if(!await hasRole("EDITOR"))return denied();const id=(await params).id;const old=await prisma.post.findUnique({where:{id}});if(!old)return NextResponse.json({error:"Not found"},{status:404});await prisma.post.delete({where:{id}});revalidatePath("/blog");revalidatePath("/blog/"+old.slug);return NextResponse.json({ok:true})}
