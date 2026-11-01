import {PrismaClient} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const worker = process.env.PINCMS_RUNTIME === "cloudflare";
const globalForPrisma = globalThis as unknown as {prisma:PrismaClient|undefined};

// Prisma's Node binary query engine cannot run in Cloudflare Workers.
// The Worker-only generator uses engineType="client", plus the pg adapter.
// A non-routable placeholder lets the Next.js build produce the Worker bundle
// without embedding real database credentials; actual Worker secrets are required.
const connectionString = process.env.DATABASE_URL ||
  "postgresql://unconfigured:unconfigured@127.0.0.1:5432/unconfigured";
const createClient=()=>new PrismaClient({
  ...(worker?{adapter:new PrismaPg({connectionString})}:{}),
  log:process.env.NODE_ENV==="development"?["query","error","warn"]:["error"]
});
export const prisma=worker?createClient():(globalForPrisma.prisma??createClient());
if(!worker&&process.env.NODE_ENV!=="production")globalForPrisma.prisma=prisma;
