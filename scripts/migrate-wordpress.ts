/** PinCMS WordPress CLI importer, executed using `tsx` in a provisioned CMS repo. */
import fs from 'node:fs';
import {prisma} from '../src/lib/db';
import {fetchWordPressRest,parseWxr} from '../src/lib/migration/wordpress.mjs';
import {importWordPress,migrationHistory,previewMigration} from '../src/lib/migration/importer';
const args=process.argv.slice(2);
const get=(name:string)=>args.find(s=>s.startsWith(`--${name}=`))?.slice(name.length+3)||'';
const bool=(name:string)=>args.includes(`--${name}`);
async function main(){
 if(bool('help')){console.log('Usage: npm run migrate:wordpress -- --file=export.xml [--site=https://old.example] [--apply] [--update-existing] | --url=https://old.example [--user=admin] [--apply]\nRun without --apply for a dry-run. For REST credentials set PINCMS_WORDPRESS_APP_PASSWORD in your environment.');return;}
 if(bool('status')){console.log(JSON.stringify(await migrationHistory(),null,2));return;}
 if(bool('redirects')){const redirects=await prisma.redirect.findMany({orderBy:{fromPath:'asc'}});console.log(JSON.stringify(redirects.map(({fromPath,toPath,type})=>({fromPath,toPath,type})),null,2));return;}
 const file=get('file'),url=get('url');if(Boolean(file)===Boolean(url))throw Error('Provide exactly one of --file=export.xml or --url=https://site');
 const imported=file?parseWxr(fs.readFileSync(file,'utf8'),get('site')):await fetchWordPressRest({url,user:get('user'),applicationPassword:process.env.PINCMS_WORDPRESS_APP_PASSWORD||''});
 console.log('Mapping:',JSON.stringify(previewMigration(imported),null,2));
 const author=await prisma.user.findFirst({where:{role:{in:['SUPER_ADMIN','ADMIN']}},select:{id:true}});if(!author)throw Error('Create a PinCMS administrator before importing');
 const full={created:0,updated:0,skipped:0,failed:0,redirects:0,issues:[] as string[]};
 for(let offset=0;offset<imported.items.length;offset+=25){
  const r=await importWordPress(imported,{authorId:author.id,dryRun:!bool('apply'),updateExisting:bool('update-existing'),offset,revalidate:false});
  full.created+=r.created;full.updated+=r.updated;full.skipped+=r.skipped;full.failed+=r.failed;full.redirects+=r.redirects;full.issues.push(...r.issues);
  console.log(`Processed ${r.nextOffset}/${r.total}`);
 }
 console.log(JSON.stringify({mode:bool('apply')?'APPLIED':'DRY RUN',...full},null,2));
 if(full.failed>0)process.exitCode=1;
}
main().catch(err=>{console.error('Migration failed:',err instanceof Error?err.message:'Unknown failure');process.exitCode=1}).finally(async()=>{await prisma.$disconnect()});
