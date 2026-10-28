import {createCipheriv,createDecipheriv,createHash,randomBytes} from "node:crypto";
import {prisma} from "@/lib/db";
import {cloudinaryCredentialsSchema,mediaOptionSchema} from "@/lib/validators";
import type {z} from "zod";
export type CloudinaryCredentials=z.infer<typeof cloudinaryCredentialsSchema>;
export type MediaOption=z.infer<typeof mediaOptionSchema>;

const settingKey="storage:media:v1";
function cryptoKey(){
 const secret=process.env.NEXTAUTH_SECRET;
 if(!secret||secret.length<24||secret.startsWith("GENERATE_"))throw new Error("NEXTAUTH_SECRET must be configured before saving media credentials");
 return createHash("sha256").update("PinCMS/media/v1:").update(secret).digest();
}
/** Encrypt credentials at rest. Never send them back to the browser or logs. */
export function sealCredentials(value:CloudinaryCredentials):string {
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",cryptoKey(),iv);
 const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
 return "v1:"+Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString("base64url");
}
export function unsealCredentials(payload:string):CloudinaryCredentials {
 if(!payload.startsWith("v1:"))throw new Error("Unsupported media credential format");
 const bytes=Buffer.from(payload.slice(3),"base64url");
 if(bytes.length<29)throw new Error("Invalid media credential payload");
 const decoder=createDecipheriv("aes-256-gcm",cryptoKey(),bytes.subarray(0,12));
 decoder.setAuthTag(bytes.subarray(12,28));
 const plain=Buffer.concat([decoder.update(bytes.subarray(28)),decoder.final()]).toString("utf8");
 return cloudinaryCredentialsSchema.parse(JSON.parse(plain));
}
export function environmentCloudinary():CloudinaryCredentials|null{
 const parsed=cloudinaryCredentialsSchema.safeParse({
  cloudName:process.env.CLOUDINARY_CLOUD_NAME,
  apiKey:process.env.CLOUDINARY_API_KEY,
  apiSecret:process.env.CLOUDINARY_API_SECRET
 });
 return parsed.success?parsed.data:null;
}
export async function resolvedCloudinary():Promise<CloudinaryCredentials|null>{
 const env=environmentCloudinary();if(env)return env;
 const value=(await prisma.setting.findUnique({where:{key:settingKey},select:{value:true}}))?.value;
 if(!value)return null;
 const record=JSON.parse(value) as {mode?:string;encrypted?:string};
 if(record.mode!=="cloudinary"||typeof record.encrypted!=="string")return null;
 return unsealCredentials(record.encrypted);
}
export async function mediaSettingStatus(){
 if(environmentCloudinary())return {provider:"cloudinary",configured:true,source:"environment"};
 try{
  const stored=(await prisma.setting.findUnique({where:{key:settingKey},select:{value:true}}))?.value;
  if(stored){const setting=JSON.parse(stored) as {mode?:string};if(setting.mode==="cloudinary")return {provider:"cloudinary",configured:true,source:"encrypted"};
   if(setting.mode==="local")return {provider:"local",configured:!process.env.VERCEL,source:"setup"};
  }
 }catch{}
 return {provider:process.env.VERCEL?"unconfigured":"local",configured:!process.env.VERCEL,source:"default"};
}
export function storedMediaValue(option:MediaOption):string|null{
 if(option.mode==="existing")return null;
 if(option.mode==="cloudinary")return JSON.stringify({mode:"cloudinary",encrypted:sealCredentials(option.credentials)});
 return JSON.stringify({mode:option.mode});
}
export async function verifyCloudinary(credentials:CloudinaryCredentials):Promise<{ok:boolean;message:string}>{
 const parsed=cloudinaryCredentialsSchema.parse(credentials);
 try{
  const auth=Buffer.from(parsed.apiKey+":"+parsed.apiSecret).toString("base64");
  const response=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(parsed.cloudName)+"/resources/image?max_results=1",{
   method:"GET",headers:{Authorization:"Basic "+auth,Accept:"application/json"},cache:"no-store",signal:AbortSignal.timeout(8000)
  });
  if(response.ok)return {ok:true,message:"Cloudinary connection verified"};
  return {ok:false,message:response.status===401||response.status===403?"Cloudinary refused these credentials or permissions.":"Cloudinary connection could not be verified ("+response.status+")."};
 }catch{return {ok:false,message:"Cloudinary could not be reached. Check your network or retry."}}
}
