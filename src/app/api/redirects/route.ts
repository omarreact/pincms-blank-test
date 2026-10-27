import {NextRequest,NextResponse} from "next/server";
import {hasRole,denied,safeHref} from "@/lib/security";
import {prisma} from "@/lib/db";
import {z} from "zod";
const validator=z.object({fromPath:z.string().startsWith("/").max(200),toPath:z.string().min(1).max(500),type:z.union([z.literal(301),z.literal(302)]).default(301)});
export async function GET(){if(!await hasRole("ADMIN"))return denied();return NextResponse.json(await prisma.redirect.findMany({orderBy:{createdAt:"desc"}}))}
export async function POST(req:NextRequest){if(!await hasRole("ADMIN"))return denied();const p=validator.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Invalid redirect"},{status:400});if(p.data.fromPath.includes("//")||p.data.fromPath.startsWith("/admin")||p.data.fromPath.startsWith("/api")||safeHref(p.data.toPath,"")!==p.data.toPath||p.data.fromPath===p.data.toPath)return NextResponse.json({error:"Unsafe redirect"},{status:400});const r=await prisma.redirect.upsert({where:{fromPath:p.data.fromPath},update:{toPath:p.data.toPath,type:p.data.type},create:p.data});return NextResponse.json(r)}
