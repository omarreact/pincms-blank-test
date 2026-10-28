# PinCMS Blank Test — Fresh Standalone Installation

This repository is **your own independent Next.js + React + TypeScript CMS** for first-run testing. It is not the PinCMS documentation/product website and contains **no default administrator or preconfigured example login**.

## Start testing in your browser on Vercel

**Test domain:** https://pincms-blank-test.vercel.app

**First-run installer:** https://pincms-blank-test.vercel.app/admin/setup

The first-run setup has six stages:
1. **Welcome:** Start a blank PinCMS installation.
2. **Database:** Check the actual database connection and schema. On Vercel, a PostgreSQL `DATABASE_URL` must already be set in private environment variables. When the schema is absent, temporarily enable `PINCMS_AUTO_DB_PUSH=1` and redeploy the application to create the tables without resetting an existing database. Turn the flag off afterward.
3. **Media:** Select local storage (only on a local or persistent Node.js filesystem), previously configured Cloudinary environment credentials, new Cloudinary credentials (verified server-side, then encrypted before storage), or *configure later*. The latter prevents uploads on Vercel until storage is configured.
4. **Identity:** Set the site name and default theme.
5. **Administrator:** Choose your own name, email and unique password (12+ characters); this becomes the **Super Administrator**.
6. **Review & install:** Create the first user and private site settings in one database transaction; sign in from `/admin/login`.

### Required server environment variables (Vercel)

Configure private environment values in the Vercel project dashboard. **Never commit credentials to GitHub.**

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random private authentication/session secret (at least 24 characters) |
| `NEXTAUTH_URL` | `https://pincms-blank-test.vercel.app` for this test deployment |
| `PINCMS_SETUP_TOKEN` | A separate random private token (at least 24 characters), requested only for the remote first installation |
| `PINCMS_AUTO_DB_PUSH` | Optional temporary value `1` on a fresh test database to initialize the schema at build, then disable |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional preconfigured media storage, OR enter them inside the protected first-run wizard |

**Important:** The browser wizard never stores the PostgreSQL password or changes Vercel environment variables. The host/database provider is configured first; the wizard verifies it before the administrator can be created.

Cloudinary credentials entered into the wizard are tested server-side, then encrypted at rest in the database using a key derived from `NEXTAUTH_SECRET`. Changing `NEXTAUTH_SECRET` later invalidates this encrypted setting; configure Cloudinary via environment variables or reconfigure storage before rotating the secret.

The first-run installer is **single use**: when an administrator exists, `/admin/setup` shows a sign-in link instead of recreating users. The repository and deployment process **never automatically delete a user, reset databases, or print passwords**. For a truly new installation when the existing database is already initialized, provision an **empty separate database** and update the Vercel `DATABASE_URL`; do not delete live data.

## Local installation (Windows, macOS, Linux)

Install Node.js 22 or 24, then run:

```bash
git clone https://github.com/omarreact/pincms-blank-test.git
cd pincms-blank-test
npm install
npm run dev
```

Open http://localhost:3000/admin/setup. The development launcher creates private `.env.local` secrets and a local SQLite database safely without overwriting existing records. A localhost-only installation does not need a remote setup token.

## After installation

Sign in at `/admin/login`, then visit Pages, Posts, Forms & submissions, Media Library, Theme Studio and Settings. Upload a small real JPEG/PNG/WebP/GIF (8 MB maximum), save a page as a draft, then publish and verify the public URL.

This test branch includes the PinCMS Studio nested visual editor and expanded widget catalog. There are **120 registered widget names**: 29 existing and 91 additional catalog entries. **45 integration-only widgets** (WordPress/WooCommerce/payment/providers) are visibly gated until their required backends are connected. Native equivalents are not the official Elementor Pro plugin and several renderers remain basic.

### Studio editor testing

After installing/signing in, go to **Admin → Pages → New**. In the editor, drag **Container → Row → Column** or **Grid** elements onto the canvas, then add text, image, forms or other supported widgets inside. Use **Layers** to inspect the structure, the right inspector for content/style, and the device buttons for different responsive widths. Save a draft, publish, reopen and verify the public route.

The media chooser uses the project's existing authenticated media API. On Vercel, file uploads require Cloudinary or another persistent storage configuration; the first-run installer remains the authoritative configuration flow.

The standalone editor rejects unsupported provider-only widgets rather than displaying nonfunctional checkout or account interfaces. Keep production database credentials and administrator sessions unchanged during upgrades.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Source documentation: https://pincms.pincodeit.com/docs/quickstart

**Security:** Never share your admin password, setup token, PostgreSQL URL, or Cloudinary API secret in public issues or chat screenshots.
