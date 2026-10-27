import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
export async function GET(){try{await prisma.user.count();return NextResponse.json({status:"ok",database:"connected",version:"1.0.0"})}catch{return NextResponse.json({status:"unhealthy",database:"unavailable"},{status:503})}}
