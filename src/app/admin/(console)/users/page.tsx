import {prisma} from "@/lib/db";
import {UserStudio} from "@/components/settings/UserStudio";
export default async function Users(){const users=await prisma.user.findMany({select:{id:true,name:true,email:true,role:true},orderBy:{createdAt:"desc"}});return <UserStudio initial={users}/>}
