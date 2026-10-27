import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {revalidatePath} from "next/cache";
import {timingSafeEqual} from "node:crypto";
import {mirrorPageToFirestore} from "@/lib/firebase";
export const runtime="nodejs";
export async function GET(req:NextRequest){
 const secret=process.env.PINCMS_CRON_SECRET;
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 if(!secret||secret.length<24)return NextResponse.json({error:"Cron secret not configured"},{status:503});
 const a=Buffer.from(token),b=Buffer.from(secret);
 if(a.length!==b.length||!timingSafeEqual(a,b))return NextResponse.json({error:"Unauthorized"},{status:401});
 const now=new Date();
 const pages=await prisma.page.findMany({where:{status:"SCHEDULED",publishedAt:{lte:now}},include:{blocks:true}});
 const posts=await prisma.post.findMany({where:{status:"SCHEDULED",publishedAt:{lte:now}},include:{blocks:true}});
 for(const page of pages){await prisma.page.update({where:{id:page.id},data:{status:"PUBLISHED"}});try{await mirrorPageToFirestore({...page,status:"PUBLISHED"},page.blocks.map(b=>({type:b.type,data:JSON.parse(b.data)})))}catch(e){console.error("Firebase publishing sync failed",e)}revalidatePath("/"+page.slug)}
 for(const post of posts){await prisma.post.update({where:{id:post.id},data:{status:"PUBLISHED"}});try{await mirrorPageToFirestore({...post,status:"PUBLISHED",slug:`blog/${post.slug}`},post.blocks.map(b=>({type:b.type,data:JSON.parse(b.data)})))}catch(e){console.error("Firebase publishing sync failed",e)}revalidatePath("/blog/"+post.slug)}
 if(pages.length)revalidatePath("/");if(posts.length)revalidatePath("/blog");
 return NextResponse.json({ok:true,publishedPages:pages.length,publishedPosts:posts.length});
}
