import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
import {formDefinitionSchema} from "@/lib/forms";
export const dynamic="force-dynamic";
export async function GET(){
 if(!await hasRole("EDITOR"))return denied();
 const forms=await prisma.form.findMany({orderBy:{updatedAt:"desc"},include:{_count:{select:{submissions:true}}}});
 return NextResponse.json(forms.map(f=>({id:f.id,name:f.name,slug:f.slug,fields:JSON.parse(f.fields),settings:JSON.parse(f.settings||"{}"),submissions:f._count.submissions})),{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest){
 if(!await hasRole("EDITOR"))return denied();
 const parsed=formDefinitionSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid form",details:parsed.error.flatten()},{status:400});
 try{
  const data=parsed.data;
  const form=await prisma.form.create({data:{name:data.name,slug:data.slug,fields:JSON.stringify(data.fields),settings:JSON.stringify(data.settings)}});
  return NextResponse.json({id:form.id},{status:201});
 }catch(e){
  if(e&&typeof e==="object"&&"code" in e&&(e as {code?:string}).code==="P2002")
   return NextResponse.json({error:"A form with this slug already exists"},{status:409});
  return NextResponse.json({error:"Unable to create form"},{status:500});
 }
}
