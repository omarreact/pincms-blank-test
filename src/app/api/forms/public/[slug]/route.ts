import {NextRequest,NextResponse} from "next/server";
import {createHmac} from "node:crypto";
import {prisma} from "@/lib/db";
import {formFieldSchema,validateFormValues} from "@/lib/forms";
import {z} from "zod";
export const dynamic="force-dynamic";
type Context={params:Promise<{slug:string}>};
async function readForm(slug:string){
 const form=await prisma.form.findUnique({where:{slug},select:{id:true,name:true,fields:true,settings:true}});
 if(!form)return null;
 try{
  const fields=z.array(formFieldSchema).min(1).max(30).parse(JSON.parse(form.fields));
  const settings=JSON.parse(form.settings||"{}") as Record<string,unknown>;
  if(settings.enabled===false)return null;
  return {...form,fields,settings};
 }catch{return null}
}
export async function GET(_req:NextRequest,{params}:Context){
 const {slug}=await params;
 const form=await readForm(slug);
 if(!form)return NextResponse.json({error:"Form not found"},{status:404});
 return NextResponse.json({name:form.name,fields:form.fields,buttonLabel:String(form.settings.buttonLabel||"Submit").slice(0,80)},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest,{params}:Context){
 const {slug}=await params;
 // Forms are for the same website: block cross-origin spam and protect JSON-only endpoint.
 const origin=req.headers.get("origin");
 if(!origin||origin!==req.nextUrl.origin)return NextResponse.json({error:"Cross-origin requests are blocked"},{status:403});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({error:"JSON required"},{status:415});
 const body=await req.text();
 if(body.length>16000)return NextResponse.json({error:"Submission exceeds size limit"},{status:413});
 let input:unknown;
 try{input=JSON.parse(body)}catch{return NextResponse.json({error:"Invalid JSON"},{status:400})}
 if(!input||typeof input!=="object"||Array.isArray(input))return NextResponse.json({error:"Invalid submission"},{status:400});
 const payload=input as Record<string,unknown>;
 if(payload.website)return NextResponse.json({ok:true});
 const form=await readForm(slug);
 if(!form)return NextResponse.json({error:"Form unavailable"},{status:404});
 const parsed=validateFormValues(form.fields,payload.values);
 if("error" in parsed)return NextResponse.json({error:parsed.error},{status:400});
 const secret=process.env.NEXTAUTH_SECRET||"";
 const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0,64)||"";
 const fingerprint=secret.length>=24&&ip?createHmac("sha256",secret).update(ip).digest("hex"):null;
 if(fingerprint){
  const recent=await prisma.formSubmission.count({where:{formId:form.id,ip:fingerprint,createdAt:{gte:new Date(Date.now()-600000)}}});
  if(recent>=5)return NextResponse.json({error:"Too many submissions. Please try later."},{status:429});
 }
 await prisma.formSubmission.create({data:{formId:form.id,data:JSON.stringify(parsed.values),ip:fingerprint}});
 return NextResponse.json({ok:true,message:String(form.settings.successMessage||"Thank you. Your message has been received.").slice(0,300)},{headers:{"Cache-Control":"no-store"}});
}
