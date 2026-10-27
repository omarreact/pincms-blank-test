import {prisma} from "@/lib/db";
import {MediaStudio} from "@/components/media/MediaStudio";
export default async function Media(){const data=await prisma.media.findMany({orderBy:{createdAt:"desc"}});return <MediaStudio initial={data.map(d=>({id:d.id,url:d.url,filename:d.filename,alt:d.alt||"",size:d.size}))}/>}
