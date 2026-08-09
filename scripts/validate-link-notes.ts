import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderNoteMarkdown, renderedNoteText } from "../src/lib/note-markdown.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDirectory = path.join(projectRoot, "src", "content", "links");
const distDirectory = path.join(projectRoot, "dist");
const legacyCutoff = "2026-08-08";

type Link = { href: string; title: string };
type Group = { note?: string; links: Link[] };
type LinkPost = { date: string; groups: Group[] };

function canonicalText(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+$/gm, "").trim();
}

function loadPosts() {
  return readdirSync(contentDirectory)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({
      name,
      data: JSON.parse(readFileSync(path.join(contentDirectory, name), "utf8")) as LinkPost,
    }));
}

function validateRenderer() {
  const rendered = renderNoteMarkdown(
    "One *emphasis*, **strong**, and `code` line.\nSecond line.\n\n[External](https://example.com) and [internal](/links/2026/07-12.html).",
  );
  assert.match(rendered, /<em>emphasis<\/em>/);
  assert.match(rendered, /<strong>strong<\/strong>/);
  assert.match(rendered, /<code>code<\/code>/);
  assert.match(rendered, /<br\s*\/>/);
  assert.match(rendered, /href="https:\/\/example\.com"/);
  assert.match(rendered, /href="\/links\/2026\/07-12\.html"/);

  const unsafe = renderNoteMarkdown("[unsafe](javascript:alert(1)) <script>alert(1)</script>");
  assert.doesNotMatch(unsafe, /href="javascript:|<script/i);

  const absolute = renderNoteMarkdown("[internal](/links/2026/07-12.html)", {
    resolveHref: (href) => href.startsWith("/") ? `https://ggulati.com${href}` : href,
  });
  assert.match(absolute, /href="https:\/\/ggulati\.com\/links\/2026\/07-12\.html"/);
}

function validateSource(posts: ReturnType<typeof loadPosts>) {
  let noteCount = 0;
  let legacyCount = 0;

  for (const { name, data } of posts) {
    data.groups.forEach((group, index) => {
      if (!group.note) return;
      noteCount += 1;
      const rendered = renderNoteMarkdown(group.note);
      assert.doesNotMatch(rendered, /<(?:script|style|img|h[1-6]|ul|ol|li|blockquote)\b/i, `${name} group ${index + 1} emitted an unsupported tag`);
      assert.doesNotMatch(rendered, /\s(?:src|style|class|id|on\w+)="/i, `${name} group ${index + 1} emitted an unsupported attribute`);
      assert.doesNotMatch(rendered, /href="(?:javascript:|data:|\/\/)/i, `${name} group ${index + 1} emitted an unsafe link`);

      if (data.date <= legacyCutoff) {
        legacyCount += 1;
        assert.equal(
          canonicalText(renderedNoteText(rendered)),
          canonicalText(group.note),
          `${name} group ${index + 1} changes visible legacy note text`,
        );
      }
    });
  }

  const august9 = posts.find(({ data }) => data.date === "2026-08-09")?.data;
  assert(august9, "Missing August 9 link post");

  const shopify = august9.groups.find((group) => group.links.some((link) => link.href === "https://shopify.engineering/scaling-inventory-reservations"));
  assert(shopify, "Missing Shopify group");
  assert.deepEqual(shopify.links.map((link) => link.href), [
    "https://shopify.engineering/scaling-inventory-reservations",
    "https://news.ycombinator.com/item?id=49226536",
  ]);
  assert.match(renderNoteMarkdown(shopify.note), /href="https:\/\/dev\.37signals\.com\/introducing-solid-queue\/"/);

  const redBlob = august9.groups.find((group) => group.links.some((link) => link.href === "https://www.redblobgames.com/pathfinding/heuristics/differential.html"));
  assert(redBlob, "Missing Red Blob Games group");
  assert.deepEqual(redBlob.links.map((link) => link.href), [
    "https://www.redblobgames.com/pathfinding/heuristics/differential.html",
    "https://news.ycombinator.com/item?id=49079995",
  ]);
  const redBlobNote = renderNoteMarkdown(redBlob.note);
  for (const href of [
    "/links/2026/07-12.html#membership-101-applet",
    "https://stripe.com/blog/globe",
    "https://nhsjs.com/2020/dstar-lite-an-optimal-algorithm-for-robotics-pathfinding/",
    "http://www.ggulati.com/articles/2011/boidwatching.html",
  ]) {
    assert(redBlobNote.includes(`href="${href}"`), `Red Blob Games note is missing ${href}`);
  }

  return { noteCount, legacyCount };
}

function* htmlFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) yield* htmlFiles(fullPath);
    else if (entry.endsWith(".html")) yield fullPath;
  }
}

