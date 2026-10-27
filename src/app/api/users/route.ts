import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
import {hash} from "bcryptjs";
import {z} from "zod";
const input=z.object({name:z.string().min(2).max(100),email:z.string().email(),password:z.string().min(12).max(128),role:z.enum(["ADMIN","EDITOR","AUTHOR","CONTRIBUTOR"])});
export async function GET(){if(!await hasRole("ADMIN"))return denied();return NextResponse.json(await prisma.user.findMany({select:{id:true,name:true,email:true,role:true,createdAt:true},orderBy:{createdAt:"desc"}}));}
export async function POST(req:NextRequest){const actor=await hasRole("ADMIN");if(!actor)return denied();const parsed=input.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid user fields",details:parsed.error.flatten()},{status:400});if(parsed.data.role==="ADMIN"&&actor.role!=="SUPER_ADMIN")return NextResponse.json({error:"Only the site owner can create admins"},{status:403});try{const user=await prisma.user.create({data:{name:parsed.data.name,email:parsed.data.email.toLowerCase(),password:await hash(parsed.data.password,12),role:parsed.data.role}});return NextResponse.json({id:user.id,email:user.email,role:user.role},{status:201})}catch{return NextResponse.json({error:"Unable to create user; email may be in use"},{status:409})}}
