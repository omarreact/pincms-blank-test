import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
import {formDefinitionSchema} from "@/lib/forms";
export const dynamic="force-dynamic";
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 if(!await hasRole("EDITOR"))return denied();
 const {id}=await params;
 const parsed=formDefinitionSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid form",details:parsed.error.flatten()},{status:400});
 const data=parsed.data;
 try{
  await prisma.form.update({where:{id},data:{name:data.name,slug:data.slug,fields:JSON.stringify(data.fields),settings:JSON.stringify(data.settings)}});
  return NextResponse.json({ok:true});
 }catch(e){
  if(e&&typeof e==="object"&&"code" in e){
   const code=String((e as {code?:unknown}).code);
   if(code==="P2025")return NextResponse.json({error:"Form not found"},{status:404});
   if(code==="P2002")return NextResponse.json({error:"Form slug already used"},{status:409});
  }
  return NextResponse.json({error:"Unable to update form"},{status:500});
 }
}
