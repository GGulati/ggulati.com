# Agent Instructions

This is a static personal website built with Astro. Keep changes small, inspectable, and deployable as plain static files.

## Project Shape

- `src/pages/` defines routes.
  - `src/pages/index.astro` is the homepage.
  - `src/pages/posts.astro` is the full posts page.
  - `src/pages/about.astro` is the standalone About page.
  - `src/pages/articles/[year]/[slug].astro` renders article pages.
  - `src/pages/links/[year]/[monthDay].astro` renders daily link pages.
- `src/layouts/BaseLayout.astro` owns the shared HTML shell, header/footer placement, global stylesheet import, and outbound-link behavior.
- `src/components/` contains reused Astro components:
  - `SiteHeader.astro`
  - `SiteFooter.astro`
  - `FeedList.astro`
  - `ArticleSidebar.astro`
  - `SideProjects.astro`
- `src/content/articles/YYYY/*.md` contains migrated articles.
- `src/content/links/*.json` contains daily reading posts.
- `src/content/side-projects.json` contains side project metadata.
- `src/lib/articles.js`, `src/lib/links.js`, and `src/lib/feed.js` normalize content for pages/components.
- `src/widgets/ArticleWidgets.astro` renders article-specific widget slots.
- `src/styles/global.css` is the shared stylesheet.
- `public/assets/` contains static assets copied directly to the built site.
- `public/web.config` is the static IIS configuration copied into `dist/` for GoDaddy Windows hosting.
- `scripts/deploy-rclone.ts` uploads `dist/` with rclone.

## Hosting And Build

- The hosted site must be static output from `dist/`.
- Do not add PHP.
- Do not add or deploy `.user.ini`; this site does not use PHP runtime settings.
- Do not add `App_Data` unless the site starts using Windows-hosted application data, which it currently does not.
- Do not require a Node.js backend at runtime.
- A Node/Astro build step is allowed.

## Styling

All shared styling lives in `src/styles/global.css`.

Key layout areas:

- Header and footer
- Homepage article previews
- Side projects section
- Unified homepage feed and daily link detail pages
- About page grid
- Article layout and sidebar
- Article body typography
- Reusable article widget styles

## Content Workflow

For daily Links imports from `links.txt` or copied transcripts, follow `LINKS.md`.

To add a new article:

1. Create `src/content/articles/YYYY/new-article-slug.md`.
2. Include frontmatter:
   - `title`
   - `date`
   - `slug`
   - `excerpt`
   - optional `widgets`
3. Put any local images under `public/assets/`.
4. If the article needs a demo, add an explicit slot such as `<div data-widget="name"></div>` in the Markdown and implement only that widget in `src/widgets/ArticleWidgets.astro`.

The homepage feed and article sidebars pick up articles automatically.

To add a daily Links post:

1. Create `src/content/links/YYYY-MM-DD.json`.
2. Preserve related links in the same group, such as article plus HN/Lobsters comments.
3. Use the quoted page title/headline as link text when available.
4. If a title cannot be retrieved, ask the user for the title.
5. Do not show per-link timestamps.

## Editing Rules

- Keep article metadata in Markdown frontmatter, not in page templates.
- Keep daily link content in `src/content/links/*.json`, not hardcoded into `index.astro`.
- The homepage should render the five most recent items from the combined article/link feed.
- The full posts page should render the same combined feed with article/link filters and batched infinite scrolling.
- Do not hardcode article previews directly in `index.astro`.
- Keep shared header and footer markup in `SiteHeader.astro` and `SiteFooter.astro`.
- Keep outbound HTTP(S) link behavior centralized in `BaseLayout.astro`.
- Do not turn shared components into a dumping ground for one-off article demos.
- Use shared CSS classes only when styling is broadly reusable or needed for a polished article widget.
- Avoid committing `dist/`, `.astro/`, `node_modules/`, `.deploy.env`, or fetched title caches.

## Verification

After edits, check:

- `cmd /c npm run build` passes. If Astro telemetry hits sandbox issues, run with `ASTRO_TELEMETRY_DISABLED=1`.
- Local `href` and `src` paths in `dist/**/*.html` resolve.
- Article pages render the shared sidebar component.
- The homepage and full posts page are derived from article and link content, not hardcoded.
- `links.html` is not generated; daily link detail pages remain available under `/links/YYYY/MM-DD.html`.
- `rss.xml` includes both articles and daily link posts.
- Bootstrapped link posts preserve all links and group related links where appropriate.
- Outbound HTTP(S) links open in a new tab via the shared script.
