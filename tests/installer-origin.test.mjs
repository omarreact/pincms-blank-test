import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import ts from "typescript";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const pathToSource=path.join(root,"src/lib/installer-access.ts");
// The module imports only a TypeScript type, so transpile it to test the real
// implementation with Node 22 and Node 24 without a Next.js server.
const source=fs.readFileSync(pathToSource,"utf8");
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {sameOrigin,localInstallerAllowed}=await import("data:text/javascript;base64,"+Buffer.from(js).toString("base64"));

function request(host,origin,canonical="http://localhost:3000/api/setup") {
 return {headers:{get(name){const map={host,origin};return map[name.toLowerCase()]??null;}},nextUrl:new URL(canonical)};
}
function inEnvironment(mode,fn){
 const before={mode:process.env.NODE_ENV,vercel:process.env.VERCEL};
 try {
  process.env.NODE_ENV=mode;delete process.env.VERCEL;
  fn();
 }finally{
  if(before.mode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=before.mode;
  if(before.vercel===undefined)delete process.env.VERCEL;else process.env.VERCEL=before.vercel;
 }
}
test("installer accepts 127.0.0.1 Host + Origin even when NextURL reconstructs localhost",()=>{
 inEnvironment("development",()=>{
  const req=request("127.0.0.1:3000","http://127.0.0.1:3000");
  assert.equal(req.nextUrl.origin,"http://localhost:3000");
  assert.equal(localInstallerAllowed(req),true);
  assert.equal(sameOrigin(req),true);
 });
});
test("installer accepts matching localhost and matching custom local ports",()=>{
 inEnvironment("development",()=>{
  assert.equal(sameOrigin(request("localhost:3000","http://localhost:3000")),true);
  assert.equal(sameOrigin(request("127.0.0.1:3100","http://127.0.0.1:3100")),true);
 });
});
test("CSRF: local host aliases, port changes, cross-origin and missing Origin are rejected",()=>{
 inEnvironment("development",()=>{
  for(const [host,origin] of [
   ["127.0.0.1:3000","http://localhost:3000"],
   ["localhost:3000","http://127.0.0.1:3000"],
   ["127.0.0.1:3000","http://127.0.0.1:3001"],
   ["127.0.0.1:3000","http://evil.example"],
   ["127.0.0.1:3000","https://127.0.0.1:3000"],
   ["127.0.0.1:3000","http://evil.example@127.0.0.1:3000"],
   ["127.0.0.1:3000",null]
  ])assert.equal(sameOrigin(request(host,origin)),false,host+" / "+origin);
 });
});
test("remote hosts cannot use localhost installer shortcut",()=>{
 inEnvironment("development",()=>{
  assert.equal(localInstallerAllowed(request("example.com","http://example.com","http://example.com/api/setup")),false);
  assert.equal(localInstallerAllowed(request("127.0.0.1:3000","http://127.0.0.1:3000","https://example.com/api/setup")),false);
 });
});
test("production enforces remote same-origin HTTPS and disables local bypass",()=>{
 inEnvironment("production",()=>{
  const req=request("cms.example.com","https://cms.example.com","https://internal.example/api/setup");
  assert.equal(localInstallerAllowed(req),false);
  assert.equal(sameOrigin(req),true);
  assert.equal(sameOrigin(request("cms.example.com","http://cms.example.com","https://internal.example/api/setup")),false);
  assert.equal(localInstallerAllowed(request("127.0.0.1:3000","http://127.0.0.1:3000")),false);
 });
});
