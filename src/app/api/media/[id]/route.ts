import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
type Ctx={params:Promise<{id:string}>};
export async function DELETE(_r:NextRequest,{params}:Ctx){if(!await hasRole("EDITOR"))return denied();const id=(await params).id;const existing=await prisma.media.findUnique({where:{id}});if(!existing)return NextResponse.json({error:"Not found"},{status:404});await prisma.media.delete({where:{id}});return NextResponse.json({ok:true,note:"Media reference deleted. Remote or local source file is not automatically removed."})}
