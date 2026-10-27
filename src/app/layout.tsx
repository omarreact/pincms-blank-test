import "./globals.css";
import type {Metadata} from "next";
import {getActiveTheme} from "@/lib/theme";
import {prisma} from "@/lib/db";
import {databaseSchemaMissing} from "@/lib/database-status";
import Link from "next/link";
import React from "react";
export const dynamic="force-dynamic";
async function siteName():Promise<string>{
 try{return (await prisma.setting.findUnique({where:{key:"siteName"}}))?.value||"PinCMS"}
 catch(error){if(databaseSchemaMissing(error))return "PinCMS";throw error}
}
export async function generateMetadata():Promise<Metadata>{
  const title=await siteName();
  return {title:{default:title,template:`%s · ${title}`},description:"A site built with PinCMS",robots:{index:true,follow:true}};
}
export default async function RootLayout({children}:{children:React.ReactNode}){
  const theme=await getActiveTheme();const c=theme.styles.colors;
  const cssVars={"--site-primary":c.primary??"#4657e8","--site-bg":c.background??"#ffffff","--site-fg":c.foreground??"#142038","--site-muted":c.muted??"#f1f5ff","--site-accent":c.accent??"#21cda4","--site-radius":String(theme.settings?.borderRadius??"14px")} as React.CSSProperties;
  const name=await siteName();
  return <html lang="en"><body style={cssVars}><div className="site-shell"><header className="site-header"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5"><Link href="/" className="text-xl font-black tracking-tight">✦ {name}</Link><nav className="flex items-center gap-6 text-sm font-semibold"><Link href="/" className="hover:opacity-70">Home</Link><Link href="/blog" className="hover:opacity-70">Blog</Link><Link href="/admin" className="rounded-xl bg-[var(--site-primary)] px-4 py-2 text-white">Manage</Link></nav></div></header>{children}<footer className="border-t border-current/10 py-9"><div className="mx-auto flex max-w-6xl justify-between gap-3 px-6 text-sm opacity-60"><span>© {new Date().getFullYear()} {name}</span><span>Powered by PinCMS</span></div></footer></div></body></html>;
}
