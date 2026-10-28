import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {installationGuard} from "@/lib/setup-guard";
import {cloudinaryCredentialsSchema} from "@/lib/validators";
import {verifyCloudinary} from "@/lib/installer-media";

export const runtime="nodejs";
export async function POST(req:NextRequest){
 const body=await req.json().catch(()=>null);
 const token=typeof body?.token==="string"?body.token:"";
 const denied=installationGuard(req,token);if(denied)return denied;
 try{if(await prisma.user.count())return NextResponse.json({error:"This installation has already been completed."},{status:409})}
 catch{return NextResponse.json({error:"Connect and initialize the database first."},{status:503})}
 const credentials=cloudinaryCredentialsSchema.safeParse(body?.credentials);
 if(!credentials.success)return NextResponse.json({error:"Enter a valid Cloudinary cloud name, numeric API key, and API secret."},{status:400});
 const result=await verifyCloudinary(credentials.data);
 return NextResponse.json(result,{status:result.ok?200:422,headers:{"Cache-Control":"no-store"}});
}
