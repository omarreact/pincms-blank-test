# WordPress migration

## WordPress → PinCMS migration

PinCMS offers a Next.js editing workflow and a path to reuse existing WordPress page and post content. **Migration is best-effort; it is not a pixel-perfect Elementor/Gutenberg converter.** Speed, security and SEO depend on real deployment conditions, not automatic promises of perfect Lighthouse scores.

## Before starting

1. **Back up WordPress**: database, media uploads, theme, plugin settings and existing redirects.
2. Install the **real PinCMS application** separately from this static documentation website. Use managed PostgreSQL and persistent Cloudinary media for hosted production.
3. Set up a PinCMS administrator and apply `npm run db:push` to create its migration tracking table.
4. Keep WordPress online throughout the content and URL audit.

## Option A: Import a WordPress XML export (WXR)

In WordPress open **Tools → Export → All content → Download Export File**. On the CMS installation, open **Admin → WordPress migration** and upload the XML file (up to 5 MB, with up to 250 page/post entries). Or use the CLI:

```bash
npm run migrate:wordpress -- --file=wordpress-export.xml
npm run migrate:wordpress -- --file=wordpress-export.xml --apply
```

The first command is a **dry run**; use `--apply` only after reviewing the preview. Configure the database and create a PinCMS administrator first.

## Option B: WordPress REST API

Enter your **public HTTPS WordPress origin** in the migration wizard. Public posts/pages may be available without credentials. For authenticated content access, use WordPress **Users → Profile → Application Passwords** and enter your username and application password. PinCMS uses credentials for the request but does **not** store the password.

For CLI imports, set the password as the secure environment variable `PINCMS_WORDPRESS_APP_PASSWORD`, not a command-line argument:

```bash
npm run migrate:wordpress -- --url=https://old.example --user=editor
npm run migrate:wordpress -- --url=https://old.example --user=editor --apply
```

REST import currently reads up to five pages of 50 entries for each content type, with a **250-item limit per run**. Larger sites require planned, tested batches or smaller WXR exports.

## Guided workflow

| Step | Description |
| --- | --- |
| 1. Connect | Upload WXR or enter WordPress REST URL and optional Application Password |
| 2. Select | Choose pages/posts and whether to update previous imports |
| 3. Preview | Inspect counts, slugs, converted blocks, and known limitations |
| 4. Import | Run in batches of 25 and view progress/warnings |
| 5. Review | Inspect unpublished content in the PinCMS editor |
| 6. Redirects | Review generated 301 rules for changed permalink paths |
| 7. Deploy | Verify the full site before switching DNS manually |

## Migration mapping and limits

| WordPress data | Current behavior |
| --- | --- |
| Pages/posts, titles/slugs/excerpts | Imported into **unpublished drafts** |
| Paragraphs/headings/images/lists | Converted best-effort to safe native blocks |
| Categories/tags | Imported and connected to blog posts |
| Yoast/Rank Math SEO fields | Common title/description fields mapped when present |
| Old permalink paths | 301 redirects generated when paths change |
| Repeat imports | Source IDs tracked; skips existing content unless `--update-existing` |
| Media library | **Not transferred**: references remain on WordPress URLs |
| Gutenberg nested structures, Elementor, shortcodes | Flattened where possible; manual layout remediation needed |
| User accounts/passwords/roles | **Not transferred**: create users securely in PinCMS |
| Menus, ACF, forms, plugin configurations | **Not migrated**: recreate before launch |

## Verify before switching domains

- Review totals, skipped records, missing images and URLs from the import report.
- Copy images into durable Cloudinary/local storage before retiring WordPress and replace remote media URLs.
- Compare headings, SEO titles, meta descriptions, canonical URLs, old permalinks and structured data.
- Recreate menus, form submissions and business-critical plugin features.
- Test 301 redirects and analytics with real production routes.
- Use identical test methods and hardware when measuring Next.js versus WordPress performance; do not claim unmeasured results.
- Keep complete backups and a rollback plan until launch is validated.

## Inspect status and redirects

```bash
npm run migrate:wordpress -- --status
npm run migrate:wordpress -- --redirects
```

**Availability:** The migration reader, importer, admin UI and CLI are included in source; a full end-to-end migration against a live hosted WordPress site has **not** been verified. No integrated one-click Vercel OAuth deployment or automatic DNS cutover is included. See [release status](/docs/roadmap/).
