# Agent Instructions

This is a static personal website. Keep changes small, dependency-free, and easy to inspect in a browser.

## Project Shape

- `index.html` is the homepage and should stay mostly structural.
  - It mounts `<article-index>` for article previews.
  - It contains the Side Projects and Daily Reading link sections.
- `about.html` is the standalone About page.
- `articles/` contains migrated article pages.
- `components.js` owns reused dynamic UI:
  - `<site-header>` renders the shared site header.
  - `<site-footer>` renders the shared site footer.
  - `<article-index>` renders the homepage article previews.
  - `<article-sidebar>` renders the "More Articles" sidebar on article pages.
  - `markExternalLinks()` makes outbound HTTP(S) links open in a new tab with `rel="noopener noreferrer"`.
- Article-specific interactive widgets should live in the article HTML, with article-local script at the bottom of that page.
- `styles.css` is the single shared stylesheet.
- `assets/` contains local images and `resume.pdf`.

## Editing Rules

- Do not add a build step unless explicitly requested.
- Do not add framework dependencies for basic content changes.
- Keep article metadata in `components.js` as the single source for article lists.
- Do not hardcode article previews directly in `index.html`.
- Keep shared header and footer markup in `components.js`; pages should use `<site-header>` and `<site-footer>`.
- Keep side project links on the homepage unless they become reused elsewhere.
- Do not manually add `target="_blank"` to every external link; `components.js` handles outbound HTTP(S) links centrally.
- Do not turn `components.js` into a dumping ground for one-off article demos. Put one-off widget markup and behavior in that article's HTML.
- Use shared CSS classes in `styles.css` only when styling is broadly reusable or needed for a polished article widget.
- When adding a new article:
  1. Add the article HTML file under `articles/`.
  2. Add one entry to `ARTICLES` in `components.js`.
  3. Use `<site-header root="../"></site-header>` and `<site-footer root="../"></site-footer>`.
  4. Add `<article-sidebar current="new-slug"></article-sidebar>` to the article page.
  5. Include `<script src="../components.js" defer></script>` on the article page.

## Verification

After edits, check:

- Local `href` and `src` paths resolve.
- `node --check components.js` passes after JavaScript edits.
- No old WordPress asset/page URLs were reintroduced.
- The homepage article list is not hardcoded in `index.html`.
- Header and footer markup are not duplicated in individual pages.
- Article pages still include the shared sidebar component.
- Every HTML page loads `components.js` with the correct relative path.
- Article-specific inline scripts pass a syntax check when practical.
- The site works by opening `index.html` directly, without a dev server.
