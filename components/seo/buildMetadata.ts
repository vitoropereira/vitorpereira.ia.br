import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n/config";

export type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  locale: Locale;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  type?: "website" | "article";
  noIndex?: boolean;
  alternatePath?: string;
};

// Locale-aware default OG card. Points at the stable /og route handler (not the
// hashed opengraph-image file convention) so PT and EN pages get their own
// localized statement.
const defaultOgImage = (locale: Locale) => ({
  url: `${siteConfig.url}/og?locale=${locale}`,
  width: 1200,
  height: 630,
  alt: siteConfig.name,
});

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const {
    title,
    description,
    path,
    locale,
    images,
    type = "website",
    noIndex,
    alternatePath,
  } = input;
  const url = `${siteConfig.url}${path}`;
  const altUrl = alternatePath ? `${siteConfig.url}${alternatePath}` : null;

  // hreflang must be reciprocal: only advertise a counterpart language when a
  // real translation exists. Fabricating `en → /en` (or `pt-BR → home`) for an
  // untranslated page creates a non-reciprocal pair that Search Console flags as
  // "no return tag" and then ignores the whole cluster.
  const languages: Record<string, string> = { "x-default": siteConfig.url };
  languages[locale === "pt" ? "pt-BR" : "en"] = url;
  if (altUrl) {
    languages[locale === "pt" ? "en" : "pt-BR"] = altUrl;
  }

  const rssUrl =
    locale === "pt"
      ? `${siteConfig.url}/rss.xml`
      : `${siteConfig.url}/en/rss.xml`;

  const effectiveImages = images ?? [defaultOgImage(locale)];

  return {
    title: title ? `${title} — ${siteConfig.name}` : siteConfig.name,
    description,
    alternates: {
      canonical: url,
      languages,
      types: {
        "application/rss+xml": rssUrl,
      },
    },
    openGraph: {
      type,
      locale: locale === "pt" ? "pt_BR" : "en_US",
      url,
      title: title || siteConfig.name,
      description,
      siteName: siteConfig.name,
      images: effectiveImages,
    },
    twitter: {
      card: "summary_large_image",
      title: title || siteConfig.name,
      description,
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      images: effectiveImages.map((i) => i.url),
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
