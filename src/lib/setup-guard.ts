import {timingSafeEqual} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {localInstallerAllowed,sameOrigin} from "@/lib/installer-access";

/** Only a same-origin request with the private installation token may create the first administrator or test media credentials. */
export function installationGuard(req:NextRequest,provided:string):NextResponse|null{
 if(!sameOrigin(req))return NextResponse.json({error:"Installation request origin rejected."},{status:403});
 if(localInstallerAllowed(req))return null;
 const configured=process.env.PINCMS_SETUP_TOKEN;
 if(!configured||configured.length<24||configured.startsWith("GENERATE_")||configured.includes("change-this")){
  return NextResponse.json({error:"Set PINCMS_SETUP_TOKEN in your hosting environment first."},{status:503});
 }
 const a=Buffer.from(provided),b=Buffer.from(configured);
 if(a.length!==b.length||!timingSafeEqual(a,b)){
  return NextResponse.json({error:"Incorrect installation token."},{status:403});
 }
 return null;
}
