# Your Next.js website — powered by PinCMS

**FRESH STARTER — this ZIP installs your own Next.js website and private CMS admin, not the PinCMS product/documentation website.**

## Install on Windows, macOS or Linux

1. Install Node.js 22 or 24 and npm.
2. Extract the downloaded ZIP; open the enclosed **PinCMS** directory.
3. Open a terminal in the same directory as package.json.
4. Run:

~~~cmd
npm install
npm run dev
~~~

5. Open http://localhost:3000/admin/setup and create **your own website name, administrator account and password**. No demo administrator account is supplied.
6. Use http://localhost:3000/admin to design and publish your own site.

**Windows 11:** After extraction, open the inner PinCMS folder in File Explorer, click the address bar, enter cmd, press Enter, and run the commands above. The local server binds to 127.0.0.1.

The development launcher generates missing private .env.local secrets, initializes SQLite tables and preserves existing local records. Never commit or share .env.local.

## Build your own website

This is an independent Next.js + React + TypeScript app, not a WordPress installation, static HTML documentation site, or hosted SaaS.

- Your public homepage is src/app/page.tsx. Initially it has only a neutral starter screen. After creating your administrator, publish a page with slug home to replace that screen.
- Your pages, posts, SEO content, themes, visual block editor, media and team tools live under /admin, protected by credentials and role checks.
- Build your own routes and React components under src/app and src/components.
- The active theme and configured site name control your public website’s identity.
- Prisma manages the database; SQLite is for local development and PostgreSQL for hosted deployments.

**This package does NOT include the PinCMS marketing homepage, documentation routes (/docs), or the product’s public /showcase demo.** Those exist only at https://pincms.pincodeit.com.

## Verify your installation

~~~cmd
npm test
npm run typecheck
npm run build
~~~

## Deploy your application

Hosted CMS installations require persistent PostgreSQL, a correctly configured NEXTAUTH_URL, private NEXTAUTH_SECRET and PINCMS_SETUP_TOKEN, and persistent media storage such as Cloudinary. Local SQLite and local file uploads are not durable on Vercel. Do not copy developer credentials from the public product site.

## Support and documentation

Installation guide: https://pincms.pincodeit.com/docs/quickstart

Developer documentation: https://pincms.pincodeit.com/docs/overview

WordPress migration is beta; review any imported drafts before publication. A successful development build alone does not establish production readiness.
