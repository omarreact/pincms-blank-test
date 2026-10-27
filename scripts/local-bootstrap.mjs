#!/usr/bin/env node
/**
 * PinCMS local-only bootstrap. Never runs automatically on Vercel or production.
 * Preserves existing configuration and SQLite data; never accepts data loss.
 */
import fs from "node:fs";
import path from "node:path";
import {randomBytes} from "node:crypto";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";

const project=process.cwd();
const environmentFile=path.join(project,".env.local");
const exampleFile=path.join(project,".env.example");
const schemaFile=path.join(project,"prisma","schema.prisma");
const secret=()=>randomBytes(32).toString("hex");
const parseValue=(source,key)=>{
  const match=source.match(new RegExp("^\\s*"+key+"\\s*=\\s*(.*)$","m"));
  return match ? match[1].trim().replace(/^["']|["']$/g,"") : "";
};
const placeholder=(value)=>!value || value.startsWith("GENERATE_") || value.startsWith("change-this");
const assign=(source,key,value)=>{
  const expression=new RegExp("^\\s*"+key+"\\s*=.*$","m");
  const line=key+"="+JSON.stringify(value);
  return expression.test(source) ? source.replace(expression,line) : source.replace(/\s*$/,"")+"\n"+line+"\n";
};
function cliBin(name){
  const requireFromProject=createRequire(path.join(project,"package.json"));
  const metaFile=requireFromProject.resolve(name+"/package.json");
  const meta=JSON.parse(fs.readFileSync(metaFile,"utf8"));
  const relative=typeof meta.bin==="string" ? meta.bin : meta.bin?.[name];
  if(!relative)throw new Error("Missing executable for "+name+". Run npm install.");
  return path.resolve(path.dirname(metaFile),relative);
}
function assertLocalFile(databaseUrl){
  if(!databaseUrl.startsWith("file:./"))throw new Error("Automatic SQLite setup requires a relative file:./ path.");
  const dbFile=path.resolve(path.dirname(schemaFile),databaseUrl.slice(5));
  if(!dbFile.startsWith(project+path.sep))throw new Error("Database file must be inside the PinCMS directory.");
}
export function bootstrapLocal(){
  if(process.env.NODE_ENV==="production" || process.env.VERCEL){
    throw new Error("Automatic local setup is disabled on hosted/production environments.");
  }
  if(!fs.existsSync(schemaFile) || !fs.existsSync(path.join(project,"package.json"))){
    throw new Error("Run npm run dev from the root of the PinCMS application.");
  }
  const existing=fs.existsSync(environmentFile);
  let content=existing?fs.readFileSync(environmentFile,"utf8"):
    (fs.existsSync(exampleFile)?fs.readFileSync(exampleFile,"utf8"):"");
  const generated=[];
  const defaults={DATABASE_URL:"file:./dev.db",NEXTAUTH_URL:"http://localhost:3000",UPLOAD_DIR:"./public/uploads"};
  for(const [key,value] of Object.entries(defaults)){
    if(!parseValue(content,key)){content=assign(content,key,value);}
  }
  for(const key of ["NEXTAUTH_SECRET","PINCMS_SETUP_TOKEN"]){
    const current=parseValue(content,key);
    if(placeholder(current)){content=assign(content,key,secret());generated.push(key);}
    else if(current.length<24){throw new Error(key+" is too short. Configure at least 24 random characters.");}
  }
  const former=existing?fs.readFileSync(environmentFile,"utf8"):null;
  if(former!==content){
    const temporary=environmentFile+".tmp-"+process.pid;
    fs.writeFileSync(temporary,content,{mode:0o600,flag:"wx"});
    fs.renameSync(temporary,environmentFile);
    try{fs.chmodSync(environmentFile,0o600);}catch{}
  }
  if(generated.length)console.log("[PinCMS] Generated missing private configuration values; they are not printed.");
  const dbUrl=process.env.DATABASE_URL||parseValue(content,"DATABASE_URL");
  const schema=fs.readFileSync(schemaFile,"utf8");
  if(!/provider\s*=\s*"sqlite"/.test(schema) || !dbUrl.startsWith("file:")){
    console.log("[PinCMS] External/non-SQLite database detected. Automatic schema changes skipped.");
    return;
  }
  assertLocalFile(dbUrl);
  console.log("[PinCMS] Checking local SQLite schema (non-destructive Prisma db push)...");
  const result=spawnSync(process.execPath,[cliBin("prisma"),"db","push"],{
    cwd:project,env:{...process.env,DATABASE_URL:dbUrl},stdio:"inherit",shell:false
  });
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error("SQLite initialization failed; existing data was not reset.");
  console.log("[PinCMS] Local database ready. Open http://localhost:3000/admin/setup if this is a new installation.");
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{bootstrapLocal();}catch(error){console.error("[PinCMS] "+error.message);process.exitCode=1;}
}
