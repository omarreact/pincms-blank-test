import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {setupSchema} from "@/lib/validators";
import {hash} from "bcryptjs";
import {DEFAULT_THEME,NIGHT_THEME} from "@/lib/theme";
import {revalidatePath} from "next/cache";
import {installationGuard} from "@/lib/setup-guard";
import {environmentCloudinary,storedMediaValue,verifyCloudinary} from "@/lib/installer-media";

export const runtime="nodejs";
export async function POST(req:NextRequest){
 const parsed=setupSchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Please correct the highlighted installation fields.",details:parsed.error.flatten()},{status:400});
 const {token,siteName,name,email,password,theme,media}=parsed.data;
 const denied=installationGuard(req,token);
 if(denied)return denied;
 try {
  if(await prisma.user.count())return NextResponse.json({error:"This PinCMS installation already has an administrator."},{status:409});
 }catch{return NextResponse.json({error:"The database is not ready. Complete database configuration before creating an administrator."},{status:503})}
 if(process.env.VERCEL&&media.mode==="local")return NextResponse.json({error:"Vercel uploads need durable cloud storage. Choose Cloudinary or configure it later."},{status:400});
 if(media.mode==="existing"&&!environmentCloudinary())return NextResponse.json({error:"No Cloudinary environment credentials are configured."},{status:400});
 if(media.mode==="cloudinary"){
  const test=await verifyCloudinary(media.credentials);
  if(!test.ok)return NextResponse.json({error:test.message},{status:422});
 }
 if(!process.env.NEXTAUTH_SECRET||process.env.NEXTAUTH_SECRET.length<24)return NextResponse.json({error:"NEXTAUTH_SECRET must be configured before installation."},{status:503});
 let encrypted:string|null;
 try{encrypted=storedMediaValue(media)}catch{return NextResponse.json({error:"Unable to encrypt media credentials. Check your authentication secret."},{status:503})}
 const passwordHash=await hash(password,12);
 try{
  await prisma.$transaction(async tx=>{
   if(await tx.user.count())throw new Error("ALREADY_SETUP");
   await tx.user.create({data:{name,email:email.toLowerCase(),password:passwordHash,role:"SUPER_ADMIN"}});
   await tx.setting.upsert({where:{key:"siteName"},update:{value:siteName},create:{key:"siteName",value:siteName}});
   if(encrypted!==null)await tx.setting.upsert({where:{key:"storage:media:v1"},update:{value:encrypted},create:{key:"storage:media:v1",value:encrypted}});
   const config=theme==="night"?NIGHT_THEME:DEFAULT_THEME;
   await tx.theme.updateMany({data:{isActive:false}});
   await tx.theme.upsert({where:{slug:"pincms-"+theme},
    update:{isActive:true,config:JSON.stringify(config)},
    create:{slug:"pincms-"+theme,name:config.name,version:config.version,config:JSON.stringify(config),isActive:true}});
  });
  revalidatePath("/","layout");
  return NextResponse.json({ok:true,redirectTo:"/admin/login"});
 }catch(error){
  if(error instanceof Error&&error.message==="ALREADY_SETUP")return NextResponse.json({error:"Installation already completed."},{status:409});
  return NextResponse.json({error:"Could not finish installation. Check database permissions and retry."},{status:500});
 }
}
