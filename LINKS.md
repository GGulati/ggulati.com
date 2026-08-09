# Links Workflow

Use this workflow when updating `src/content/links/*.json` from `links.txt` or another copied transcript.

## Source Format

- `links.txt` may contain WhatsApp-style lines such as `[8:05 PM, 5/14/2026] Name: https://example.com`.
- Treat the message date as the link post date.
- Multiple URLs in the same message usually belong in the same group.
- Messages that say `related:` or `related/linked:` should be grouped with the nearby article or discussion link they refer to when the relationship is clear.
- Before importing, inspect every message for signs that the copied transcript was truncated. Treat an ellipsis that cuts off a word (for example, `imagi…`), an abruptly unfinished sentence, or an unmatched opening delimiter at the end of a message as suspected truncation.
- If a message may be truncated, stop and ask the user for the missing continuation. Do not infer, summarize, omit, or import the incomplete commentary, and do not assume that repairing a broken ellipsis encoding makes the message complete.
- Repair transcript encoding artifacts such as `â€œ`, `â€™`, and `â€` before storing commentary or quoted text. Do not otherwise rewrite or summarize it.

## JSON Format

- Create or update `src/content/links/YYYY-MM-DD.json`.
- Preserve this shape:

```json
{
  "date": "YYYY-MM-DD",
  "title": "Links for Month D, YYYY",
  "groups": [
    {
      "id": "optional-stable-group-id",
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

- `id` is optional. Add a short, semantic, stable ID when another daily post needs to link directly to this group.
- Do not use a group number or array position as an ID; groups may be reordered later.

## Notes

- `note` is always Markdown. Plain text is valid Markdown and needs no opt-in flag.
- Use Markdown links for contextual references at their original positions in commentary, with meaningful link text: `[Solid Queue](https://example.com/solid-queue)`.
- Do not duplicate contextual commentary links in `links`. Reserve `links` for the primary item and directly associated discussion pages.
- Notes support paragraphs, hard line breaks, links, emphasis, strong text, and inline code. Do not use raw HTML, images, headings, or lists.
- Preserve user-provided commentary and quoted text rather than summarizing it. Keep embedded newlines when they carry structure.

## Titles

- Use the quoted page title/headline as link text when available.
- For Hacker News, Lobsters, Reddit, and similar discussion pages, include the discussion source in the title, such as `Article title | Hacker News`.
- For PDFs, use the document title when it is available from the PDF or surrounding page.
- When the transcript does not quote a title, retrieve the original URL directly, follow redirects, and send a normal browser user agent. Prefer an actual HTTP fetch over a search result.
- A tool-level refusal such as `URL is not safe to open`, an internal tool error, or another failure that occurs before an HTTP request reaches the page does not count as the retrieval attempt. In that case, make one direct HTTP request to the same URL, such as with `curl -L --compressed --max-time 35 -A "Mozilla/5.0" URL`.
- Do not use a consent page, bot challenge, login page, generic section page, or HTTP error page title. Confirm that the final response represents the requested page.
- Choose the title from the retrieved page in this order:
  1. The visible article headline or document heading when it is unambiguous.
  2. `og:title`.
  3. `twitter:title`.
  4. The HTML `<title>` element.
- HTML-decode entities such as `&amp;`, `&#39;`, and `&rsquo;`, collapse accidental whitespace, and preserve the title's wording, capitalization, and punctuation. Do not rewrite it for style.
- Treat each discussion URL as its own page. Retrieve its title independently rather than copying the adjacent article title, and add the discussion source suffix only when the retrieved title does not already include it.
- For PDFs, inspect the rendered first page and embedded document metadata when available. Prefer the displayed document title over a filename or browser-generated PDF label.
- Make only one actual page-retrieval attempt per URL. If the original page times out, blocks access, or does not expose a confident title, ask the user to provide it.
- Do not retry through alternate domains, mirrors, archives, proxies, metadata services, or search queries unless the user explicitly asks for another attempt.
- Search results and social posts may help identify that a page exists, but they are not authoritative title sources. Never adopt a result snippet or discussion-post title as the page title.
- If a title cannot be retrieved confidently, ask the user to provide it. Do not fall back to the raw URL unless the user explicitly tells you to.
- Never infer a title from a URL slug or an adjacent discussion link. If the page itself cannot be retrieved and the transcript does not quote its title, ask the user every time.
- After updating links, scan all `src/content/links/*.json` for empty titles or titles that are just raw URLs. Ask the user for any remaining missing titles.

## Grouping

- Keep article plus related discussion links in the same group.
- Keep cited papers, source documents, or `related:` links in the same group as the primary item when they were sent together or clearly refer to the same topic. When they appear within commentary, link them inline in `note` rather than adding them to `links`.
- Use `note` for transcript commentary that is not itself a title, such as `Related: ...`.
- If the user says a link is redundant or should be deleted, remove that link from its group. If the group becomes empty, remove the group.
- Do not show or store per-link timestamps in the JSON.

## References To Prior Days

- Before importing, normalize each transcript URL for comparison and search all existing `src/content/links/*.json` files for prior appearances. Ignore superficial differences such as a trailing slash, but do not replace the stored URL merely for normalization.
- When a WhatsApp message revisits a previously shared article with new commentary or a new quotation, keep the follow-up in the current day's chronology but do not repeat the old external article or discussion URLs.
- Add a stable `id` to the original group if it does not already have one. In the current day's commentary, link the original article title inline to `/links/YYYY/MM-DD.html#group-id`; do not repeat the old external URL in `links`.
- Preserve the new commentary or quotation in the current group's `note`.
- If the follow-up includes genuinely new related URLs, keep those new links in the current group alongside the internal reference.
- If a message is only a bare duplicate with no new commentary or related material, omit it.
- If quoted WhatsApp reply context could refer to more than one prior group, ask the user which item it references rather than guessing.

## Verification

- Check for raw URL titles with a quick script or search before finishing.
- Scan imported notes against the source transcript for mid-word ellipses, abruptly unfinished final sentences, and unmatched delimiters. Any suspected truncation must be resolved with the user before the import is considered complete.
- Run `ASTRO_TELEMETRY_DISABLED=1 cmd /c npm run build`.
- Confirm the expected `/links/YYYY/MM-DD.html` routes are generated.
- Confirm the homepage unified feed includes the new link day when it is among the five most recent items.
- Confirm `/posts.html` includes the new link day in reverse-chronological order.
- Confirm `rss.xml` includes the new link day.
