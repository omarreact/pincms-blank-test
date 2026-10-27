import {prisma} from "@/lib/db";
import {ThemeStudio} from "@/components/themes/ThemeStudio";
export default async function Themes(){const themes=await prisma.theme.findMany({orderBy:{createdAt:"desc"}});return <ThemeStudio initial={themes.map(t=>({id:t.id,name:t.name,version:t.version,isActive:t.isActive,config:t.config}))}/>}
