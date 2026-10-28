import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {hasRole,denied} from "@/lib/security";
export const dynamic="force-dynamic";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 if(!await hasRole("EDITOR"))return denied();
 const {id}=await params;
 const form=await prisma.form.findUnique({where:{id},select:{name:true,fields:true}});
 if(!form)return NextResponse.json({error:"Form not found"},{status:404});
 const items=await prisma.formSubmission.findMany({where:{formId:id},orderBy:{createdAt:"desc"},take:100,select:{id:true,data:true,createdAt:true}});
 return NextResponse.json({name:form.name,fields:JSON.parse(form.fields),submissions:items.map(x=>({id:x.id,values:JSON.parse(x.data),createdAt:x.createdAt}))},{headers:{"Cache-Control":"no-store"}});
}
