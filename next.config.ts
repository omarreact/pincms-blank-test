import type {NextConfig} from "next";
const nextConfig:NextConfig={
  reactStrictMode:true,
  // Keep tracing scoped to this CMS, not unrelated lockfiles in the Windows home directory.
  outputFileTracingRoot:process.cwd(),
  poweredByHeader:false,
  images:{dangerouslyAllowSVG:false},
  async headers(){return [{source:"/:path*",headers:[
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
    {key:"X-Frame-Options",value:"DENY"},
    {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
  ]}]},
};
export default nextConfig;
