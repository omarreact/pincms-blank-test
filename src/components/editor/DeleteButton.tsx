"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function DeleteButton({resource,id}:{resource:"pages"|"posts";id:string}){const router=useRouter();const [working,setWorking]=useState(false);return <button type="button" disabled={working} className="text-red-600 disabled:opacity-50" onClick={async()=>{if(!confirm("Permanently delete this item?"))return;setWorking(true);try{const r=await fetch(`/api/${resource}/${id}`,{method:"DELETE"});if(!r.ok)throw new Error("Delete failed");router.refresh()}catch(e){alert(e instanceof Error?e.message:"Unexpected error")}finally{setWorking(false)}}}>Delete</button>}
