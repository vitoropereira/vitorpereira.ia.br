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

  const languages: Record<string, string> = {
    "pt-BR": locale === "pt" ? url : (altUrl ?? siteConfig.url),
    en: locale === "en" ? url : (altUrl ?? `${siteConfig.url}/en`),
    "x-default": siteConfig.url,
  };

  return {
    title: title ? `${title} — ${siteConfig.name}` : siteConfig.name,
    description,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type,
      locale: locale === "pt" ? "pt_BR" : "en_US",
      url,
      title: title || siteConfig.name,
      description,
      siteName: siteConfig.name,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: title || siteConfig.name,
      description,
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      images: images?.map((i) => i.url),
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}
