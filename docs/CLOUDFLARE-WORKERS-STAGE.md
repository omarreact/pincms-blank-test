# PinCMS Cloudflare Workers isolated stage

Goal: run latest standalone Next.js PinCMS build on a separate Cloudflare Worker without changing the current Vercel production alias, environment or database schema.

Worker: `pincms-workers-stage` (no custom domain). Source: `cloudflare/pincms-workers-stage-20261101`. Production alias on Vercel is unchanged.

## Build and deploy

- Requires Node.js 22 or 24.
- Run `npm install`, `npm run cf:build`, then `npm run cf:publish`.
- Workers Builds: root `/`, build `npm run cf:build`, deploy `npm run cf:publish`.
- Prisma Client for Workers is generated from `prisma/schema.cloudflare.prisma` and uses an engine-less PostgreSQL driver adapter, while `prisma/schema.prisma` stays the SQLite local schema and the Vercel schema is unchanged.
- The database schema is **not** pushed or reset as part of Cloudflare builds.
- Cloudflare Node.js compatibility is enabled in `wrangler.jsonc`.

## Required runtime secrets

Set them under Cloudflare Workers > `pincms-workers-stage` > Settings > Variables and Secrets or using `wrangler secret put`.

- `DATABASE_URL`: existing managed PostgreSQL URL, if approved for read/write from Workers; never paste into source control.
- `NEXTAUTH_SECRET`: existing private session secret or an independent strong secret for the separate hostname.
- `NEXTAUTH_URL`: the final **verified** `https://<worker>.<account>.workers.dev` URL.
- `PINCMS_SETUP_TOKEN`: remote installer token only if the target DB has no administrator.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: optional persistent media (no local uploads on Workers).

**Do not copy secrets into GitHub CI logs.** Keep `PINCMS_AUTO_DB_PUSH` unset. Never expose a new admin installer without strong auth and private setup token.

## Validation gates

1. Cloudflare build produces a valid .open-next Worker; verify public routes in the actual workerd runtime, not only npm build.
2. `/api/health` reports database connected before any editor or publishing tests.
3. Verify login, /admin denial to anonymous users, draft saving, nested drag-and-drop, publish/reopen, page rendering, media upload and forms.
4. Verify Cloudflare Workers persistent DB adapter does not share request-scoped IO between requests, under concurrency.
5. Check deployment logs for Prisma/NextAuth and Cloudinary errors; test all routes/CSRF/preview.
6. Only then consider mapping any custom domains; keep Vercel as rollback.

**Current limitation:** no production cutover is authorized by this staging configuration. Missing runtime database credentials must keep the instance from being advertised as functional.
