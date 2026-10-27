import {PrismaClient} from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
const DEFAULT_THEME=JSON.parse(fs.readFileSync(path.join(process.cwd(),"themes/standalone.json"),"utf8"));
const prisma=new PrismaClient();
async function main(){
  if((await prisma.user.count())===0)console.log("No users installed. Visit /admin/setup (no default credentials are created).");
  await prisma.theme.upsert({where:{slug:"pincms-default"},create:{slug:"pincms-default",name:DEFAULT_THEME.name,version:DEFAULT_THEME.version,isActive:(await prisma.theme.count())===0,config:JSON.stringify(DEFAULT_THEME)},update:{}});
  console.log("PinCMS base theme prepared. No demo users or unsafe passwords created.");
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
