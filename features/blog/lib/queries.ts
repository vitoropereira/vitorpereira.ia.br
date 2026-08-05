import { posts as rawPosts } from "@/content";
import type { Post, Locale } from "../types";
import { isPublic, previewEnabled } from "./visibility";

const all = rawPosts as unknown as Post[];

/**
 * Filtra por locale aplicando as regras de visibilidade.
 *
 * `preview = true` inclui drafts E posts agendados (data futura) — é o
 * comportamento de dev. Em produção sempre `false`.
 */
export function filterPublishedByLocale(
  posts: readonly Post[],
  locale: Locale,
  preview: boolean,
  now: Date = new Date(),
): Post[] {
  return posts.filter(
    (p) => p.locale === locale && (preview || isPublic(p, now)),
  );
}

export function sortByDateDesc<T extends { date: string | Date }>(
  posts: readonly T[],
): T[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getAllTags(
  posts: readonly Post[],
  locale: Locale,
  now: Date = new Date(),
): string[] {
  const tags = new Set<string>();
  for (const p of posts) {
    if (p.locale !== locale || !isPublic(p, now)) continue;
    for (const t of p.tags ?? []) tags.add(t);
  }
  return [...tags];
}

export function getRelatedPosts(
  current: Post,
  all: readonly Post[],
  n = 3,
  now: Date = new Date(),
): Post[] {
  const pool = all.filter(
    (p) =>
      p.slug !== current.slug &&
      p.locale === current.locale &&
      isPublic(p, now),
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
  opts: { preview?: boolean; tag?: string; limit?: number } = {},
): Post[] {
  const preview = opts.preview ?? previewEnabled();
  const base = filterPublishedByLocale(all, locale, preview);
  const withTag = opts.tag
    ? base.filter((p) => p.tags?.includes(opts.tag as string))
    : base;
  const sorted = sortByDateDesc(withTag);
  return opts.limit ? sorted.slice(0, opts.limit) : sorted;
}

export function getPostBySlug(
  locale: Locale,
  slug: string,
  opts: { preview?: boolean } = {},
): Post | undefined {
  const preview = opts.preview ?? previewEnabled();
  return all.find(
    (p) => p.locale === locale && p.slug === slug && (preview || isPublic(p)),
  );
}

export function getAllSlugs(locale: Locale): string[] {
  return all.filter((p) => p.locale === locale && isPublic(p)).map((p) => p.slug);
}