function validateLocalPaths() {
  const broken: string[] = [];
  for (const file of htmlFiles(distDirectory)) {
    const html = readFileSync(file, "utf8");
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(href)) continue;
      const localPath = href.split(/[?#]/, 1)[0];
      if (!localPath) continue;
      const target = localPath.startsWith("/")
        ? path.join(distDirectory, localPath.replace(/^\/+/, ""))
        : path.resolve(path.dirname(file), localPath);
      if (!existsSync(target)) broken.push(`${path.relative(projectRoot, file)}: ${href}`);
    }
  }
  assert.deepEqual(broken, [], `Broken local paths:\n${broken.join("\n")}`);
}

function validateDist(posts: ReturnType<typeof loadPosts>, expectedNoteCount: number) {
  assert(existsSync(distDirectory), "dist/ does not exist; run the static build first");

  let dailyNoteCount = 0;
  for (const { name, data } of posts) {
    const [year, month, day] = data.date.split("-");
    const route = path.join(distDirectory, "links", year, `${month}-${day}.html`);
    assert(existsSync(route), `Missing generated route for ${name}`);
    const html = readFileSync(route, "utf8");
    const expected = data.groups.filter((group) => group.note).length;
    const actual = (html.match(/class="daily-link-note"/g) || []).length;
    assert.equal(actual, expected, `${name} rendered ${actual} of ${expected} notes`);
    dailyNoteCount += actual;
  }
  assert.equal(dailyNoteCount, expectedNoteCount, "Daily pages dropped one or more notes");

  const postsHtml = readFileSync(path.join(distDirectory, "posts.html"), "utf8");
  assert.equal((postsHtml.match(/class="daily-link-note"/g) || []).length, expectedNoteCount, "posts.html dropped one or more notes");

  const august9 = readFileSync(path.join(distDirectory, "links", "2026", "08-09.html"), "utf8");
  assert.doesNotMatch(august9, /\[Solid Queue\]\(/, "August 9 contains unrendered Markdown");
  assert.match(august9, /<div class="daily-link-note">[\s\S]*href="https:\/\/dev\.37signals\.com\/introducing-solid-queue\/"/);
  assert.match(august9, /href="07-12\.html#membership-101-applet"/);

  const rss = readFileSync(path.join(distDirectory, "rss.xml"), "utf8");
  assert(rss.includes("https://dev.37signals.com/introducing-solid-queue/"), "RSS is missing the Solid Queue note link");
  assert(rss.includes("https://ggulati.com/links/2026/07-12.html#membership-101-applet"), "RSS did not absolutize the Membership 101 note link");

  assert(!existsSync(path.join(distDirectory, "links.html")), "links.html must not be generated");
  validateLocalPaths();
}

validateRenderer();
const posts = loadPosts();
const { noteCount, legacyCount } = validateSource(posts);

if (process.argv.includes("--dist")) validateDist(posts, noteCount);

console.log(`Validated ${noteCount} Markdown notes; ${legacyCount} legacy notes preserve their visible text.`);
