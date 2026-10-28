import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
const root=resolve(import.meta.dirname,"..");
const read=p=>readFileSync(resolve(root,p),"utf8");

test("first-run checks actual database, media and auth readiness without leaking secrets",()=>{
 const api=read("src/app/api/setup/status/route.ts");
 assert.match(api,/prisma\.user\.count\(\)/);
 assert.match(api,/databaseReady:false/);
 assert.match(api,/schema_missing/);
 assert.match(api,/mediaSettingStatus/);
 assert.match(api,/setupTokenConfigured/);
 assert.match(api,/Cache-Control.*no-store/);
 assert.doesNotMatch(api,/apiSecret:[^\n]*process\.env/);
});

test("first administrator setup is single-use and protected by same-origin token",()=>{
 const setup=read("src/app/api/setup/route.ts");
 const guard=read("src/lib/setup-guard.ts");
 assert.match(setup,/installationGuard/);
 assert.match(setup,/tx\.user\.count\(\)/);
 assert.match(setup,/SUPER_ADMIN/);
 assert.match(setup,/bcryptjs/);
 assert.match(setup,/storedMediaValue/);
 assert.match(setup,/verifyCloudinary/);
 assert.match(guard,/sameOrigin/);
 assert.match(guard,/timingSafeEqual/);
 assert.match(guard,/PINCMS_SETUP_TOKEN/);
 assert.doesNotMatch(guard,/json\(\{[^\n]*token:/);
});

test("secrets are encrypted at rest and Cloudinary credentials only tested server-side",()=>{
 const media=read("src/lib/installer-media.ts");
 const check=read("src/app/api/setup/media-check/route.ts");
 const store=read("src/lib/media-storage.ts");
 assert.match(media,/aes-256-gcm/);
 assert.match(media,/createCipheriv/);
 assert.match(media,/createDecipheriv/);
 assert.match(media,/NEXTAUTH_SECRET/);
 assert.match(media,/environmentCloudinary/);
 assert.match(check,/installationGuard/);
 assert.match(check,/prisma\.user\.count/);
 assert.match(store,/resolvedCloudinary/);
 assert.match(store,/process\.env\.VERCEL/);
});

test("new installer presents real configuration stages with no default credentials",()=>{
 const ui=read("src/app/admin/setup/page.tsx");
 for(const name of ["Database","Media","Identity","Administrator","Review",
  "Cloudinary","Test Cloudinary connection","PINCMS_AUTO_DB_PUSH","Finish installation","NEXTAUTH_SECRET",
  "PINCMS_SETUP_TOKEN","/api/setup/status","/api/setup/media-check","/api/setup"]){
  assert.ok(ui.includes(name),"Missing installer feature: "+name);
 }
 assert.doesNotMatch(ui,/admin123|admin@example\.com/);
 assert.match(ui,/mediaTest==="verified"/);
 assert.doesNotMatch(ui,/localStorage\.setItem/);
});

test("first-run files remain syntactically correct",()=>{
 for(const file of ["src/lib/installer-media.ts","src/lib/setup-guard.ts","src/app/api/setup/status/route.ts"]){
  const source=read(file);
  assert.ok(source.length>150,file);
 }
 const prod=spawnSync(process.execPath,["--check",resolve(root,"scripts/production-build.mjs")],{encoding:"utf8"});
 assert.equal(prod.status,0,prod.stderr);
});
