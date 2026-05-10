import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");
const localRootTargets = /^\/(?:\.\/)?(?:_astro\/|assets\/|articles\/|links\/|index\.html|about\.html|links\.html)/;

function* htmlFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      yield* htmlFiles(fullPath);
    } else if (entry.endsWith(".html")) {
      yield fullPath;
    }
  }
}

function relativize(file: string, url: string) {
  if (!localRootTargets.test(url)) return url;

  const [pathAndQuery, hash = ""] = url.split("#", 2);
  const [urlPath, query = ""] = pathAndQuery.split("?", 2);
  const target = urlPath.replace(/^\/(?:\.\/)?/, "");
  const relativeFile = path.relative(dist, file).split(path.sep).join("/");
  const fromDir = path.posix.dirname(relativeFile);
  const relativePath = path.posix.relative(fromDir, target) || path.posix.basename(target);

  return `${relativePath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, "utf8");
  const updated = html.replace(/\b(href|src)="([^"]+)"/g, (_match: string, attr: string, url: string) => {
    return `${attr}="${relativize(file, url)}"`;
  });

  if (updated !== html) {
    writeFileSync(file, updated);
  }
}
