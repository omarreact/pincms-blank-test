# Forex Trade Technology — PinCMS integration contract

**Status:** specification only; a working Forex content adapter is not yet implemented.
**Source:** omarreact/Forex-Trade-Technology-Omar (Next.js 15).
**Rule:** Never modify the existing Forex production deployment, database, DNS, or visual design without a tested staging release and approval.

## Product goal
Make the client experience familiar to WordPress + Elementor Pro while using only original Next.js/React/TypeScript CMS components. This is not WordPress PHP, Elementor licensed code or plugin binary compatibility.

## Observed source architecture
- 13 authored JSON pages are imported by content/index.ts.
- content/schema/page.ts defines PageData with id, slug, seo, hero, pageTop and sections.
- content/site.config.json stores canonical URLs, navigation tree, header CTA and footer settings.
- content/schema/render-map.json maps sections to existing React renderers and overrides.
- theme/theme.json and theme/tokens.ts define brand and media keys.
- parts/SiteHeader.tsx and parts/SiteFooter.tsx render shared navigation and footer.
- app/[...slug]/page.tsx uses static params. CMS publishing cannot be dynamic until the page loading model changes.

## Required editor-to-renderer mapping
| Client edits | Stored model | Preserve in live site |
| --- | --- | --- |
| Home hero | PageData.hero | Existing responsive slider |
| Service page section | PageData.sections with stable IDs | Current React layout and CSS |
| Navigation | siteConfig.navigation | Existing dropdown structure |
| Header/footer CTA | siteConfig, shared template part | Brand, social links, responsive header/footer |
| Global colors and fonts | Design tokens | Existing theme variables |
| SEO title/canonical | PageData.seo | Next.js Metadata and sitemap |
| Forms and leads | Secured form config/submissions | Real contact integration |
| Media | Asset registry and external storage | Media keys, alt text, image optimization |

## Non-negotiable functional acceptance
1. The client can log in, see all 13 pages, open a page in a visual editor and select real sections.
2. Text, media, layout, header, footer, navigation and page SEO can be edited with usable responsive controls.
3. Save Draft cannot change published output. Preview is private and accurately uses the public React renderer.
4. Publish is authorized, transactional and versioned; re-opening, reverting and scheduling preserve content.
5. Existing contact submissions, SEO metadata, URLs, redirects and images continue working.
6. Edits do not require redeploying Next.js code; a server-only content adapter reads published CMS documents.
7. Public page bundles must not include the authenticated visual builder and admin dependencies.
8. Visual regression and browser E2E tests verify desktop, tablet, mobile and client role permissions.

## Implementation order
**Gate 0:** Make full backups; set up disposable PostgreSQL, media provider, staging URL, build tests and parity fixtures. Retain Vercel production.
**Gate 1:** Import all JSON page/site/theme contracts read-only with precise ID and URL mapping; verify before enabling edits.
**Gate 2:** Build editable atomic draft/live revisions, template parts, responsive widget registry, dynamic tags and permissions.
**Gate 3:** Connect runtime content adapter to Forex Server Components, add cache revalidation on publish, secure draft preview and real media/forms.
**Gate 4:** Add provider-gated Pro workflows (popups, forms, CRM, loops, custom types, optional commerce), then test security and accessibility.

## Performance constraints
Prefer server-rendered public components and on-demand caching. Load builder/drag-and-drop only in the authenticated editor. Measure Core Web Vitals (target p75: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1). These are unverified goals, not existing measurements.

**Release rule:** do not cut over forextrade.pincodeit.com until a client can log in, edit an existing header/page, save draft, preview, publish, reload and restore the prior revision without layout or content regression.
