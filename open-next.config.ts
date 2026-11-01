import {defineCloudflareConfig} from "@opennextjs/cloudflare";

/** Cloudflare-only SSR adapter. Does not affect the existing Vercel build. */
export default defineCloudflareConfig();
