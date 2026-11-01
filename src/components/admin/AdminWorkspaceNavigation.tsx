"use client";

import {useEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent} from "react";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {Activity,ArrowRight,ClipboardList,FileText,Files,Images,LayoutDashboard,Palette,Plus,Search,Settings2,Users,Workflow,X} from "lucide-react";
import {adminSections,type AdminNavIcon,type AdminNavItem} from "@/lib/admin-navigation";

const icons={
  dashboard:LayoutDashboard,pages:Files,posts:FileText,forms:ClipboardList,media:Images,
  themes:Palette,migration:Workflow,users:Users,settings:Settings2,health:Activity,plus:Plus
} satisfies Record<AdminNavIcon,typeof LayoutDashboard>;

function isActive(pathname:string,href:string) {
  return pathname===href || (href!=="/admin" && pathname.startsWith(href+"/"));
}

/** The same authorized menu is available from desktop and compact mobile navigation. */
export function AdminWorkspaceNavigation({items,mode}:{items:AdminNavItem[],mode:"desktop"|"mobile"}) {
  const pathname=usePathname();
  if(mode==="mobile") return <nav className="admin-mobile-nav pc-mobile-nav" aria-label="Mobile administration">
    {items.map(item=>{const Icon=icons[item.icon];return <Link key={item.href} href={item.href} aria-current={isActive(pathname,item.href)?"page":undefined} className="pc-nav-link"><Icon size={16} aria-hidden="true"/>{item.label}</Link>;})}
  </nav>;
  return <div className="pc-nav-groups">{adminSections.map(section=>{
    const group=items.filter(item=>item.section===section);
    return group.length>0 && <div className="pc-nav-group" key={section}>
      <div className="admin-nav-label">{section.toUpperCase()}</div>
      <nav className="admin-side-nav pc-section-nav" aria-label={section}>
        {group.map(item=>{const Icon=icons[item.icon];return <Link key={item.href} href={item.href} aria-current={isActive(pathname,item.href)?"page":undefined} className="pc-nav-link"><Icon size={17} strokeWidth={1.8} aria-hidden="true"/>{item.label}</Link>;})}
      </nav>
    </div>;
  })}</div>;
}

export function AdminQuickSwitcher({items,canCreate}:{items:AdminNavItem[],canCreate:boolean}) {
  const pathname=usePathname();
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [query,setQuery]=useState("");
  const [cursor,setCursor]=useState(0);
  const inputRef=useRef<HTMLInputElement>(null);
  const modalRef=useRef<HTMLDivElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);
  const shortcuts:AdminNavItem[]=canCreate?[
    {label:"Create new page",href:"/admin/pages/new",section:"Content",icon:"plus",keywords:"new page"},
    {label:"Write new post",href:"/admin/posts/new",section:"Content",icon:"plus",keywords:"new article"}
  ]:[];
  const all=[...shortcuts,...items];
  const term=query.trim().toLowerCase();
  const matches=term?all.filter(item=>(item.label+" "+item.section+" "+(item.keywords||"")).toLowerCase().includes(term)):all;
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement|null;
      if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
        if(!open && target?.closest('input,textarea,[contenteditable="true"]'))return;
        event.preventDefault();setOpen(value=>!value);
      }else if(event.key==="Escape")setOpen(false);
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[open]);
  useEffect(()=>{if(open){previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;inputRef.current?.focus();}
    else if(previousFocus.current){previousFocus.current.focus();previousFocus.current=null;}
  },[open]);
  useEffect(()=>{setOpen(false);setQuery("");setCursor(0);},[pathname]);
  function choose(href:string){setOpen(false);setQuery("");setCursor(0);router.push(href);}
  function onDialogKeyDown(event:ReactKeyboardEvent<HTMLDivElement>){
    if(event.key==="Escape"){event.preventDefault();setOpen(false);return;}
    if(event.key==="ArrowDown"||event.key==="ArrowUp"){
      if((event.target as HTMLElement).tagName==="INPUT"){
        event.preventDefault();setCursor(old=>Math.max(0,Math.min(matches.length-1,old+(event.key==="ArrowDown"?1:-1))));
      }
      return;
    }
    if(event.key==="Enter" && (event.target as HTMLElement).tagName==="INPUT" && matches[cursor]){
      event.preventDefault();choose(matches[cursor].href);return;
    }
    if(event.key==="Tab"){
      const focusables=[...(modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,a[href]')||[])];
      const first=focusables[0],last=focusables[focusables.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
  }
  return <>
    <button type="button" className="pc-switch-trigger" onClick={()=>setOpen(true)} aria-keyshortcuts="Control+K Meta+K" aria-haspopup="dialog">
      <Search size={16} aria-hidden="true"/><span>Search CMS tools</span><kbd>⌘ K</kbd>
    </button>
    {open && <div className="pc-switch-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Search CMS tools and shortcuts" className="pc-switch-dialog" onKeyDown={onDialogKeyDown}>
        <div className="pc-switch-input-row">
          <Search size={19} aria-hidden="true"/>
          <input ref={inputRef} type="search" aria-label="Search CMS tools" placeholder="Search pages, tools, settings…" value={query} onChange={event=>{setQuery(event.target.value);setCursor(0);}}/>
          <button onClick={()=>setOpen(false)} type="button" aria-label="Close quick switcher"><X size={19}/></button>
        </div>
        <div className="pc-switch-results" role="listbox" aria-label="Matching CMS tools">
          {matches.map((item,i)=>{const Icon=icons[item.icon];return <button key={item.href} type="button" role="option" aria-selected={i===cursor} onMouseEnter={()=>setCursor(i)} onClick={()=>choose(item.href)} className={i===cursor?"pc-switch-selected":""}>
            <Icon size={17} aria-hidden="true"/><span>{item.label}<small>{item.section}</small></span><ArrowRight size={15} aria-hidden="true"/>
          </button>;})}
          {matches.length===0&&<p className="pc-switch-empty">No matching tools. Try “pages”, “media” or “settings”.</p>}
        </div>
        <p className="pc-switch-help">↑ ↓ Select · Enter Open · Esc Close · Ctrl/Cmd + K</p>
      </div>
    </div>}
  </>;
}
