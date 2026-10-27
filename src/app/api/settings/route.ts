import {NextRequest,NextResponse} from "next/server";
import {hasRole,denied} from "@/lib/security";
import {prisma} from "@/lib/db";
import {z} from "zod";
import {revalidatePath} from "next/cache";
export async function GET(){if(!await hasRole("ADMIN"))return denied();const rows=await prisma.setting.findMany({where:{key:{in:["siteName","siteDescription"]}}});return NextResponse.json(Object.fromEntries(rows.map(s=>[s.key,s.value])))}
export async function PUT(req:NextRequest){if(!await hasRole("ADMIN"))return denied();const input=z.object({siteName:z.string().trim().min(2).max(100),siteDescription:z.string().max(300)}).safeParse(await req.json().catch(()=>null));if(!input.success)return NextResponse.json({error:"Invalid settings"},{status:400});await prisma.$transaction(Object.entries(input.data).map(([key,value])=>prisma.setting.upsert({where:{key},create:{key,value},update:{value}})));revalidatePath("/","layout");return NextResponse.json({ok:true})}
