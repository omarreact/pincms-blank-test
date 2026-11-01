import Link from "next/link";
import {currentUser} from "@/lib/security";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/db";
import {ArrowUpRight,LogOut,ShieldCheck} from "lucide-react";
import {adminNavigationFor,canCreateContent} from "@/lib/admin-navigation";
import {AdminWorkspaceNavigation,AdminQuickSwitcher} from "@/components/admin/AdminWorkspaceNavigation";
export const dynamic="force-dynamic";
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const installed=(await prisma.user.count())>0;if(!installed)redirect("/admin/setup");
 const user=await currentUser();if(!user)redirect("/admin/login");
 const accessible=adminNavigationFor(user.role);
 const canCreate=canCreateContent(user.role);
 return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-sidebar-brand"><Link href="/admin" className="admin-brand"><span>◈</span> pin<span>cms</span></Link><div className="admin-workspace-chip"><span className="admin-workspace-avatar">P</span><span><strong>My workspace</strong><small>Content studio</small></span><span className="admin-workspace-chevron">⌄</span></div></div><AdminWorkspaceNavigation items={accessible} mode="desktop"/><div className="admin-sidebar-bottom"><div className="admin-profile"><span className="admin-profile-avatar">{(user.name||user.email||"A")[0].toUpperCase()}</span><div><strong>{user.name||"Administrator"}</strong><small>{user.role.replaceAll("_"," ")}</small></div></div><p title={user.email}>{user.email}</p><Link href="/api/auth/signout"><LogOut size={16}/> Sign out</Link></div></aside>
 <div className="admin-content"><header className="admin-topbar"><div><span className="admin-topbar-dot"/> Workspace <span className="admin-topbar-divide">/</span> PinCMS Admin</div><div className="admin-topbar-right"><AdminQuickSwitcher items={accessible} canCreate={canCreate}/><span className="admin-topbar-identity"><ShieldCheck size={14}/> Secure workspace</span><Link href="/"><ArrowUpRight size={15}/> Visit site</Link></div></header><AdminWorkspaceNavigation items={accessible} mode="mobile"/><main className="admin-main" id="admin-main">{children}</main><footer className="admin-content-footer"><span>PinCMS • Standalone content management</span><Link href="https://pincms.pincodeit.com/docs/overview">Help & documentation ↗</Link></footer></div></div>;
}
