import { posts as rawPosts } from "@/content";
import type { Post, Locale } from "../types";

const all = rawPosts as unknown as Post[];

export function filterPublishedByLocale(
  posts: readonly Post[],
  locale: Locale,
  includeDrafts: boolean,
): Post[] {
  return posts.filter(
    (p) => p.locale === locale && (includeDrafts || !p.draft),
  );
}

export function sortByDateDesc<T extends { date: string | Date }>(
  posts: readonly T[],
): T[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getAllTags(posts: readonly Post[], locale: Locale): string[] {
  const tags = new Set<string>();
  for (const p of posts) {
    if (p.locale !== locale || p.draft) continue;
    for (const t of p.tags ?? []) tags.add(t);
  }
  return [...tags];
}

export function getRelatedPosts(
  current: Post,
  all: readonly Post[],
  n = 3,
): Post[] {
  const pool = all.filter(
    (p) => p.slug !== current.slug && p.locale === current.locale && !p.draft,
  );
  const scored = pool.map((p) => ({
    post: p,
    score: (p.tags ?? []).filter((t) => current.tags?.includes(t)).length,
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });
  return scored.slice(0, n).map((s) => s.post);
}

// Higher-level helpers consumed by pages
export function getPostsByLocale(
  locale: Locale,
  opts: { includeDrafts?: boolean; tag?: string; limit?: number } = {},
): Post[] {
  const includeDrafts =
    opts.includeDrafts ?? process.env.NODE_ENV !== "production";
  const base = filterPublishedByLocale(all, locale, includeDrafts);
  const withTag = opts.tag
    ? base.filter((p) => p.tags?.includes(opts.tag as string))
    : base;
  const sorted = sortByDateDesc(withTag);
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}

export function getPostBySlug(locale: Locale, slug: string): Post | undefined {
  return all.find((p) => p.locale === locale && p.slug === slug);
}

export function getAllSlugs(locale: Locale): string[] {
  return all.filter((p) => p.locale === locale && !p.draft).map((p) => p.slug);
}
