import type { MetadataRoute } from "next";
import { posts as rawPosts } from "@/content";
import { getAllTags } from "@/features/blog/lib/queries";
import { isPublic } from "@/features/blog/lib/visibility";
import type { Post } from "@/features/blog/types";
import { siteConfig } from "@/lib/siteConfig";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { bookingServices } from "@/features/booking/services";
import { bookingRoute } from "@/features/booking/routes";

type Entry = MetadataRoute.Sitemap[number];

// ISR mantém o artefato barato e reavalia posts agendados a cada dez minutos.
export const revalidate = 600;

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
      alternates: { languages: langs },
    });
    entries.push({
      url: `${siteConfig.url}${en}`,
      alternates: { languages: langs },
    });
  }

  // Páginas de agendamento por serviço: estáticas, com hreflang recíproco.
  // O laço acima só cobre o índice /agendar, e sem isto as páginas comerciais
  // do site dependeriam apenas de link interno para serem descobertas.
  for (const service of bookingServices) {
    const pt = `${siteConfig.url}${bookingRoute(service.slug, "pt")}`;
    const en = `${siteConfig.url}${bookingRoute(service.slug, "en")}`;
    const langs = { "pt-BR": pt, en };
    entries.push({ url: pt, alternates: { languages: langs } });
    entries.push({ url: en, alternates: { languages: langs } });
  }

  // Cartão de visita: existe só em PT. Entra sem `alternates` de propósito —
  // anunciar um /en/card inexistente cria par hreflang não-recíproco.
  entries.push({ url: `${siteConfig.url}/card` });

  const allPosts = rawPosts as unknown as Post[];
  for (const p of allPosts.filter((x) => isPublic(x, now))) {
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
    const tags = getAllTags(allPosts, locale, now);
    for (const tag of tags) {
      const base = locale === "pt" ? "/tags" : "/en/tags";
      entries.push({
        url: `${siteConfig.url}${base}/${encodeURIComponent(tag)}`,
      });
    }
  }

  return entries;
}
