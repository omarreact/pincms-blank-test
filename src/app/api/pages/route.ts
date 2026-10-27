import { NextRequest,NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
import {pageSchema,problem} from "@/lib/validators";
import {savePage} from "@/lib/content";
export async function GET(){if(!await hasRole("CONTRIBUTOR"))return denied();const data=await prisma.page.findMany({select:{id:true,title:true,slug:true,status:true,updatedAt:true},orderBy:{updatedAt:"desc"}});return NextResponse.json(data);}
export async function POST(req:NextRequest){const user=await hasRole("AUTHOR");if(!user)return denied();try {const data=pageSchema.parse(await req.json());const page=await savePage(data,undefined,user.id);return NextResponse.json(page,{status:201});}catch(err){return NextResponse.json(problem(err),{status:400});}}
