/** Optional server-side Firebase service. Never expose service-account JSON in a client bundle. */
import "server-only";
import {initializeApp,getApps,cert,type App} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
export function firestore(){
 const service=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
 if(!service)return null;
 const parsed=JSON.parse(service);
 if(typeof parsed.project_id!=="string"||typeof parsed.private_key!=="string"||typeof parsed.client_email!=="string")throw new Error("Invalid Firebase service account");
 const app:App=getApps()[0]??initializeApp({credential:cert({projectId:parsed.project_id,privateKey:parsed.private_key,clientEmail:parsed.client_email})});
 return getFirestore(app);
}
/** Explicit one-way publishing mirror. Primary user/auth/config storage stays Prisma. */
export async function mirrorPageToFirestore(page:{id:string;slug:string;title:string;status:string;seoTitle?:string|null;seoDesc?:string|null},blocks:unknown[]){
 const db=firestore();if(!db)return false;
 await db.collection("pincms_pages").doc(page.id).set({slug:page.slug,title:page.title,status:page.status,seoTitle:page.seoTitle??null,seoDesc:page.seoDesc??null,blocks,syncedAt:new Date().toISOString()});return true;
}
export async function verifyFirebase(){const db=firestore();if(!db)return {configured:false};await db.collection("pincms_health").doc("connection").set({checkedAt:new Date().toISOString()});return {configured:true,project:getApps()[0]?.options.projectId??null};}
