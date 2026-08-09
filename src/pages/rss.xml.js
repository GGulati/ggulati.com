import { getFeedItems } from "../lib/feed.js";
import { renderNoteMarkdown } from "../lib/note-markdown.js";

const fallbackSite = "https://ggulati.com";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(path, site) {
  return new URL(path.replace(/^\//, ""), `${site}/`).toString();
}

function linkUrl(href, site) {
  return href.startsWith("/") ? absoluteUrl(href, site) : href;
}

function linksDescription(item, site) {
  return item.groups
    .map((group) => {
      const links = group.links
        .map((link) => {
          const prefix = link.prefix ? `${escapeXml(link.prefix)} ` : "";
          const after = (link.after || [])
            .map((afterLink) => {
              const afterPrefix = afterLink.prefix ? escapeXml(afterLink.prefix) : "";
              const afterSuffix = afterLink.suffix ? escapeXml(afterLink.suffix) : "";
              return ` ${afterPrefix}<a href="${linkUrl(afterLink.href, site)}">${escapeXml(afterLink.title)}</a>${afterSuffix}`;
            })
            .join("");
          return `<li>${prefix}<a href="${linkUrl(link.href, site)}">${escapeXml(link.title)}</a>${after}</li>`;
        })
        .join("");
      const note = group.note
        ? renderNoteMarkdown(group.note, { resolveHref: (href) => linkUrl(href, site) })
        : "";
      return `<div>${note}<ul>${links}</ul></div>`;
    })
    .join("");
}

export async function GET({ site }) {
  const siteUrl = site?.toString().replace(/\/$/, "") || fallbackSite;
  const items = await getFeedItems();
  const rssItems = items
    .map((item) => {
      const url = absoluteUrl(item.url, siteUrl);
      const description = item.type === "article"
        ? escapeXml(item.excerpt)
        : escapeXml(linksDescription(item, siteUrl));

      return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${description}</description>
    </item>`;
    })
    .join("");

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Gurwinder Gulati</title>
    <link>${siteUrl}/</link>
    <description>Articles and links from Gurwinder Gulati.</description>
    <language>en-us</language>${rssItems}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
