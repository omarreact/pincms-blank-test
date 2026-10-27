import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {setupSchema} from "@/lib/validators";
import {hash} from "bcryptjs";
import {timingSafeEqual} from "node:crypto";
import {DEFAULT_THEME,NIGHT_THEME} from "@/lib/theme";
import {revalidatePath} from "next/cache";
import {localInstallerAllowed,sameOrigin} from "@/lib/installer-access";

export async function POST(req:NextRequest){
  if(!sameOrigin(req))return NextResponse.json({error:"Cross-origin installation requests are blocked"},{status:403});
  const local=localInstallerAllowed(req);
  const secret=process.env.PINCMS_SETUP_TOKEN;
  if(!local&&(!secret||secret.length<24||secret.startsWith("GENERATE_")||secret.includes("change-this"))){
    return NextResponse.json({error:"Configure a server-side setup token before remote installation."},{status:503});
  }
  const parsed=setupSchema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid fields",details:parsed.error.flatten()},{status:400});
  const {token,siteName,name,email,password,theme}=parsed.data;
  if(!local){
    const a=Buffer.from(token);const b=Buffer.from(secret!);
    if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Invalid setup token"},{status:403});
  }
  const passwordHash=await hash(password,12);
  try{
    await prisma.$transaction(async tx=>{
      if(await tx.user.count())throw new Error("ALREADY_SETUP");
      await tx.user.create({data:{name,email:email.toLowerCase(),password:passwordHash,role:"SUPER_ADMIN"}});
      await tx.setting.upsert({where:{key:"siteName"},update:{value:siteName},create:{key:"siteName",value:siteName}});
      const config=theme==="night"?NIGHT_THEME:DEFAULT_THEME;
      await tx.theme.upsert({where:{slug:"pincms-"+theme},
        update:{isActive:true,config:JSON.stringify(config)},
        create:{slug:"pincms-"+theme,name:config.name,version:config.version,config:JSON.stringify(config),isActive:true}});
    });
    revalidatePath("/","layout");
    return NextResponse.json({ok:true});
  }catch(error){
    if(error instanceof Error&&error.message==="ALREADY_SETUP")
      return NextResponse.json({error:"Setup already completed"},{status:409});
    return NextResponse.json({error:"Unable to initialize CMS"},{status:500});
  }
}
