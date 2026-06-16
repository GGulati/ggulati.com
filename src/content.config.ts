import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    slug: z.string().optional(),
    excerpt: z.string(),
    draft: z.boolean().optional(),
    widgets: z.array(z.string()).optional(),
  }),
});

const links = defineCollection({
  type: "data",
  schema: z.object({
    date: z.string(),
    title: z.string(),
    groups: z.array(
      z.object({
        note: z.string(),
        links: z.array(
          z.object({
            prefix: z.string().optional(),
            href: z.string(),
            title: z.string(),
            after: z
              .array(
                z.object({
                  prefix: z.string().optional(),
                  href: z.string(),
                  title: z.string(),
                  suffix: z.string().optional(),
                }),
              )
              .optional(),
          }),
        ),
      }),
    ),
  }),
});

export const collections = { articles, links };
