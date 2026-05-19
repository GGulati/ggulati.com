import { getArticles } from "./articles.js";
import { getLinkPosts } from "./links.js";

export async function getFeedItems() {
  const [articles, linkPosts] = await Promise.all([getArticles(), getLinkPosts()]);
  const articleItems = articles.map((article) => ({
    type: "article",
    date: article.date,
    displayDate: article.displayDate,
    title: article.title,
    url: article.url,
    excerpt: article.excerpt,
    article,
  }));
  const linkItems = linkPosts.map((post) => ({
    type: "links",
    date: post.date,
    displayDate: post.displayDate,
    title: post.title,
    url: post.url,
    groups: post.groups,
    post,
  }));

  return [...articleItems, ...linkItems].sort((a, b) => {
    const dateDifference = b.date - a.date;
    if (dateDifference !== 0) return dateDifference;
    if (a.type === b.type) return 0;
    return a.type === "links" ? -1 : 1;
  });
}
