export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "AUTHOR" | "CONTRIBUTOR";
export type AdminSection = "Workspace" | "Content" | "Appearance" | "Tools";
export type AdminNavIcon = "dashboard" | "pages" | "posts" | "forms" | "media" | "themes" | "migration" | "users" | "settings" | "health" | "plus";
export type AdminNavItem = {
  href: string;
  label: string;
  section: AdminSection;
  icon: AdminNavIcon;
  keywords?: string;
};
const allItems: ReadonlyArray<AdminNavItem & {access:"all" | "editor" | "admin"}> = [
  {href:"/admin", label:"Dashboard", section:"Workspace", icon:"dashboard", access:"all"},
  {href:"/admin/pages", label:"Pages", section:"Content", icon:"pages", keywords:"websites edit page builder", access:"all"},
  {href:"/admin/posts", label:"Posts", section:"Content", icon:"posts", keywords:"blog articles", access:"all"},
  {href:"/admin/forms", label:"Forms & submissions", section:"Content", icon:"forms", keywords:"leads contact", access:"editor"},
  {href:"/admin/media", label:"Media library", section:"Content", icon:"media", keywords:"uploads images files", access:"all"},
  {href:"/admin/themes", label:"Theme studio", section:"Appearance", icon:"themes", keywords:"style colours header footer", access:"admin"},
  {href:"/admin/migration", label:"WordPress import", section:"Tools", icon:"migration", keywords:"migration xml", access:"admin"},
  {href:"/admin/users", label:"Team & roles", section:"Tools", icon:"users", keywords:"staff permissions", access:"admin"},
  {href:"/admin/settings", label:"Settings", section:"Tools", icon:"settings", access:"admin"},
  {href:"/admin/system", label:"System health", section:"Tools", icon:"health", keywords:"diagnostics status", access:"admin"},
];
export const adminSections: ReadonlyArray<AdminSection> = ["Workspace", "Content", "Appearance", "Tools"];
export function canCreateContent(role: AdminRole): boolean {
  return role==="SUPER_ADMIN" || role==="ADMIN" || role==="EDITOR" || role==="AUTHOR";
}
/** Server-authorized menu. Never rely on navigation alone for route security. */
export function adminNavigationFor(role: AdminRole): AdminNavItem[] {
  const admin = role==="SUPER_ADMIN" || role==="ADMIN";
  const editor = admin || role==="EDITOR";
  return allItems.filter(item=>item.access==="all" || (item.access==="editor" && editor) || (item.access==="admin" && admin))
    .map(item=>({href:item.href,label:item.label,section:item.section,icon:item.icon,keywords:item.keywords}));
}
