import { getFeedItems } from "../lib/feed.js";

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

function linksDescription(item) {
  return item.groups
    .map((group) => {
      const links = group.links
        .map((link) => {
          const prefix = link.prefix ? `${escapeXml(link.prefix)} ` : "";
          return `<li>${prefix}<a href="${link.href}">${link.title}</a></li>`;
        })
        .join("");
      const note = group.note ? `<p>${group.note}</p>` : "";
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
        : escapeXml(linksDescription(item));

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
