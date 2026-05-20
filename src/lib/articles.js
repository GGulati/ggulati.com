const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const includeDrafts = typeof process !== "undefined" && process.env.INCLUDE_DRAFTS === "true";

function plainText(markdown) {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstArticleParagraph(markdown) {
  const body = markdown.replace(/^---[\s\S]*?---\s*/, "");
  const blocks = body.split(/\r?\n\s*\r?\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    if (/^(#|<|>|[-*+]\s|\d+\.\s)/.test(trimmed)) continue;
    if (/^_?Disclaimer:/i.test(trimmed)) continue;

    const text = plainText(trimmed);
    if (text) return text;
  }

  return "";
}

export async function getArticles() {
  const modules = await import.meta.glob("../content/articles/**/*.md", { eager: true });
  const rawArticles = await import.meta.glob("../content/articles/**/*.md", {
    eager: true,
    query: "?raw",
    import: "default",
  });

  return Object.entries(modules)
    .filter(([, module]) => includeDrafts || !module.frontmatter.draft)
    .map(([path, module]) => {
      const data = module.frontmatter;
      const slug = data.slug || path.split("/").pop().replace(/\.md$/, "");
      const date = new Date(`${data.date}T00:00:00Z`);
      const year = date.getUTCFullYear();
      return {
        ...data,
        slug,
        date,
        displayDate: formatter.format(date),
        excerpt: firstArticleParagraph(rawArticles[path]) || data.excerpt,
        Content: module.Content,
        url: `/articles/${year}/${slug}.html`,
      };
    })
    .sort((a, b) => b.date - a.date);
}
