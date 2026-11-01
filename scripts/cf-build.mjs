#!/usr/bin/env node
/**
 * Builds a full-stack Cloudflare Worker from the existing Next.js CMS.
 * Never reads, copies, migrates, or prints a production database secret.
 * Real Worker credentials are injected only at runtime as encrypted bindings.
 */
import {spawnSync} from "node:child_process";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import path from "node:path";
const root=process.cwd();
const resolver=createRequire(path.join(root,"package.json"));
const env={
  ...process.env,
  PINCMS_RUNTIME:"cloudflare",
  // Prisma generate and Next.js bundling only: NOT a runtime credential.
  DATABASE_URL:process.env.DATABASE_URL||
    "postgresql://unconfigured:unconfigured@127.0.0.1:5432/unconfigured",
  // Never allow builds to modify an installed database.
  PINCMS_AUTO_DB_PUSH:"0"
};
function run(pkg,args,binName){
  const metaPath=resolver.resolve(pkg+"/package.json");
  const meta=JSON.parse(readFileSync(metaPath,"utf8"));
  const bin=typeof meta.bin==="string"?meta.bin:meta.bin?.[binName||pkg];
  if(!bin)throw new Error("Missing executable for "+pkg);
  const cli=path.resolve(path.dirname(metaPath),bin);
  const result=spawnSync(process.execPath,[cli,...args],{cwd:root,stdio:"inherit",env,shell:false});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(pkg+" exited with status "+result.status);
}
try{
  run("prisma",["generate","--schema","prisma/schema.cloudflare.prisma"]);
  // OpenNext package exports its API from a generated entry; do not resolve a
  // fabricated /package.json path. Execute the installed CLI directly.
  const command=process.platform==="win32"?"npx.cmd":"npx";
  const build=spawnSync(command,["--no-install","opennextjs-cloudflare","build"],{
    cwd:root,stdio:"inherit",env,shell:false
  });
  if(build.error)throw build.error;
  if(build.status!==0)throw new Error("OpenNext exited with status "+build.status);
}catch(error){
  console.error("[PinCMS Cloudflare build] "+(error instanceof Error?error.message:"Failed"));
  process.exitCode=1;
}
