import {NextRequest,NextResponse} from "next/server";
import {prisma} from "@/lib/db";
export const dynamic="force-dynamic";
/** Public, read-only, published-only content feed for native PinCMS widgets. */
export async function GET(request:NextRequest){
 const params=request.nextUrl.searchParams;
 const kind=params.get("kind")==="pages"?"pages":"posts";
 const take=Math.max(1,Math.min(24,Number(params.get("limit"))||9));
 const query=(params.get("q")||"").trim().slice(0,100);
 const filter={status:"PUBLISHED" as const,AND:[{OR:[{publishedAt:null},{publishedAt:{lte:new Date()}}]},...(query?[{OR:[{title:{contains:query}},{excerpt:{contains:query}}]}]:[])]};
 // Prisma provider-compatible filters; never expose drafts or editor JSON.
 try{
  const select={title:true,slug:true,excerpt:true,ogImage:true,publishedAt:true} as const;
  const rows=kind==="pages"?await prisma.page.findMany({where:filter,select,orderBy:{publishedAt:"desc"},take}):await prisma.post.findMany({where:filter,select,orderBy:{publishedAt:"desc"},take});
  return NextResponse.json(rows.map(item=>({...item,url:(kind==="pages"?"/":"/blog/")+item.slug})),{headers:{"Cache-Control":"public, max-age=30"}});
 }catch{return NextResponse.json({error:"Unable to load public content"},{status:500})}
}
