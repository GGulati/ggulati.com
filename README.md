# GGulati.com

Static personal website for technical articles.

## Architecture

The site is intentionally simple: plain HTML, one shared CSS file, one shared JavaScript component file, and local assets. There is no build step and no package manager requirement.

```text
.
|-- index.html
|-- about.html
|-- components.js
|-- styles.css
|-- articles/
`-- assets/
```

## Pages

- `index.html`: homepage with intro copy, dynamic article previews, side projects, and a links section.
- `about.html`: professional summary based on `assets/resume.pdf`.
- `articles/*.html`: individual long-form article pages.

## Shared Components

Reusable UI lives in `components.js`.

`<site-header>` renders the shared header. `<site-footer>` renders the shared footer. Use `root="../"` when rendering either component from pages inside `articles/`.

`ARTICLES` is the source of truth for article metadata:

- `slug`
- `title`
- `date`
- `href`
- `excerpt`

`<article-index>` renders the homepage article previews dynamically from `ARTICLES`.

`<article-sidebar current="...">` renders the "More Articles" sidebar on article pages, excluding the current article by slug.

## Styling

All styling lives in `styles.css`.

Key layout areas:

- Header and footer
- Homepage article previews
- Side projects section
- Links section
- About page grid
- Article layout and sidebar
- Article body typography

## Content Workflow

To add a new article:

1. Create `articles/new-article-slug.html`.
2. Use the existing article page structure:
   - shared header
   - `<main class="article-shell">`
   - `<div class="article-layout">`
   - `<article class="article-content">`
   - `<article-sidebar current="new-article-slug"></article-sidebar>`
   - `<site-footer root="../"></site-footer>`
   - `<script src="../components.js" defer></script>`
3. Add the article metadata to `ARTICLES` in `components.js`.
4. Put any local images under `assets/`.

The homepage will pick up the new article automatically from `components.js`.

## Running Locally

Open `index.html` directly in a browser. No dev server is required.
