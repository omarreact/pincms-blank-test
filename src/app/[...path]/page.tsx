import {prisma} from '@/lib/db';
import {notFound,permanentRedirect,redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function LegacyRedirect({params}:{params:Promise<{path:string[]}>}) {
 const {path}=await params;
 if(path.length>8||path.some(s=>s.length>130))notFound();
 const fromPath=`/${path.join('/')}`;
 const record=await prisma.redirect.findUnique({where:{fromPath}});
 if(!record||record.toPath===fromPath)notFound();
 if(record.type===301)permanentRedirect(record.toPath);
 redirect(record.toPath);
}
