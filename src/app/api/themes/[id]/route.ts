import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
import {activateTheme} from "@/lib/theme";
import {themeSchema} from "@/lib/validators";
import {revalidatePath} from "next/cache";
type Ctx={params:Promise<{id:string}>};
export async function POST(_req:NextRequest,{params}:Ctx){if(!await hasRole("ADMIN"))return denied();try{await activateTheme((await params).id);return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"Theme not found"},{status:404})}}
export async function PUT(req:NextRequest,{params}:Ctx){if(!await hasRole("ADMIN"))return denied();const id=(await params).id;const parsed=themeSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid theme",details:parsed.error.flatten()},{status:400});const existing=await prisma.theme.findUnique({where:{id}});if(!existing)return NextResponse.json({error:"Not found"},{status:404});const updated=await prisma.theme.update({where:{id},data:{config:JSON.stringify(parsed.data)}});revalidatePath("/","layout");return NextResponse.json(updated)}
