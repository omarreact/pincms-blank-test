import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {databaseSchemaMissing} from "@/lib/database-status";
import {localInstallerAllowed} from "@/lib/installer-access";
export async function GET(req:NextRequest){
  try{
    return NextResponse.json({needed:(await prisma.user.count())===0,databaseReady:true,localSetupAllowed:localInstallerAllowed(req)});
  }catch(error){
    if(databaseSchemaMissing(error))return NextResponse.json({
      needed:true,databaseReady:false,localSetupAllowed:false,
      error:"Database schema is not initialized. Check the startup terminal output."
    },{status:503});
    return NextResponse.json({error:"Database unavailable. Check the startup terminal output."},{status:503});
  }
}
