import { prisma } from '@/lib/db';
import type {MigrationInput,WordPressEntry} from './wordpress.mjs';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';

export interface MigrationReport { source:string;dryRun:boolean;total:number;created:number;updated:number;skipped:number;failed:number;redirects:number;issues:string[]; processed:number;hasMore:boolean;nextOffset:number; }
const safeSlug=(v:string)=>v.toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,130);
const normalizedSite=(site:string)=>`wordpress:${createHash('sha256').update(site.trim().toLowerCase()).digest('hex')}`;
function pathFor(e:WordPressEntry,slug=e.slug){return e.sourceType==='page'?`/${slug}`:`/blog/${slug}`;}
function allowedFromPath(path:string) {
 if(!path||path.length>200||!path.startsWith('/')||path.startsWith('//')||path.includes('\\')||path.includes('?')||path.includes('#'))return false;
 if(/^\/(admin|api|_next)(\/|$)/.test(path)||/\/%2f/i.test(path))return false;
 return true;
}
export function previewMigration(bundle:MigrationInput) {
 return {site:bundle.site,source:bundle.source,total:bundle.items.length,pages:bundle.items.filter(x=>x.sourceType==='page').length,posts:bundle.items.filter(x=>x.sourceType==='post').length,
  samples:bundle.items.slice(0,6).map(x=>({title:x.title,type:x.sourceType,slug:x.slug,blocks:x.blocks.length})),
  limitations:[...bundle.warnings,'Imported content is saved as DRAFT for review.',
   'WordPress media URLs are referenced, not downloaded to Cloudinary or local storage.',
   'User accounts, password hashes, menus, complex layouts and ACF fields require manual migration.',
   'SEO and blocks are best-effort mappings; review migrated pages before changing DNS.']};
}
async function resolveSlug(entry:WordPressEntry,recordId?:string) {
 let slug=safeSlug(entry.slug)||`wp-${entry.sourceId}`;
 for(let n=0;n<50;n++){
  const clash=entry.sourceType==='page'?await prisma.page.findUnique({where:{slug}}):await prisma.post.findUnique({where:{slug}});
  if(!clash||clash.id===recordId)return slug;
  slug=`${(safeSlug(entry.slug)||'wp').slice(0,95)}-wp-${entry.sourceId}${n?`-${n}`:''}`;
 }
 throw Error('Could not assign a unique safe slug');
}
export async function importWordPress(bundle:MigrationInput,options:{dryRun?:boolean;updateExisting?:boolean;offset?:number;batchSize?:number;authorId:string;revalidate?:boolean}):Promise<MigrationReport> {
 const offset=options.offset||0, batchSize=Math.min(25,Math.max(1,options.batchSize||25));
 const entries=bundle.items.slice(offset,offset+batchSize);
 const report:MigrationReport={source:bundle.site,dryRun:options.dryRun!==false,total:bundle.items.length,created:0,updated:0,skipped:0,failed:0,redirects:0,issues:[...bundle.warnings],processed:entries.length,hasMore:offset+entries.length<bundle.items.length,nextOffset:offset+entries.length};
 const site=normalizedSite(bundle.site);
 for(const entry of entries){
  try{
   const key={sourceSite:site,sourceType:entry.sourceType,sourceId:entry.sourceId};
   const existing=await prisma.migrationRecord.findUnique({where:{sourceSite_sourceType_sourceId:key}});
   if(existing && !options.updateExisting){report.skipped++;continue;}
   const slug=await resolveSlug(entry,existing?.targetId);
   const destination=pathFor(entry,slug);
   if(report.dryRun){if(existing)report.updated++;else report.created++;continue;}
   // Content is intentionally DRAFT. Never publish imported HTML automatically.
   const common={title:entry.title,slug,excerpt:entry.excerpt||null,seoTitle:entry.seoTitle||null,seoDesc:entry.seoDesc||null,
    status:'DRAFT' as const,publishedAt:null};
   const blocks=entry.blocks.slice(0,120).map((b,i)=>({type:b.type,data:JSON.stringify(b.data),order:i}));
   const saved=entry.sourceType==='page'
    ? existing?await prisma.page.update({where:{id:existing.targetId},data:{...common,blocks:{deleteMany:{},create:blocks}}}):await prisma.page.create({data:{...common,blocks:{create:blocks},authorId:options.authorId}})
    : existing?await prisma.post.update({where:{id:existing.targetId},data:{...common,blocks:{deleteMany:{},create:blocks}}}):await prisma.post.create({data:{...common,blocks:{create:blocks},authorId:options.authorId}});
   await prisma.migrationRecord.upsert({where:{sourceSite_sourceType_sourceId:key},
    create:{...key,targetId:saved.id,originalPath:entry.originalPath||null},
    update:{targetId:saved.id,originalPath:entry.originalPath||null}});
   if(entry.sourceType==='post'&&(entry.categories.length||entry.tags.length)) {
    const catIds:string[]=[],tagIds:string[]=[];
    for(const name of entry.categories.slice(0,25)){const cat=await prisma.category.upsert({where:{slug:safeSlug(name)||`cat-${entry.sourceId}`},update:{},create:{name,slug:safeSlug(name)||`cat-${entry.sourceId}`}});catIds.push(cat.id)}
    for(const name of entry.tags.slice(0,25)){const tag=await prisma.tag.upsert({where:{slug:safeSlug(name)||`tag-${entry.sourceId}`},update:{},create:{name,slug:safeSlug(name)||`tag-${entry.sourceId}`}});tagIds.push(tag.id)}
    await prisma.post.update({where:{id:saved.id},data:{categories:{set:catIds.map(id=>({id}))},tags:{set:tagIds.map(id=>({id}))}}});
   }
   if(allowedFromPath(entry.originalPath)){
    const original=entry.originalPath.replace(/\/+$/,'')||'/';
    if(original!==destination && original!=='/' && !(await prisma.page.findFirst({where:{slug:original.slice(1)}}))){
     await prisma.redirect.upsert({where:{fromPath:original},update:{toPath:destination,type:301},create:{fromPath:original,toPath:destination,type:301}});report.redirects++;
    }
   }
   if(existing)report.updated++;else report.created++;
  }catch(error){report.failed++;report.issues.push(`Failed to import ${entry.sourceType} ${entry.sourceId}: ${error instanceof Error?error.message:'Unknown error'}`);}
 }
 if(options.revalidate!==false && !report.dryRun && report.created+report.updated){revalidatePath('/');revalidatePath('/blog');}
 return report;
}
export async function migrationHistory(){
 const items=await prisma.migrationRecord.findMany({orderBy:{updatedAt:'desc'},take:100});
 return {total:await prisma.migrationRecord.count(),recent:items.map(({sourceSite,sourceType,sourceId,targetId,updatedAt})=>({sourceSite,sourceType,sourceId,targetId,updatedAt}))};
}
