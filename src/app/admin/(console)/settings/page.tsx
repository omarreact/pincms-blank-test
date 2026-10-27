import {prisma} from "@/lib/db";
import {SettingsStudio} from "@/components/settings/SettingsStudio";
export default async function Settings(){const rows=await prisma.setting.findMany({where:{key:{in:["siteName","siteDescription"]}}});const data=Object.fromEntries(rows.map(x=>[x.key,x.value]));return <SettingsStudio initial={{siteName:data.siteName??"PinCMS",siteDescription:data.siteDescription??""}}/>}
