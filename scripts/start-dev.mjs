#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import {spawn} from "node:child_process";
import {bootstrapLocal} from "./local-bootstrap.mjs";

try{
  bootstrapLocal();
  const root=process.cwd();
  const requireFromRoot=createRequire(path.join(root,"package.json"));
  const metaPath=requireFromRoot.resolve("next/package.json");
  const meta=JSON.parse(fs.readFileSync(metaPath,"utf8"));
  const bin=path.resolve(path.dirname(metaPath),typeof meta.bin==="string"?meta.bin:meta.bin.next);
  const next=spawn(process.execPath,[bin,"dev","--hostname","127.0.0.1",...process.argv.slice(2)],{
    cwd:root,env:process.env,stdio:"inherit",shell:false
  });
  next.on("error",error=>{console.error("[PinCMS] Failed to launch Next.js:",error.message);process.exitCode=1;});
  next.on("exit",(code,signal)=>{process.exitCode=code??(signal?1:0);});
  for(const signal of ["SIGINT","SIGTERM"])process.on(signal,()=>next.kill(signal));
}catch(error){
  console.error("[PinCMS] Local startup failed:",error instanceof Error?error.message:String(error));
  process.exitCode=1;
}
