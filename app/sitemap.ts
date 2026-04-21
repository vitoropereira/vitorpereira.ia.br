import type { MetadataRoute } from "next";
import { posts as rawPosts } from "@/content";
import { getAllTags } from "@/features/blog/lib/queries";
import type { Post } from "@/features/blog/types";
import { siteConfig } from "@/lib/siteConfig";
import { institutionalRoutes } from "@/lib/i18n/routeMap";

type Entry = MetadataRoute.Sitemap[number];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: Entry[] = [];

  for (const key of Object.keys(institutionalRoutes) as Array<
    keyof typeof institutionalRoutes
  >) {
    const { pt, en } = institutionalRoutes[key];
    const langs = {
      "pt-BR": `${siteConfig.url}${pt}`,
      en: `${siteConfig.url}${en}`,
    };
    entries.push({
      url: `${siteConfig.url}${pt}`,
      lastModified: now,
      alternates: { languages: langs },
    });
    entries.push({
      url: `${siteConfig.url}${en}`,
      lastModified: now,
      alternates: { languages: langs },
    });
  }

  const allPosts = rawPosts as unknown as Post[];
  for (const p of allPosts.filter((x) => !x.draft)) {
    const langs: Record<string, string> = {
      "pt-BR":
        p.locale === "pt"
          ? `${siteConfig.url}${p.permalink}`
          : (p.translationSlug ?? `${siteConfig.url}${p.permalink}`),
      en:
        p.locale === "en"
          ? `${siteConfig.url}${p.permalink}`
          : (p.translationSlug ?? `${siteConfig.url}${p.permalink}`),
    };
    // translationSlug is already an absolute path (starts with `/`), prepend site URL.
    if (p.locale === "pt" && p.translationSlug) {
      langs.en = `${siteConfig.url}${p.translationSlug}`;
    }
    if (p.locale === "en" && p.translationSlug) {
      langs["pt-BR"] = `${siteConfig.url}${p.translationSlug}`;
    }

    entries.push({
      url: `${siteConfig.url}${p.permalink}`,
      lastModified: p.updated ? new Date(p.updated) : new Date(p.date),
      alternates: { languages: langs },
    });
  }

  for (const locale of ["pt", "en"] as const) {
    const tags = getAllTags(allPosts, locale);
    for (const tag of tags) {
      const base = locale === "pt" ? "/tags" : "/en/tags";
      entries.push({
        url: `${siteConfig.url}${base}/${encodeURIComponent(tag)}`,
        lastModified: now,
      });
    }
  }

  return entries;
}
