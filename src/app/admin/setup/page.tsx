"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {ArrowLeft,ArrowRight,Blocks,Check,CheckCircle2,Cloud,Database,ExternalLink,HardDrive,Image as ImageIcon,KeyRound,LockKeyhole,RefreshCw,Rocket,Server,ShieldCheck,Sun,Moon,UserRoundPlus,WifiOff} from "lucide-react";

type SetupStatus={needed:boolean;databaseReady:boolean;databaseState:"connected"|"connection_failed"|"schema_missing";databaseProvider:string;hosted:boolean;
 localSetupAllowed:boolean;setupTokenConfigured:boolean;authConfigured:boolean;message?:string;media:{provider:string;configured:boolean;source:string}};
type CloudCredentials={cloudName:string;apiKey:string;apiSecret:string};
type Mode="local"|"cloudinary"|"existing"|"later";
const sections=[{title:"Welcome",sub:"Your new website",icon:Blocks},{title:"Database",sub:"Storage & security",icon:Database},
 {title:"Media",sub:"Images and assets",icon:ImageIcon},{title:"Identity",sub:"Brand & theme",icon:Sun},
 {title:"Administrator",sub:"Your private account",icon:UserRoundPlus},{title:"Review",sub:"Finish setup",icon:Rocket}];
const fieldClass="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
export default function SetupPage(){
 const [status,setStatus]=useState<SetupStatus|null>(null),[loading,setLoading]=useState(true),[checking,setChecking]=useState(false);
 const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[done,setDone]=useState(false);
 const [notice,setNotice]=useState(""),[mediaTest,setMediaTest]=useState<"idle"|"working"|"verified"|"failed">("idle");
 const [mediaMode,setMediaMode]=useState<Mode>("later"),[credentials,setCredentials]=useState<CloudCredentials>({cloudName:"",apiKey:"",apiSecret:""});
 const [siteName,setSiteName]=useState("My Website"),[theme,setTheme]=useState<"default"|"night">("default");
 const [name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[showPassword,setShowPassword]=useState(false),[token,setToken]=useState("");
 const refresh=useCallback(async()=>{
  setChecking(true);
  try{
   const response=await fetch("/api/setup/status",{cache:"no-store"});
   const next=await response.json() as SetupStatus;
   if(!response.ok||typeof next.databaseReady!=="boolean")throw Error("Could not determine installer status.");
   setStatus(next);
  }catch{setNotice("Could not connect to the installer status endpoint. Check the deployed application.");}
  finally{setLoading(false);setChecking(false)}
 },[]);
 useEffect(()=>{void refresh()},[refresh]);
 const hosted=status?.hosted??false;
 const remote=Boolean(status&&!status.localSetupAllowed);
 const databaseReady=Boolean(status?.databaseReady);
 const secureReady=Boolean(status?.authConfigured&&(!remote||status?.setupTokenConfigured));
 const mediaEnv=Boolean(status?.media.source==="environment"&&status.media.configured);
 const passwordStrong=password.length>=12&&password.length<=128;
 const tokenReady=!remote||token.length>=24;
 const completed=done||Boolean(status&&!status.needed&&!done);
 const progress=Math.round((step+1)/sections.length*100);
 const canContinue=step===0?true:step===1?databaseReady&&secureReady&&tokenReady:
  step===2?mediaMode==="cloudinary"?mediaTest==="verified":mediaMode!=="local"||!hosted:step===3?siteName.trim().length>=2:
  step===4?name.trim().length>=2&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&passwordStrong:step===5;
 function changeCredentials(key:keyof CloudCredentials,value:string){setCredentials(v=>({...v,[key]:value}));setMediaTest("idle")}
 function chooseMedia(mode:Mode){setMediaMode(mode);setMediaTest("idle");setNotice("")}
 async function verifyMedia(){
  setMediaTest("working");setNotice("");
  try{
   const result=await fetch("/api/setup/media-check",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({token,credentials})});
   const body=await result.json();
   if(!result.ok||!body.ok)throw Error(body.error||body.message||"Could not validate Cloudinary.");
   setMediaTest("verified");setNotice("Cloudinary credentials verified. Your files will have persistent storage.");
  }catch(e){setMediaTest("failed");setNotice(e instanceof Error?e.message:"Cloudinary connection could not be verified.")}
 }
 async function finish(){
  if(!canContinue||busy)return;
  setBusy(true);setNotice("");
  const media=mediaMode==="cloudinary"?{mode:"cloudinary",credentials}:{mode:mediaMode};
  try{
   const response=await fetch("/api/setup",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({siteName:siteName.trim(),theme,name:name.trim(),email:email.trim(),password,token,media})});
   const body=await response.json();
   if(!response.ok||!body.ok)throw Error(body.error||"Installation could not be completed.");
   setPassword("");setToken("");setCredentials({cloudName:"",apiKey:"",apiSecret:""});
   setDone(true);
  }catch(e){setNotice(e instanceof Error?e.message:"Installation error. Check database permissions.")}
  finally{setBusy(false)}
 }
 const readyLabel=status?.databaseReady?"Connected":status?.databaseState==="schema_missing"?"Missing tables":"Not connected";
 const title=done?"Installation complete":sections[step].title;
 if(loading)return <main className="flex min-h-[80vh] items-center justify-center bg-[#f5f7fc] p-6"><div role="status" className="flex items-center gap-3 text-sm font-semibold text-slate-700"><RefreshCw size={18} className="animate-spin"/> Checking PinCMS installation…</div></main>;
 if(completed)return <main className="min-h-screen bg-[#f5f7fc] px-5 py-20"><div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl shadow-slate-950/5">
  <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={36}/></div>
  <h1 className="text-3xl font-black tracking-tight text-slate-950">{done?"Your new website is ready!":"PinCMS is already installed"}</h1>
  <p className="mt-4 text-sm leading-7 text-slate-600">{done?"The Super Administrator was securely created. Sign in to upload media, build pages and customize your website.":"For security, the first-run installer is locked after an administrator has been created. Use your account to continue."}</p>
  <Link href="/admin/login" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white">Open administrator login <ArrowRight size={17}/></Link>
  <p className="mt-6 text-xs text-slate-400">No default credentials were generated or displayed.</p>
 </div></main>;
 return <main className="min-h-screen bg-[#f5f7fc] text-slate-900">
  <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
   <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><Blocks size={21}/></span> pin<span className="font-light">cms</span><span className="ml-2 rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">Installer</span></Link>
   <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldCheck size={15}/> Private first-run setup</div>
  </div></header>
  <div className="mx-auto grid max-w-7xl gap-8 px-5 py-9 lg:grid-cols-[286px_minmax(0,1fr)] lg:py-14">
   <aside className="h-fit rounded-3xl bg-[#111e37] p-6 text-white shadow-lg shadow-slate-950/10 lg:sticky lg:top-8">
    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-indigo-200"><Rocket size={13}/> Getting started</span>
    <h2 className="mt-6 text-2xl font-black tracking-tight">Your site.<br/><span className="text-indigo-300">Your way.</span></h2>
    <p className="mt-3 text-xs leading-6 text-slate-300">Six guided stages to prepare your own secure, independent Next.js CMS.</p>
    <ol className="mt-8 space-y-1">{sections.map((section,index)=><li key={section.title}><div className={"flex items-center gap-3 rounded-xl p-3 "+(index===step?"bg-white/12":"")}>
     <span className={"grid h-9 w-9 place-items-center rounded-lg "+(index<step?"bg-emerald-500/20 text-emerald-300":index===step?"bg-indigo-500 text-white":"bg-white/10 text-slate-400")}>{index<step?<Check size={16}/>:<section.icon size={16}/>}</span>
     <span><strong className={"block text-xs "+(index>=step+1?"text-slate-400":"text-white")}>{section.title}</strong><small className="mt-1 block text-[11px] text-slate-400">{section.sub}</small></span></div></li>)}</ol>
    <div className="mt-8 border-t border-white/15 pt-5"><div className="flex justify-between text-[11px] text-slate-300"><span>Setup progress</span><span>{progress}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-indigo-400 transition-all" style={{width:progress+"%"}}/></div></div>
   </aside>
   <section className="min-w-0">
    <div className="mb-7"><div className="mb-3 text-xs font-black uppercase tracking-[.2em] text-indigo-600">Step {step+1} of {sections.length}</div>
     <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{step===0?"Welcome to your new website":step===1?"Connect your database":step===2?"Set up media uploads":step===3?"Make it yours":step===4?"Create the administrator":"Review & install"}</h1>
     <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">{step===0?"A fresh PinCMS installation. You choose where the data, media and website live.":step===1?"Confirm durable data storage and the private installer key before creating your first account.":step===2?"Choose where your website images will be stored, with local and hosted options.":step===3?"Customize your site name and first design theme.":step===4?"Your own credentials will become the first Super Administrator.": "Confirm your configuration and initialize PinCMS."}</p></div>
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
     {step===0&&<div className="space-y-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Blocks size={30}/></div>
      <h2 className="text-2xl font-black">No preset logins. No demo content. Just your new CMS.</h2>
      <p className="max-w-2xl text-sm leading-7 text-slate-600">PinCMS is built with React, TypeScript and Next.js. It keeps the familiar WordPress-style installation flow but the application is entirely yours to develop and deploy.</p>
      <div className="grid gap-3 sm:grid-cols-3">{[[Database,"Persistent data","SQLite locally, PostgreSQL on Vercel"],[ImageIcon,"Your media","Local images or Cloudinary"],[UserRoundPlus,"Your admin","Private credentials set by you"]].map(([Icon,label,description])=><div key={String(label)} className="rounded-2xl border border-slate-200 p-4">{typeof Icon!=="string"&&<Icon size={22} className="mb-3 text-indigo-600"/>}<h3 className="text-sm font-bold">{label as string}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{description as string}</p></div>)}</div>
      <p className="rounded-xl bg-indigo-50 p-4 text-xs leading-6 text-indigo-800">This is the real installer, not a public demonstration. Creating the first administrator will initialize your private website.</p>
     </div>}
     {step===1&&<div className="space-y-5">
      <div className={"flex items-start gap-3 rounded-2xl border p-5 "+(databaseReady?"border-emerald-200 bg-emerald-50":"border-amber-200 bg-amber-50")}>
       {databaseReady?<CheckCircle2 size={23} className="shrink-0 text-emerald-700"/>:<WifiOff size={23} className="shrink-0 text-amber-700"/>}
       <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{status?.databaseProvider} · {readyLabel}</h2><button type="button" onClick={refresh} disabled={checking} className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700"><RefreshCw size={14} className={checking?"animate-spin":""}/> Check again</button></div>
        <p className="mt-2 text-xs leading-6 text-slate-600">{databaseReady?"The installed Prisma schema is reachable. Your content and accounts can be saved safely.":status?.message||"The database needs configuration."}</p></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
       <div className={"rounded-2xl border p-5 "+(!hosted?"border-indigo-400 bg-indigo-50":"border-slate-200")}><HardDrive size={21} className="mb-3 text-indigo-600"/><h3 className="font-bold">SQLite · Local</h3><p className="mt-2 text-xs leading-6 text-slate-500">Automatically initialized by <code>npm run dev</code> on your computer. Not suitable for Vercel filesystem persistence.</p></div>
       <div className={"rounded-2xl border p-5 "+(hosted?"border-indigo-400 bg-indigo-50":"border-slate-200")}><Cloud size={21} className="mb-3 text-indigo-600"/><h3 className="font-bold">PostgreSQL · Hosted</h3><p className="mt-2 text-xs leading-6 text-slate-500">Configured with DATABASE_URL in Vercel. Its PostgreSQL schema must be initialized before first use.</p></div>
      </div>
      {!databaseReady&&<div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-xs leading-7 text-amber-950">
       <b>How to finish database setup</b>
       <p className="mt-2">{hosted?"In Vercel → Project → Settings → Environment Variables, verify DATABASE_URL points to a PostgreSQL database. For a fresh test database, temporarily set PINCMS_AUTO_DB_PUSH=1 and redeploy. Then disable that flag and choose Check again.":"On your computer, run npm install and npm run dev from the PinCMS project folder to initialize local SQLite. Then choose Check again."}</p>
       <p className="mt-2">PinCMS never asks you to paste a database password into an anonymous setup page. Server credentials belong in your private hosting environment.</p>
      </div>}
      {!status?.authConfigured&&<div role="alert" className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-800">NEXTAUTH_SECRET is missing or invalid. Add a random secret of at least 24 characters to your hosting environment, then redeploy.</div>}
      {remote&&!status?.setupTokenConfigured&&<div role="alert" className="rounded-xl bg-amber-50 p-4 text-xs font-semibold text-amber-800">PINCMS_SETUP_TOKEN is missing or invalid. Configure it as a private Vercel environment variable and redeploy.</div>}
      {remote&&<label className="block text-xs font-bold text-slate-700">Private installation token <span className="font-normal text-slate-400">(from your hosting environment)</span>
       <input type="password" value={token} autoComplete="off" onChange={e=>setToken(e.target.value)} placeholder="Paste your server setup token" className={fieldClass}/>
       <span className="mt-2 block text-[11px] font-normal leading-5 text-slate-500">Required for remote setup. It is only sent with protected installation requests and is not saved in your browser.</span></label>}
     </div>}
     {step===2&&<div className="space-y-5"><h2 className="font-black">Choose media storage</h2>
      <div className="grid gap-3 sm:grid-cols-2">
       {([{id:"local",name:"Local project folder",desc:"Great for local development or persistent VPS storage.",icon:HardDrive,disabled:hosted},
          {id:"cloudinary",name:"Cloudinary",desc:"Durable image storage, suitable for Vercel and other hosts.",icon:Cloud,disabled:false},
          {id:"existing",name:"Hosted credentials",desc:"Use Cloudinary credentials already configured as environment variables.",icon:Server,disabled:!mediaEnv},
          {id:"later",name:"Configure later",desc:"Continue setup now; hosted uploads stay unavailable until configured.",icon:ImageIcon,disabled:false}] as const).map(item=><button type="button" key={item.id} disabled={item.disabled} aria-pressed={mediaMode===item.id} onClick={()=>chooseMedia(item.id)} className={"rounded-2xl border p-5 text-left transition "+(mediaMode===item.id?"border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100":"border-slate-200 hover:border-indigo-300")}>
        <item.icon size={23} className="mb-3 text-indigo-600"/><h3 className="text-sm font-bold">{item.name}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{item.desc}</p>{item.disabled&&<small className="mt-2 block font-semibold text-amber-600">{item.id==="local"?"Not durable on Vercel":"Not configured"}</small>}
       </button>)}</div>
      {mediaMode==="cloudinary"&&<div className="space-y-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
       <h3 className="font-bold">Connect Cloudinary securely</h3><p className="text-xs leading-6 text-slate-600">Credentials are verified server-side and encrypted using your private authentication secret before being saved in the CMS database.</p>
       {([{label:"Cloud name",key:"cloudName",placeholder:"my-cloud",type:"text"},{label:"API key",key:"apiKey",placeholder:"Numeric API key",type:"text"},{label:"API secret",key:"apiSecret",placeholder:"Cloudinary API secret",type:"password"}] as const).map(item=><label key={item.key} className="block text-xs font-bold text-slate-700">{item.label}<input type={item.type} autoComplete="off" placeholder={item.placeholder} value={credentials[item.key]} onChange={e=>changeCredentials(item.key,e.target.value)} className={fieldClass}/></label>)}
       <button type="button" disabled={mediaTest==="working"||!credentials.cloudName||!credentials.apiKey||!credentials.apiSecret||!tokenReady} onClick={verifyMedia} className="inline-flex items-center gap-2 rounded-lg border border-indigo-400 px-4 py-2.5 text-xs font-bold text-indigo-700"><RefreshCw size={15} className={mediaTest==="working"?"animate-spin":""}/>{mediaTest==="working"?"Testing connection…":"Test Cloudinary connection"}</button>
       {mediaTest==="verified"&&<span className="ml-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><CheckCircle2 size={14}/> Verified</span>}
      </div>}
      {mediaMode==="later"&&<p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800">You can proceed, but uploads on Vercel will not work until durable storage is configured. For a complete media test, choose Cloudinary before finishing.</p>}
     </div>}
     {step===3&&<div className="space-y-6">
      <label className="block text-xs font-bold text-slate-700">Website name<input className={fieldClass} value={siteName} maxLength={100} onChange={e=>setSiteName(e.target.value)}/><span className="mt-2 block text-[11px] font-normal text-slate-500">The name displayed in your website header and browser title.</span></label>
      <h2 className="font-black">Choose your starting theme</h2>
      <div className="grid gap-4 sm:grid-cols-2">{([{id:"default",label:"Bright Studio",icon:Sun,bg:"#f8faff",fg:"#18223a",accent:"#4657e8"},{id:"night",label:"Midnight",icon:Moon,bg:"#10192c",fg:"#f0f4ff",accent:"#7c90ff"}] as const).map(item=><button key={item.id} type="button" aria-pressed={theme===item.id} onClick={()=>setTheme(item.id)} className={"overflow-hidden rounded-2xl border text-left "+(theme===item.id?"border-indigo-500 ring-2 ring-indigo-100":"border-slate-200")}>
       <div className="h-40 p-5" style={{background:item.bg,color:item.fg}}><div className="flex justify-between text-xs font-bold"><span>◈ {siteName||"Your brand"}</span><span>☰</span></div><div className="mt-9 max-w-[220px] text-lg font-black">Your ideas start here.</div><div className="mt-3 h-2 w-24 rounded-full" style={{background:item.accent}}/></div><div className="flex items-center justify-between p-4"><b>{item.label}</b>{theme===item.id?<CheckCircle2 size={18} className="text-indigo-600"/>:<item.icon size={18} className="text-slate-400"/>}</div>
      </button>)}</div>
      <p className="text-xs leading-6 text-slate-500">All styles and colors can be changed later from Appearance / Theme Studio. No sample pages or users will be created.</p>
     </div>}
     {step===4&&<div className="space-y-5"><div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-4 text-xs leading-6 text-indigo-900"><LockKeyhole size={21} className="shrink-0"/>This user receives the Super Administrator role. No password or administrator is pre-filled.</div>
      <label className="block text-xs font-bold text-slate-700">Full name<input className={fieldClass} value={name} autoComplete="name" maxLength={100} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>
      <label className="block text-xs font-bold text-slate-700">Email address<input type="email" className={fieldClass} value={email} autoComplete="email" maxLength={200} onChange={e=>setEmail(e.target.value)} placeholder="admin@yourdomain.com"/></label>
      <label className="block text-xs font-bold text-slate-700">Strong password<div className="relative"><input type={showPassword?"text":"password"} autoComplete="new-password" className={fieldClass} value={password} maxLength={128} onChange={e=>setPassword(e.target.value)} placeholder="At least 12 characters"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute right-3 top-4 text-xs font-bold text-indigo-600">{showPassword?"Hide":"Show"}</button></div>
       <span className={"mt-2 block text-[11px] font-normal "+(passwordStrong?"text-emerald-700":"text-slate-500")}>{passwordStrong?"✓ Meets length requirement":"Minimum 12 characters. A unique password or passphrase is recommended."}</span></label>
      <p className="text-xs leading-6 text-slate-500">The password is hashed on the server. Setup is locked after the first account is created.</p>
     </div>}
     {step===5&&<div className="space-y-5"><div className="flex items-center gap-3"><ShieldCheck size={26} className="text-emerald-600"/><h2 className="text-xl font-black">Ready to initialize your CMS</h2></div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">{[["Website",siteName],["Database",status?.databaseProvider+" · "+readyLabel],["Media",mediaMode==="cloudinary"?"Cloudinary (encrypted credentials)":mediaMode==="existing"?"Cloudinary (environment)":mediaMode==="local"?"Local project folder":"Not configured yet"],["Theme",theme==="night"?"Midnight":"Bright Studio"],["Administrator",email]].map(([k,v])=><div key={k} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><span className="text-slate-500">{k}</span><b className="max-w-[60%] break-all text-right text-slate-800">{v}</b></div>)}</div>
      <p className="rounded-xl bg-emerald-50 p-4 text-xs leading-6 text-emerald-900">Finishing creates the first privileged account, site settings and an active theme in the connected database. This is a real installation and cannot be rerun without resetting the database yourself.</p>
      {mediaMode==="later"&&<p className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900">Media upload storage remains incomplete. You can still test pages and admin login; configure Cloudinary before testing uploads on Vercel.</p>}
     </div>}
     {notice&&<p role="alert" className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-xs leading-6 text-indigo-950">{notice}</p>}
     <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
      <button type="button" disabled={step===0||busy} onClick={()=>{setNotice("");setStep(n=>Math.max(0,n-1))}} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-40"><ArrowLeft size={16}/> Back</button>
      <button type="button" disabled={busy||!canContinue} onClick={()=>{setNotice("");if(step===5)void finish();else setStep(n=>n+1)}} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40">
       {busy?"Installing…":step===5?"Finish installation":"Continue"}{busy?<RefreshCw size={16} className="animate-spin"/>:<ArrowRight size={16}/>}</button>
     </div>
    </div>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span>PinCMS · Standalone Next.js CMS</span><a href="https://pincms.pincodeit.com/docs/quickstart" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600">Installation documentation <ExternalLink size={13}/></a></div>
   </section>
  </div>
 </main>;
}
