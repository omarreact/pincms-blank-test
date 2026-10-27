import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {denied,hasRole} from '@/lib/security';
import {fetchWordPressRest,parseWxr,MAX_WXR_BYTES} from '@/lib/migration/wordpress.mjs';
import {importWordPress,migrationHistory,previewMigration} from '@/lib/migration/importer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const schema=z.object({action:z.enum(['preview','run']),mode:z.enum(['wxr','rest']),
 xml:z.string().max(MAX_WXR_BYTES).optional(),sourceSite:z.string().max(300).optional(),url:z.string().max(300).optional(),
 username:z.string().max(100).optional(),applicationPassword:z.string().max(200).optional(),
 includePages:z.boolean().default(true),includePosts:z.boolean().default(true),
 dryRun:z.boolean().default(true),updateExisting:z.boolean().default(false),offset:z.number().int().min(0).max(250).default(0)});
export async function GET(){if(!await hasRole('ADMIN'))return denied();return NextResponse.json(await migrationHistory())}
export async function POST(request:NextRequest){
 const user=await hasRole('ADMIN');if(!user)return denied();
 const length=Number(request.headers.get('content-length')||0);if(length>MAX_WXR_BYTES*2)return NextResponse.json({error:'Payload too large'},{status:413});
 const input=schema.safeParse(await request.json().catch(()=>null));if(!input.success)return NextResponse.json({error:'Invalid migration request',details:input.error.flatten()},{status:400});
 const data=input.data;
 if(!data.includePages&&!data.includePosts)return NextResponse.json({error:'Select pages or posts'},{status:400});
 try {
  const imported=data.mode==='wxr'?parseWxr(data.xml||'',data.sourceSite||''):
   await fetchWordPressRest({url:data.url||'',user:data.username,applicationPassword:data.applicationPassword,includePages:data.includePages,includePosts:data.includePosts});
  imported.items=imported.items.filter(x=>x.sourceType==='page'?data.includePages:data.includePosts);
  if(data.action==='preview')return NextResponse.json(previewMigration(imported));
  const report=await importWordPress(imported,{authorId:user.id,dryRun:data.dryRun,updateExisting:data.updateExisting,offset:data.offset,batchSize:25});
  return NextResponse.json(report);
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Migration failed'},{status:400})}
}
