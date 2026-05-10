# GGulati.com

Static personal website for technical articles, daily reading links, and side projects. The source is Astro, and the deployable site is plain static HTML/CSS/JS in `dist/`.

## Architecture

```text
.
|-- src/
|   |-- components/        Shared Astro components
|   |-- content/
|   |   |-- articles/      Markdown articles by year
|   |   |-- links/         Daily reading JSON posts
|   |   `-- side-projects.json
|   |-- layouts/           Shared page shell
|   |-- lib/               Content loaders
|   |-- pages/             Static and dynamic routes
|   |-- styles/            Global CSS
|   `-- widgets/           Article widget renderers
|-- public/assets/         Static assets copied into the built site
|-- scripts/deploy-ftp.ts  Manual FTP upload of dist/
`-- dist/                  Build output, ignored by git
```

Astro is used only as a build step. There is no backend requirement for hosting.

## Routes

- `/index.html`: homepage with article previews, side projects, and the three most recent daily reading posts.
- `/about.html`: standalone About page.
- `/links.html`: static archive of all daily reading posts.
- `/articles/YYYY/slug.html`: long-form articles.
- `/links/YYYY/MM-DD.html`: daily reading posts.

## Content

Add articles as Markdown files under `src/content/articles/YYYY/`. Article previews and sidebars are derived from frontmatter dynamically.

Add daily reading posts as JSON files under `src/content/links/`. The legacy link export was used for the initial bootstrap only; normal builds do not read or regenerate from it.

Article-specific demos use explicit widget slots in Markdown, with the implementation kept in `src/widgets/ArticleWidgets.astro`.

## Commands

```bash
npm install
npm run dev
npm run build
```

On a Windows machine, use `cmd /c npm run build` from PowerShell.

## Deployment

1. Copy `.deploy.env.example` to `.deploy.env`.
2. Fill in FTP credentials and remote directory.
3. Run `npm run build`.
4. Run `npm run deploy`.

`.deploy.env` is gitignored. The deploy script uploads `dist/` and requires `FTP_CLEAR_REMOTE=true` so replacing the remote directory is explicit.
