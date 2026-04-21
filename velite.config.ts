import { defineConfig, s } from "velite";
import readingTime from "reading-time";

const locales = ["pt", "en"] as const;
type Locale = (typeof locales)[number];

const postsSchema = s.object({
  title: s.string().max(200),
  description: s.string().max(300),
  date: s.isodate(),
  updated: s.isodate().optional(),
  draft: s.boolean().default(false),
  tags: s.array(s.string()).default([]),
  cover: s.image().optional(),
  comments: s.boolean().default(false),
  // Raw MDX body. We render via next-mdx-remote at request time,
  // so we keep the source string here instead of compiling.
  body: s.string().default(""),
  // Derived fields (filled by transform / prepare below)
  locale: s.enum(locales).default("pt"),
  slug: s.string().default(""),
  permalink: s.string().default(""),
  readingTime: s.number().default(0),
  excerpt: s.string().default(""),
  translationSlug: s.string().optional(),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    posts: {
      name: "Post",
      pattern: "posts/**/index{,.en}.mdx",
      schema: postsSchema.transform((data, { meta }) => {
        const filePath = (meta.path ?? "").replace(/\\/g, "/");
        const isEn = /\.en\.mdx$/.test(filePath);
        const locale: Locale = isEn ? "en" : "pt";

        const match = filePath.match(
          /content\/posts\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/index(?:\.en)?\.mdx$/,
        );
        if (!match) {
          throw new Error(
            `Post path does not match expected pattern: ${filePath}`,
          );
        }
        const [, year, month, day, slug] = match;
        const permalink =
          locale === "pt"
            ? `/${year}/${month}/${day}/${slug}`
            : `/en/${year}/${month}/${day}/${slug}`;

        const rawBody = (meta.content ?? "") as string;
        const rt = readingTime(rawBody);

        const stripped = rawBody
          .replace(/```[\s\S]*?```/g, "")
          .replace(/[#*_>`~\-[\]()!]/g, "")
          .replace(/\s+/g, " ")
          .trim();
        const excerpt =
          data.description && data.description.length > 0
            ? data.description
            : stripped.slice(0, 160) + (stripped.length > 160 ? "…" : "");

        return {
          ...data,
          body: rawBody,
          locale,
          slug,
          permalink,
          readingTime: Math.max(1, Math.round(rt.minutes)),
          excerpt,
        };
      }),
    },
  },
  prepare: ({ posts }) => {
    const bySlug: Record<string, { pt?: string; en?: string }> = {};
    for (const p of posts) {
      bySlug[p.slug] ??= {};
      bySlug[p.slug][p.locale as Locale] = p.permalink;
    }
    for (const p of posts) {
      const sib = bySlug[p.slug];
      p.translationSlug = p.locale === "pt" ? sib?.en : sib?.pt;
    }
  },
});
