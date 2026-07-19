import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { SITE_URL } from "../syndication/config.ts";
import type { SourcePost } from "../syndication/types.ts";

/** Deriva o permalink PT do caminho content/posts/AAAA/MM/DD/slug/index.mdx */
export function permalinkFromPath(mdxPath: string): string {
  const m = mdxPath.replace(/\\/g, "/").match(/content\/posts\/(\d{4})\/(\d{2})\/(\d{2})\/([^/]+)\/index\.mdx$/);
  if (!m) throw new Error(`Caminho não é um post PT válido (…/index.mdx): ${mdxPath}`);
  const [, y, mo, d, slug] = m;
  return `/${y}/${mo}/${d}/${slug}`;
}

export function loadPostFromPath(mdxPath: string): SourcePost {
  const permalink = permalinkFromPath(mdxPath);
  const { data, content } = matter(readFileSync(mdxPath, "utf8"));
  return {
    title: String(data.title ?? ""),
    body: content.trim(),
    canonicalUrl: `${SITE_URL}${permalink}`,
    permalink,
    locale: "pt",
    draft: Boolean(data.draft),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
  };
}
