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
    const selfUrl = `${siteConfig.url}${p.permalink}`;
    // Only advertise alternates when a real translation exists — otherwise we'd
    // emit a self-referential hreflang for the "other" language, which is a
    // non-reciprocal pair (mirrors the buildMetadata head fix).
    let alternates: Entry["alternates"];
    if (p.translationSlug) {
      // translationSlug is an absolute path (starts with `/`), prepend site URL.
      const otherUrl = `${siteConfig.url}${p.translationSlug}`;
      alternates = {
        languages:
          p.locale === "pt"
            ? { "pt-BR": selfUrl, en: otherUrl }
            : { en: selfUrl, "pt-BR": otherUrl },
      };
    }

    entries.push({
      url: selfUrl,
      lastModified: p.updated ? new Date(p.updated) : new Date(p.date),
      ...(alternates ? { alternates } : {}),
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
