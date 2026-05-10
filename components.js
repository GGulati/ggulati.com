const ARTICLES = [
  {
    slug: "using-cursorai-to-start-your-own-hedge-fund",
    title: "Using CursorAI to start your own hedge fund",
    date: "Feb 17, 2025",
    href: "using-cursorai-to-start-your-own-hedge-fund.html",
    excerpt:
      "Poland's exports are booming, and whenever I see news like this I'm curious to visit the country and see what life is like compared to all the headlines. I also become curious about how that might reflect in investing - what is the index fund like? How easy is it to invest in it from the US? Should I start my own hedge fund and make zillions? (shhh, perhaps not quite that easy)",
  },
  {
    slug: "cursorai-for-frontend-dev-first-impressions",
    title: "CursorAI for Frontend Dev: First Impressions",
    date: "Feb 17, 2025",
    href: "cursorai-for-frontend-dev-first-impressions.html",
    excerpt:
      "I made a small side project to analyze international index funds, timeboxed to 4 hours. It makes a good spike since it has reasonable coverage of fullstack work: light but reasonable React frontend, NextJS backend routes, several different API integrations, and some basic caching.",
  },
  {
    slug: "coding-jarvis-in-python-2016",
    title: "Coding Jarvis in Python in 2016",
    date: "Feb 24, 2016",
    href: "coding-jarvis-in-python-2016.html",
    excerpt:
      "It's tough for an aspiring Iron Man to work on creating their personal AI assistant on the weekends. Like any other time-pressured inventor without a PhD in computer science and linguistics, I decided to use a library for speech recognition and synthesis.",
  },
  {
    slug: "boidwatching",
    title: "Boidwatching",
    date: "Apr 9, 2011",
    href: "boidwatching.html",
    excerpt:
      "I'm sure you're all familiar with Nicolas Cage and his birdlike photoshopped hair. Or should I say... boidlike hair?",
  },
];

function getRoot(element) {
  return element.getAttribute("root") || "";
}

function markExternalLinks() {
  document.querySelectorAll('a[href^="http://"], a[href^="https://"]').forEach((link) => {
    const url = new URL(link.href);
    if (url.hostname !== window.location.hostname) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });
}

class SiteHeader extends HTMLElement {
  connectedCallback() {
    const root = getRoot(this);
    const articleHref = `${root}index.html#articles`;
    const sideProjectsHref = `${root}index.html#side-projects`;
    const aboutHref = `${root}about.html`;
    const homeHref = `${root}index.html`;

    this.innerHTML = `
      <header class="site-header">
        <a class="brand" href="${homeHref}" aria-label="Gurwinder Gulati home">
          <span class="brand-mark">GG</span>
          <span>
            <strong>Gurwinder Gulati</strong>
            <small>Coding, fast and slow</small>
          </span>
        </a>
        <nav class="nav-links" aria-label="Primary navigation">
          <a href="${articleHref}">Articles</a>
          <a href="${sideProjectsHref}">Side Projects</a>
          <a href="${aboutHref}">About</a>
        </nav>
      </header>
    `;
  }
}

customElements.define("site-header", SiteHeader);

class SiteFooter extends HTMLElement {
  connectedCallback() {
    const root = getRoot(this);
    const articleHref = `${root}index.html#articles`;
    const topHref = this.getAttribute("top") || "#top";

    this.innerHTML = `
      <footer class="site-footer">
        <div>
          <a href="${topHref}">Back to top</a>
        </div>
      </footer>
    `;
  }
}

customElements.define("site-footer", SiteFooter);

class ArticleSidebar extends HTMLElement {
  connectedCallback() {
    const current = this.getAttribute("current");
    const otherArticles = ARTICLES.filter((article) => article.slug !== current);

    this.innerHTML = `
      <aside class="article-sidebar" aria-label="Other articles">
        <p class="eyebrow">More Articles</p>
        <nav>
          ${otherArticles
            .map(
              (article) => `
                <a href="${article.href}">
                  <strong>${article.title}</strong>
                  <time>${article.date}</time>
                </a>
              `,
            )
            .join("")}
        </nav>
      </aside>
    `;
  }
}

customElements.define("article-sidebar", ArticleSidebar);

class ArticleIndex extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="article-list">
        ${ARTICLES.map(
          (article) => `
            <article class="article-preview">
              <div class="article-preview-meta">
                <time>${article.date}</time>
              </div>
              <h2>${article.title}</h2>
              <p>${article.excerpt}</p>
              <a href="articles/${article.href}">Continue...</a>
            </article>
          `,
        ).join("")}
      </div>
    `;
  }
}

customElements.define("article-index", ArticleIndex);

markExternalLinks();
