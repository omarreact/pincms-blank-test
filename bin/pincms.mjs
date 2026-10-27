#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {randomBytes} from "node:crypto";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const args=process.argv.slice(2), command=args.shift()||"help";
const project=process.cwd();
const log=(m)=>console.log(`\x1b[36mPinCMS\x1b[0m ${m}`);
const fail=(message)=>{console.error(`PinCMS: ${message}`);process.exitCode=1};
// Next.js reads .env.local automatically, but the standalone Prisma CLI does not.
// Load only DATABASE_URL for database commands; never expose it in logs.
function databaseEnvironment(){
 const env={...process.env};
 if(env.DATABASE_URL)return env;
 for(const file of [".env.local",".env"]){
  const location=path.join(project,file);
  if(!fs.existsSync(location))continue;
  const match=fs.readFileSync(location,"utf8").match(/^\s*DATABASE_URL\s*=\s*(?:"([^"\r\n]*)"|'([^'\r\n]*)'|([^\r\n#]*))/m);
  if(match){env.DATABASE_URL=(match[1]??match[2]??match[3]??"").trim();break}
 }
 return env;
}
const run=(bin,argv)=>{
 const result=spawnSync(bin,argv,{cwd:project,stdio:"inherit",shell:process.platform==="win32",env:databaseEnvironment()});
 if(result.error||result.status!==0){fail(`${bin} ${argv.join(" ")} failed`);return false}
 return true;
};
const copySafe=(src,dest)=>{if(!fs.existsSync(src))return;const stats=fs.statSync(src);if(stats.isDirectory()){fs.mkdirSync(dest,{recursive:true});for(const entry of fs.readdirSync(src))copySafe(path.join(src,entry),path.join(dest,entry))}else if(!fs.existsSync(dest))fs.copyFileSync(src,dest)};
function init(){
 if(!fs.existsSync(path.join(project,"package.json"))){fail("No package.json found. Run this in a Next.js project, or use create-pincms to start a new site.");return}
 const pkg=JSON.parse(fs.readFileSync(path.join(project,"package.json"),"utf8"));if(!pkg.dependencies?.next&&!pkg.devDependencies?.next){fail("A Next.js project is required.");return}
 for(const entry of ["src/app/admin","src/app/api","src/app/blog","src/components","src/lib","src/types","prisma","scripts"])copySafe(path.join(root,entry),path.join(project,entry));
 copySafe(path.join(root,".env.example"),path.join(project,".env.example"));copySafe(path.join(root,"middleware.ts"),path.join(project,"middleware.ts"));
 const source=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
 pkg.dependencies={...source.dependencies,...pkg.dependencies};pkg.devDependencies={...source.devDependencies,...pkg.devDependencies};pkg.scripts={...source.scripts,...pkg.scripts};
 fs.writeFileSync(path.join(project,"package.json"),JSON.stringify(pkg,null,2)+"\n");
 log("Added non-conflicting CMS source files and merged package dependencies; existing files were NOT overwritten.");
 log("Review root layout/home page conflicts. Install dependencies, configure .env, run npm run db:push, then visit /admin/setup.");
}
function setup(){
 const target=path.join(project,".env.local");
 const example=path.join(project,".env.example");
 if(!fs.existsSync(example)){fail(".env.example not found. Run from the PinCMS application directory.");return}
 let content=fs.existsSync(target)?fs.readFileSync(target,"utf8"):fs.readFileSync(example,"utf8");
 let generated=[];
 for(const key of ["NEXTAUTH_SECRET","PINCMS_SETUP_TOKEN"]){
   const re=new RegExp(`^${key}=[^\n]*$`,"m");
   const existing=content.match(re)?.[0]?.split("=").slice(1).join("=").replace(/^["']|["']$/g,"")||"";
   if((args.includes("--rotate-token") && key==="PINCMS_SETUP_TOKEN")||!existing||existing.startsWith("GENERATE_")||existing.startsWith("change-this")){
     const secret=randomBytes(32).toString("hex");
     if(re.test(content))content=content.replace(re,`${key}="${secret}"`);
     else content+=`\n${key}="${secret}"\n`;
     generated.push(key);
   }
 }
 fs.writeFileSync(target,content,{mode:0o600});
 log(`Secure setup saved in .env.local. Generated: ${generated.join(", ")||"no secrets; existing values preserved"}.`);
 const token=content.match(/^PINCMS_SETUP_TOKEN=["']?([^"'\r\n]+)/m)?.[1];
 if(token)log(`Your one-time setup token: ${token}`);
 // First local launch: initialize SQLite before a page can query the database.
 // Avoid touching remote/PostgreSQL databases during setup.
 const dbUrl=databaseEnvironment().DATABASE_URL??"";
 const schema=path.join(project,"prisma","schema.prisma");
 const installedPrisma=path.join(project,"node_modules",".bin",process.platform==="win32"?"prisma.cmd":"prisma");
 if(dbUrl.startsWith("file:") && fs.existsSync(schema) && /provider\s*=\s*"sqlite"/.test(fs.readFileSync(schema,"utf8"))){
   if(fs.existsSync(installedPrisma)){
     log("Initializing the local SQLite tables (Prisma db push)...");
     if(!run("npx",["--no-install","prisma","db","push"])){
       log("Database not initialized. Check DATABASE_URL then run npm run db:push before npm run dev.");
       return;
     }
     log("Local database is ready.");
   } else log("Dependencies not installed. Run npm install, then npm run db:push before npm run dev.");
 } else log("Run npm run db:push against your configured database before npm run dev.");
 log("Next: npm run dev; open http://localhost:3000/admin/setup");
}

function db(provider){if(!["postgres","sqlite"].includes(provider||"")){log("db postgres | db sqlite | db push");return}const file=path.join(project,"prisma","schema.prisma"),origin=path.join(project,"prisma","schema.postgres.prisma");if(!fs.existsSync(file)){fail("prisma/schema.prisma not found");return}if(provider==="postgres"){const str=fs.readFileSync(file,"utf8").replace(/provider\s*=\s*"sqlite"/, 'provider = "postgresql"');fs.writeFileSync(file,str);if(!fs.existsSync(origin))fs.writeFileSync(origin,str);log("Selected PostgreSQL; set DATABASE_URL to your managed PostgreSQL database and run db push.")}else{const str=fs.readFileSync(file,"utf8").replace(/provider\s*=\s*"postgresql"/, 'provider = "sqlite"');fs.writeFileSync(file,str);log("Selected SQLite. SQLite is not persistent on serverless deployments.")}}
function theme(action,name){if(action==="import"){if(!name||!fs.existsSync(name)){fail("Pass an existing .json theme file");return}const json=JSON.parse(fs.readFileSync(name,"utf8"));if(!json.name||!json.styles?.colors){fail("Theme requires a name and styles.colors");return}const dir=path.join(project,"themes");fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,path.basename(name));copySafe(path.resolve(name),dest);log(`Theme copied to ${dest}. Import and activate it in Admin > Themes.`)}else if(action==="export"){const file=path.join(root,"themes","standalone.json");if(!fs.existsSync(file)){fail("Default theme missing");return}const dest=path.join(project,"pincms-theme-export.json");fs.copyFileSync(file,dest);log(`Exported default theme to ${dest}; use Admin > Themes to export modified active themes.`)}else log("theme import <file.json> | theme export")}
function addBlock(name){if(!name||!/^[A-Z][A-Za-z0-9]{1,50}$/.test(name)){fail("Use PascalCase for custom block names (e.g. MyBlock)");return}const dir=path.join(project,"src","components","custom-blocks");fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${name}.tsx`);if(fs.existsSync(file)){fail("Block already exists");return}fs.writeFileSync(file,`export function ${name}({title}:{title:string}){return <section className="py-16"><h2>{title}</h2></section>}\n`);log(`Created ${file}; register it in src/components/blocks/BlockRenderer.tsx and src/lib/blocks.ts.`)}
switch(command){
 case "help":log("Commands: init | setup [--rotate-token] | db <sqlite|postgres|push|studio> | seed | theme <import file|export> | add-block <Name> | migrate:wordpress [--file=x.xml|--url=https://...] [--apply] | migrate:status | migrate:redirects | deploy");break;
 case "init":init();break;
 case "setup":setup();break;
 case "db":if(args[0]==="push")run("npx",["--no-install","prisma","db","push"]);else if(args[0]==="studio")run("npx",["--no-install","prisma","studio"]);else db(args[0]);break;
 case "seed":run("npx",["tsx","prisma/seed.ts"]);break;
 case "theme":theme(args[0],args[1]);break;
 case "add-block":addBlock(args[0]);break;
 case "migrate:wordpress":run("npx",["tsx","scripts/migrate-wordpress.ts",...args]);break;
 case "migrate:status":run("npx",["tsx","scripts/migrate-wordpress.ts","--status"]);break;
 case "migrate:redirects":run("npx",["tsx","scripts/migrate-wordpress.ts","--redirects"]);break;
 case "deploy":log("Deploy uses the installed Vercel CLI and your authenticated account; no credentials are collected by PinCMS.");run("npx",["vercel","--prod"]);break;
 default:fail(`Unknown command ${command}`)
}
