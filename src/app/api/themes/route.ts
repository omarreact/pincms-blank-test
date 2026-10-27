import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
import {importThemeFromJson} from "@/lib/theme";
export async function GET(){if(!await hasRole())return denied();return NextResponse.json(await prisma.theme.findMany({orderBy:{createdAt:"desc"}}));}
export async function POST(req:NextRequest){if(!await hasRole("ADMIN"))return denied();try{const input=await req.text();const theme=await importThemeFromJson(input);return NextResponse.json(theme,{status:201})}catch{return NextResponse.json({error:"Theme must be a valid PinCMS JSON theme (max 100 KB)"},{status:400})}}
