import type {NextRequest} from "next/server";

/** Dev-only convenience for first-time setup. Never treats a production host as local. */
function loopback(hostname:string):boolean {
  return hostname==="localhost" || hostname==="127.0.0.1";
}

/** Read the request authority as the browser sent it, including port.
 * NextRequest.nextUrl.origin may be reconstructed from NEXTAUTH_URL or proxy headers
 * and can say localhost even when the browser and Host use 127.0.0.1.
 */
function actualHost(req:NextRequest):URL|null {
  const host=req.headers.get("host");
  if(!host || /[\s/@\\?#]/.test(host))return null;
  try {
    const parsed=new URL("http://"+host);
    return parsed.host.toLowerCase()===host.toLowerCase()?parsed:null;
  }catch{return null;}
}

export function localInstallerAllowed(req:NextRequest):boolean {
  const actual=actualHost(req);
  return process.env.NODE_ENV==="development" && !process.env.VERCEL &&
    actual!==null && loopback(actual.hostname) && loopback(req.nextUrl.hostname);
}

/** CSRF guard: compare Origin against the *actual* Host header including port.
 * Never relax to "both are localhost": different loopback hosts/ports still fail.
 * In production enforce the request protocol and the normal remote setup token.
 */
export function sameOrigin(req:NextRequest):boolean {
  const rawOrigin=req.headers.get("origin");
  const actual=actualHost(req);
  if(!rawOrigin || !actual)return false;
  try {
    const origin=new URL(rawOrigin);
    if(origin.origin!==rawOrigin)return false;
    if(origin.host.toLowerCase()!==actual.host.toLowerCase())return false;
    const expectedProtocol=localInstallerAllowed(req)?"http:":req.nextUrl.protocol;
    return ["http:","https:"].includes(origin.protocol) && origin.protocol===expectedProtocol;
  }catch{return false;}
}
