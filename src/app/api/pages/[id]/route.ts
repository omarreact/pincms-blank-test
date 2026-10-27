import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {denied,hasRole} from "@/lib/security";
import {pageSchema,problem} from "@/lib/validators";
import {savePage,blockPayload} from "@/lib/content";
import {revalidatePath} from "next/cache";
type Context={params:Promise<{id:string}>};
export async function GET(_req:NextRequest,{params}:Context){if(!await hasRole())return denied();const {id}=await params;const page=await prisma.page.findUnique({where:{id},include:{blocks:{orderBy:{order:"asc"}}}});if(!page)return NextResponse.json({error:"Not found"},{status:404});return NextResponse.json({...page,blocks:blockPayload(page.blocks)});}
export async function PUT(req:NextRequest,{params}:Context){const user=await hasRole("AUTHOR");if(!user)return denied();const {id}=await params;const old=await prisma.page.findUnique({where:{id}});if(!old)return NextResponse.json({error:"Not found"},{status:404});if(user.role==="AUTHOR"&&old.authorId!==user.id)return NextResponse.json({error:"Forbidden"},{status:403});try{const data=pageSchema.parse(await req.json());if(data.slug!==old.slug&&await prisma.page.findUnique({where:{slug:data.slug}}))return NextResponse.json({error:"Slug is taken"},{status:409});const saved=await savePage(data,id); if(old.slug!==data.slug)revalidatePath("/"+old.slug);return NextResponse.json(saved);}catch(error){return NextResponse.json(problem(error),{status:400});}}
export async function DELETE(_req:NextRequest,{params}:Context){const user=await hasRole("EDITOR");if(!user)return denied();const {id}=await params;const old=await prisma.page.findUnique({where:{id}});if(!old)return NextResponse.json({error:"Not found"},{status:404});await prisma.page.delete({where:{id}});revalidatePath("/");revalidatePath("/"+old.slug);return NextResponse.json({ok:true});}
