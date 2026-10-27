import Link from "next/link";
import {currentUser} from "@/lib/security";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/db";
import {Activity,ArrowUpRight,BookOpen,FileText,Files,Home,Images,LayoutDashboard,LogOut,Palette,Settings2,ShieldCheck,Users,Workflow} from "lucide-react";
export const dynamic="force-dynamic";
const links=[
 {href:"/admin",label:"Overview",icon:LayoutDashboard,adminOnly:false},
 {href:"/admin/pages",label:"Pages",icon:Files,adminOnly:false},
 {href:"/admin/posts",label:"Blog posts",icon:FileText,adminOnly:false},
 {href:"/admin/media",label:"Media library",icon:Images,adminOnly:false},
 {href:"/admin/themes",label:"Theme studio",icon:Palette,adminOnly:true},
 {href:"/admin/migration",label:"WordPress import",icon:Workflow,adminOnly:true},
 {href:"/admin/users",label:"Team & roles",icon:Users,adminOnly:true},
 {href:"/admin/settings",label:"Settings",icon:Settings2,adminOnly:true},
 {href:"/admin/system",label:"System health",icon:Activity,adminOnly:true}
 ];
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const installed=(await prisma.user.count())>0;if(!installed)redirect("/admin/setup");
 const user=await currentUser();if(!user)redirect("/admin/login");
 const isAdmin=user.role==="SUPER_ADMIN"||user.role==="ADMIN";
 const accessible=links.filter(item=>!item.adminOnly||isAdmin);
 return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-sidebar-brand"><Link href="/admin" className="admin-brand"><span>◈</span> pin<span>cms</span></Link><div className="admin-workspace-chip"><span className="admin-workspace-avatar">P</span><span><strong>My workspace</strong><small>Content studio</small></span><span className="admin-workspace-chevron">⌄</span></div></div><div className="admin-nav-label">WORKSPACE</div><nav className="admin-side-nav" aria-label="Administration">{accessible.map(item=><Link key={item.href} href={item.href}><item.icon size={17} strokeWidth={1.8}/>{item.label}</Link>)}</nav><div className="admin-sidebar-bottom"><div className="admin-profile"><span className="admin-profile-avatar">{(user.name||user.email||"A")[0].toUpperCase()}</span><div><strong>{user.name||"Administrator"}</strong><small>{user.role.replaceAll("_"," ")}</small></div></div><p title={user.email}>{user.email}</p><Link href="/api/auth/signout"><LogOut size={16}/> Sign out</Link></div></aside>
 <div className="admin-content"><header className="admin-topbar"><div><span className="admin-topbar-dot"/> Workspace <span className="admin-topbar-divide">/</span> PinCMS Admin</div><div className="admin-topbar-right"><span className="admin-topbar-identity"><ShieldCheck size={14}/> Secure workspace</span><Link href="/"><ArrowUpRight size={15}/> Visit site</Link></div></header><nav className="admin-mobile-nav" aria-label="Mobile administration">{accessible.map(item=><Link href={item.href} key={item.href}><item.icon size={16}/>{item.label}</Link>)}</nav><main className="admin-main" id="admin-main">{children}</main><footer className="admin-content-footer"><span>PinCMS • Standalone content management</span><Link href="https://pincms.pincodeit.com/docs/overview">Help & documentation ↗</Link></footer></div></div>;
}
