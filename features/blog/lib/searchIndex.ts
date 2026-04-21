import { posts as rawPosts } from "@/content";
import type { Post, Locale } from "../types";

export type SearchItem = {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  permalink: string;
  date: string;
};

export function buildSearchIndex(locale: Locale): SearchItem[] {
  return (rawPosts as unknown as Post[])
    .filter((p) => p.locale === locale && !p.draft)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      tags: p.tags,
      permalink: p.permalink,
      date: new Date(p.date).toISOString(),
    }));
}
