import {NextResponse} from "next/server";
import {hasRole,denied} from "@/lib/security";
import {verifyFirebase} from "@/lib/firebase";
export const runtime="nodejs";
export async function POST(){if(!await hasRole("ADMIN"))return denied();try{return NextResponse.json(await verifyFirebase())}catch{return NextResponse.json({error:"Firebase configuration or Firestore permission is invalid"},{status:502})}}
