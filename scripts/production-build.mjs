#!/usr/bin/env node
/**
 * PinCMS build gate.
 * Local dev keeps SQLite; Vercel uses the checked-in PostgreSQL schema.
 * PINCMS_AUTO_DB_PUSH=1 bootstraps a fresh test database without reset or
 * accepting data-loss changes. Disable it after the first successful launch.
 */
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import path from "node:path";
import fs from "node:fs";

const root=process.cwd();
const requireFromRoot=createRequire(path.join(root,"package.json"));
function run(name,args){
  const metaPath=requireFromRoot.resolve(name+"/package.json");
  const metadata=JSON.parse(fs.readFileSync(metaPath,"utf8"));
  const bin=typeof metadata.bin==="string"?metadata.bin:metadata.bin?.[name];
  if(!bin)throw new Error("Unable to find CLI for "+name);
  const exec=path.resolve(path.dirname(metaPath),bin);
  const result=spawnSync(process.execPath,[exec,...args],{cwd:root,env:process.env,stdio:"inherit",shell:false});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(name+" exited with status "+result.status);
}
try {
  if(process.env.VERCEL){
    const url=process.env.DATABASE_URL||"";
    if(!/^postgres(?:ql)?:\/\//.test(url))
      throw new Error("Hosted PinCMS requires a PostgreSQL DATABASE_URL in Vercel environment settings.");
    const schema="prisma/schema.postgres.prisma";
    console.log("[PinCMS] Generating PostgreSQL Prisma Client.");
    run("prisma",["generate","--schema",schema]);
    if(process.env.PINCMS_AUTO_DB_PUSH==="1"){
      console.log("[PinCMS] Initializing PostgreSQL schema (no reset or accept-data-loss flags).");
      run("prisma",["db","push","--schema",schema,"--skip-generate"]);
      console.log("[PinCMS] Database schema initialization completed.");
    }
  }
  run("next",["build"]);
} catch(error){
  console.error("[PinCMS build] "+(error instanceof Error?error.message:"Build failed."));
  process.exitCode=1;
}
