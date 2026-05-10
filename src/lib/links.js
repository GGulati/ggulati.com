const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export async function getLinkPosts() {
  const modules = await import.meta.glob("../content/links/*.json", { eager: true });
  return Object.entries(modules)
    .map(([, module]) => {
      const data = module.default;
      const date = new Date(`${data.date}T00:00:00Z`);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return {
        ...data,
        date,
        datetime: data.date,
        displayDate: formatter.format(date),
        url: `/links/${year}/${month}-${day}.html`,
      };
    })
    .sort((a, b) => b.date - a.date);
}
