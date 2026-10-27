import {redirect} from "next/navigation";
import Link from "next/link";
import {currentUser} from "@/lib/security";
import {prisma} from "@/lib/db";

export const dynamic="force-dynamic";

export default async function SystemHealth(){
  const actor=await currentUser();
  if(!actor)redirect("/admin/login");
  if(actor.role!=="SUPER_ADMIN")return <main><h1 className="text-2xl font-bold">System access restricted</h1><p>Only a Super Administrator can inspect system status.</p></main>;
  let database="Unavailable";let accounts:number|null=null;let content:number|null=null;
  try{[accounts,content]=await prisma.$transaction([prisma.user.count(),prisma.page.count()]);database="Connected";}
  catch{database="Connection or schema error";}
  const storage=process.env.DATABASE_URL?.startsWith("file:")?"SQLite":"Configured external database";
  const hosted=Boolean(process.env.VERCEL);
  return <section className="space-y-7">
    <div><h1 className="text-3xl font-black">System health & operations</h1><p className="mt-2 text-slate-600">Live, read-only diagnostics. No shell access, secret values, or arbitrary package installation is exposed to the browser.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[
        ["Database",database],["Provider",storage],["Runtime",process.version],
        ["Hosting",hosted?"Vercel serverless":"Self-hosted / local"],
        ["Accounts",accounts===null?"Unavailable":String(accounts)],
        ["Pages",content===null?"Unavailable":String(content)]
      ].map(([title,value])=><div className="rounded-2xl border bg-white p-5" key={title}><p className="text-sm text-slate-500">{title}</p><strong className="mt-2 block break-words text-xl">{value}</strong></div>)}
    </div>
    <article className="rounded-2xl border bg-white p-6">
      <h2 className="text-xl font-bold">Safe administration</h2>
      <p className="mt-2 text-slate-600">Site content, themes and configuration are managed through the CMS UI. Prisma schema changes and npm dependency updates need reviewed files, rebuilds and service restarts; they cannot be safely hot-installed through a Vercel serverless request. A constrained, audited operations worker would be required before enabling those buttons.</p>
      <div className="mt-5 flex flex-wrap gap-4"><Link className="text-indigo-700 underline" href="/admin/settings">Website settings</Link><Link className="text-indigo-700 underline" href="/admin/themes">Theme manager</Link><Link className="text-indigo-700 underline" href="/admin/migration">WordPress migration</Link></div>
    </article>
  </section>;
}
