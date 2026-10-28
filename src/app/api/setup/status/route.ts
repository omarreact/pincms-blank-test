import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {localInstallerAllowed} from "@/lib/installer-access";
import {databaseSchemaMissing} from "@/lib/database-status";
import {mediaSettingStatus} from "@/lib/installer-media";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const hosted=Boolean(process.env.VERCEL);
 const token=process.env.PINCMS_SETUP_TOKEN||"";
 const secret=process.env.NEXTAUTH_SECRET||"";
 const common={
  hosted,
  databaseProvider:hosted?"PostgreSQL":process.env.DATABASE_URL?.startsWith("postgres")?"PostgreSQL":"SQLite",
  localSetupAllowed:localInstallerAllowed(req),
  setupTokenConfigured:token.length>=24&&!token.startsWith("GENERATE_")&&!token.includes("change-this"),
  authConfigured:secret.length>=24&&!secret.startsWith("GENERATE_"),
  media:await mediaSettingStatus()
 };
 try{
  const users=await prisma.user.count();
  return NextResponse.json({...common,needed:users===0,databaseReady:true,databaseState:"connected"},
   {headers:{"Cache-Control":"no-store"}});
 }catch(error){
  return NextResponse.json({...common,needed:true,databaseReady:false,
   databaseState:databaseSchemaMissing(error)?"schema_missing":"connection_failed",
   message:databaseSchemaMissing(error)?"The database exists but its PinCMS tables are missing.":"The configured database could not be reached. Verify your connection and deployment environment."},
   {headers:{"Cache-Control":"no-store"}});
 }
}
