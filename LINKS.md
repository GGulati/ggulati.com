# Links Workflow

Use this workflow when updating `src/content/links/*.json` from `links.txt` or another copied transcript.

## Source Format

- `links.txt` may contain WhatsApp-style lines such as `[8:05 PM, 5/14/2026] Name: https://example.com`.
- Treat the message date as the link post date.
- Multiple URLs in the same message usually belong in the same group.
- Messages that say `related:` or `related/linked:` should be grouped with the nearby article or discussion link they refer to when the relationship is clear.

## JSON Format

- Create or update `src/content/links/YYYY-MM-DD.json`.
- Preserve this shape:

```json
{
  "date": "YYYY-MM-DD",
  "title": "Links for Month D, YYYY",
  "groups": [
    {
      "note": "",
      "links": [
        {
          "href": "https://example.com",
          "title": "Example title"
        }
      ]
    }
  ]
}
```

## Titles

- Use the quoted page title/headline as link text when available.
- For Hacker News, Lobsters, Reddit, and similar discussion pages, include the discussion source in the title, such as `Article title | Hacker News`.
- For PDFs, use the document title when it is available from the PDF or surrounding page.
- If a title cannot be retrieved confidently, ask the user to provide the title. Do not fall back to the raw URL unless the user explicitly tells you to.

## Grouping

- Keep article plus related discussion links in the same group.
- Keep cited papers, source documents, or `related:` links in the same group as the primary item when they were sent together or clearly refer to the same topic.
- Use `note` for transcript commentary that is not itself a title, such as `Related: ...`.
- Do not show or store per-link timestamps in the JSON.

## Verification

- Run `ASTRO_TELEMETRY_DISABLED=1 cmd /c npm run build`.
- Confirm the expected `/links/YYYY/MM-DD.html` routes are generated.
- Confirm the homepage still shows only the three most recent link days.
