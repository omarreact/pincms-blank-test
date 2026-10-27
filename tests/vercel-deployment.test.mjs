import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

const at=path=>readFileSync(resolve(import.meta.dirname,"..",path),"utf8");
test("Vercel build generates a PostgreSQL Prisma client",()=>{
 const code=at("scripts/production-build.mjs");
 const pkg=JSON.parse(at("package.json"));
 assert.equal(pkg.scripts.build,"node scripts/production-build.mjs");
 assert.match(code,/schema\.postgres\.prisma/);
 assert.match(code,/run\("prisma",\["generate"/);
 assert.match(code,/PINCMS_AUTO_DB_PUSH/);
 assert.doesNotMatch(code,/\["--accept-data-loss"|\["--force-reset"/);
 assert.equal(spawnSync(process.execPath,["--check",resolve(import.meta.dirname,"../scripts/production-build.mjs")]).status,0);
});
test("database fallback keeps first-time setup page available",()=>{
 assert.match(at("src/lib/theme.ts"),/databaseUnavailable\(error\)/);
 assert.match(at("src/app/layout.tsx"),/databaseUnavailable\(error\)/);
 assert.match(at("src/app/page.tsx"),/databaseUnavailable\(error\)/);
 assert.match(at("src/lib/database-status.ts"),/PrismaClientInitializationError/);
});
