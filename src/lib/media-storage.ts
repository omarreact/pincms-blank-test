import {createHash} from "node:crypto";
import {writeFile,mkdir} from "node:fs/promises";
import path from "node:path";
import {resolvedCloudinary} from "@/lib/installer-media";
const types:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif"};
export const MAX_IMAGE_BYTES=8*1024*1024;
export function imageMime(bytes:Buffer):string|null{
 if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return "image/jpeg";
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return "image/png";
 if(bytes.subarray(0,4).toString()==="RIFF"&&bytes.subarray(8,12).toString()==="WEBP")return "image/webp";
 if(["GIF89a","GIF87a"].includes(bytes.subarray(0,6).toString()))return "image/gif";return null;
}
export async function storeImage(bytes:Buffer,mime:string):Promise<{url:string;provider:string}>{
 const credentials=await resolvedCloudinary();
 if(credentials){
  const {cloudName:cloud,apiKey:key,apiSecret:secret}=credentials;
  const timestamp=Math.floor(Date.now()/1000);const folder="pincms";
  const signature=createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
  const form=new FormData();form.append("file",new Blob([new Uint8Array(bytes)],{type:mime}),`asset.${types[mime]}`);form.append("api_key",key);form.append("timestamp",String(timestamp));form.append("folder",folder);form.append("signature",signature);
  const response=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`,{method:"POST",body:form,signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Cloudinary rejected upload (${response.status})`);
  const result=await response.json();if(typeof result.secure_url!=="string")throw new Error("Cloudinary returned no URL");
  return {url:result.secure_url,provider:"cloudinary"};
 }
 // For dedicated Node servers/dev only. On Vercel files will not persist.
 if(process.env.VERCEL)throw new Error("Media storage is not configured. Set Cloudinary credentials in PinCMS installation or Vercel environment settings.");
 const uuid=crypto.randomUUID();const name=`${uuid}.${types[mime]}`;
 const dir=path.resolve(process.env.UPLOAD_DIR||"./public/uploads");await mkdir(dir,{recursive:true});await writeFile(path.join(dir,name),bytes,{flag:"wx"});
 return {url:`/uploads/${name}`,provider:"local"};
}
