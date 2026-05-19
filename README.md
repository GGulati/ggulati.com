# GGulati.com

Static personal website for technical articles, daily reading links, side projects, and RSS. The source is Astro, and the deployable site is plain static HTML/CSS/JS in `dist/`.

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
|-- scripts/deploy-rclone.ts  Manual rclone upload of dist/
`-- dist/                  Build output, ignored by git
```

Astro is used only as a build step. There is no backend requirement for hosting.

## Routes

- `/index.html`: five most recent feed items, followed by side projects.
- `/posts.html`: full reverse-chronological feed of articles and daily reading posts.
- `/about.html`: standalone About page.
- `/articles/YYYY/slug.html`: long-form articles.
- `/links/YYYY/MM-DD.html`: daily reading posts.
- `/rss.xml`: combined RSS feed for articles and daily reading posts.

## Content

Add articles as Markdown files under `src/content/articles/YYYY/`. Feed entries and sidebars are derived from frontmatter dynamically.

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

1. Install `rclone`.
2. Copy `.deploy.env.example` to `.deploy.env`.
3. Set `RCLONE_REMOTE` and `RCLONE_REMOTE_DIR`. Use `RCLONE_REMOTE=:ftp` with the FTP settings in `.deploy.env`, or use a named rclone remote such as `godaddy`.
4. Run `npm run build`.
5. Validate with `npm run deploy:dry`.
6. Deploy with `npm run deploy`.

`.deploy.env` is gitignored. The default deploy mode is `rclone copy`, which upserts new and changed files from `dist/` without deleting remote files. Use `npm run deploy:sync:dry` to preview an exact sync, and only use `npm run deploy:sync` after setting `RCLONE_ALLOW_SYNC=true`.

If the FTP endpoint is an IP address whose certificate expects a separate TLS server name, rclone cannot pass that server name independently. Set `RCLONE_FTP_NO_CHECK_CERTIFICATE=true` only for that hosting setup.

Inline FTP deploys use rclone's `--inplace` mode because this host does not allow replacing an existing file via temp-file rename.
