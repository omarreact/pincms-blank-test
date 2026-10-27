import {NextRequest,NextResponse} from "next/server";
import {hasRole,denied} from "@/lib/security";
import {prisma} from "@/lib/db";
export async function DELETE(_req:NextRequest,{params}:{params:Promise<{id:string}>}){if(!await hasRole("ADMIN"))return denied();await prisma.redirect.deleteMany({where:{id:(await params).id}});return NextResponse.json({ok:true})}
