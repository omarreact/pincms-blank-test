import Link from "next/link";
import {prisma} from "@/lib/db";
import {databaseUnavailable} from "@/lib/database-status";
import {publishedPage,blockPayload} from "@/lib/content";
import {BlockRenderer} from "@/components/blocks/BlockRenderer";
export const dynamic="force-dynamic";

export default async function Home(){
 let installed:number;
 try{installed=await prisma.user.count();}
 catch(error){
  if(!databaseUnavailable(error))throw error;
  return <main className="mx-auto max-w-3xl px-6 py-24">
   <h1 className="text-4xl font-bold">Complete your website setup</h1>
   <p className="mt-5 text-lg opacity-70">The database is not ready yet. Check the PostgreSQL connection and schema initialization.</p>
   <p className="mt-4">On Vercel, configure DATABASE_URL and initialize the PostgreSQL schema. For local development, run npm run dev.</p>
   <Link className="mt-7 inline-block underline" href="/admin/setup">Open the setup wizard →</Link>
  </main>;
 }
 if(!installed)return <main className="mx-auto flex min-h-[65vh] max-w-5xl flex-col justify-center px-6 py-20">
  <span className="mb-3 text-sm font-semibold uppercase tracking-widest opacity-60">Fresh Next.js installation</span>
  <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">Your new website starts here.</h1>
  <p className="mt-6 max-w-xl text-lg opacity-70">Create an administrator, name your website, choose a theme and build pages for your own project. Your content and design are independent of the PinCMS documentation website.</p>
  <Link className="mt-8 w-fit rounded-xl bg-[var(--site-primary)] px-6 py-3 font-semibold text-white" href="/admin/setup">Set up my website →</Link>
 </main>;
 const home=await publishedPage("home");
 if(home)return <main><BlockRenderer blocks={blockPayload(home.blocks)}/></main>;
 return <main>
  <section className="site-hero px-6 py-28"><div className="mx-auto max-w-6xl">
   <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">Your website · Your identity</span>
   <h1 className="mt-8 max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">Make this website your own.</h1>
   <p className="mt-6 max-w-2xl text-xl text-white/85">This is your independent Next.js site. Create and publish a page with slug home to replace this starter homepage with your design.</p>
   <Link href="/admin/pages/new" className="mt-9 inline-flex rounded-lg bg-white px-6 py-3 font-semibold text-slate-900">Create my homepage →</Link>
  </div></section>
  <section className="mx-auto max-w-6xl px-6 py-20"><h2 className="text-2xl font-bold">Start building your own experience</h2>
   <p className="mt-4 max-w-2xl opacity-65">Add your branding, design pages with blocks, upload images, write posts and customize the theme in the private admin. No product documentation or public CMS playground is installed on this site.</p>
  </section>
 </main>;
}
