export function pagePath(pathname) {
  return pathname === "/" ? "/index.html" : pathname;
}

export function relativeUrl(fromPath, toUrl) {
  if (/^(https?:|mailto:|tel:|#|javascript:)/.test(toUrl) || toUrl.startsWith("//")) {
    return toUrl;
  }

  const [pathAndQuery, hash = ""] = toUrl.split("#", 2);
  const [toPath, query = ""] = pathAndQuery.split("?", 2);
  const fromParts = pagePath(fromPath).replace(/^\//, "").split("/");
  fromParts.pop();
  const toParts = toPath.replace(/^\//, "").split("/");

  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  const prefix = "../".repeat(fromParts.length);
  const path = `${prefix}${toParts.join("/")}` || "./";
  return `${path}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}
