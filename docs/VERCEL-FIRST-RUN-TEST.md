# Test a fresh PinCMS installation on Vercel

**Test URL:** https://pincms-blank-test.vercel.app/admin/setup

This repository contains a complete standalone Next.js CMS, not the marketing/documentation website. The repository intentionally has **no seeded administrator or default password**. First-run setup remains locked as soon as any user exists in the connected database.

## Before opening the installer

1. Import this repository in Vercel and ensure the **Production** deployment uses the latest `main` commit.
2. Connect a **fresh, empty, persistent PostgreSQL database** to the production environment as `DATABASE_URL`. The wizard detects and validates it, but it cannot provision a managed database in an unauthenticated browser.
3. Set `NEXTAUTH_URL=https://pincms-blank-test.vercel.app`, a unique random `NEXTAUTH_SECRET` and a separate unique random `PINCMS_SETUP_TOKEN`. These must be **server-side environment variables**, never committed or added to public `NEXT_PUBLIC_*` variables.
4. If the new database has no tables, set `PINCMS_AUTO_DB_PUSH=1` for **the first production build only** and redeploy. Once schema creation succeeds, set it to `0` or remove it. This applies Prisma's PostgreSQL schema without destructive reset flags.
5. Set up persistent image storage. Cloudinary can be connected during the UI wizard; alternatively configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` securely in the Vercel environment and redeploy.

**Security:** The Vercel production domain is a public installation surface. Keep the setup token private, use a strong new admin password and complete the one-time setup before advertising the URL. Do not use a shared/demo database.

## First-run walkthrough (you control the input)

1. **Welcome** — read about the fresh Next.js CMS and its local/hosted workflow.
2. **Database** — select the detected database configuration, click **Check again**, confirm connected, and enter your **private installation token** for hosted setup. A red database status means the CMS is not ready; it must not allow creating the administrator.
3. **Media** — select Cloudinary, enter your own credentials and run the server-side connection check. For local development, Local project folder is available. Configure later is possible but hosted media uploads will not work until you connect storage.
4. **Identity** — enter your website name and choose Bright Studio or Midnight.
5. **Administrator** — provide your own name, email and a unique strong password. This is the first **Super Administrator**.
6. **Review** — complete the one-time installation. After success use `/admin/login` to sign in. Never share your password or setup token.

## Verify end-to-end

- Visit `/api/setup/status`; expect `databaseReady: true` and `needed: true` before setup.
- After setup, expect `needed: false`. The installer should show **already installed**, and a second POST must not create another privileged account.
- Log in at `/admin/login`, open `/admin`, create a draft page, update it through the visual editor and publish it.
- Upload a real image in `/admin/media`, then reload and retrieve the same media URL. Vercel ephemeral filesystem uploads are intentionally blocked.
- Open Theme Studio, test page rendering and Forms Studio. Sign out and verify admin routes require login.
- A green deployment build alone does **not** guarantee the persistent database or media provider is connected. Verify the live backend as a separate step.

## Local-only test

From a clean clone of this repository run `npm install` then `npm run dev`, open `http://localhost:3000/admin/setup`. The local launcher creates the required private settings and initializes SQLite without resetting existing local records. You can finish first-user setup without a remote installation token on actual localhost. Do not copy this local SQLite file into the Vercel deployment.

## Troubleshooting

- **Database connection failed:** Confirm the Production `DATABASE_URL` points to your PostgreSQL instance, it accepts TLS and outbound traffic, and redeploy after changing environment variables.
- **Database tables missing:** Initialize the production schema once with `PINCMS_AUTO_DB_PUSH=1`, then disable it. Never reset a database that already holds user data just to rerun the wizard.
- **Login unsuccessful:** Confirm `NEXTAUTH_URL` is the exact public domain and `NEXTAUTH_SECRET` is unchanged between deployments. A fresh admin requires the setup step to complete successfully.
- **Upload failed:** Cloudinary storage must be connected; local uploads are not durable in Vercel functions.
- **Installer already completed:** The shared database has at least one administrator; **do not delete it**. Use the legitimate login/recovery path or provision a separate empty test database.

This test deliberately retains native Next.js/React/TypeScript architecture. WordPress-like installation is a UX inspiration, not a WordPress runtime.
