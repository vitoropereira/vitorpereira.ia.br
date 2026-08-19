import { siteConfig } from "@/lib/siteConfig";
import type { Locale } from "@/lib/i18n/config";

type BlogPostingData = {
  type: "BlogPosting";
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  tags?: string[];
  locale: Locale;
};
type WebSiteData = { type: "WebSite"; locale: Locale };
type PersonData = { type: "Person" };
type ServiceData = {
  type: "Service";
  locale: Locale;
  name: string;
  description: string;
  url: string;
};

export type JsonLdData =
  | BlogPostingData
  | WebSiteData
  | PersonData
  | ServiceData;

export function JsonLd({ data, id }: { data: JsonLdData; id?: string }) {
  const author = {
    "@type": "Person",
    name: siteConfig.author.name,
    url: siteConfig.author.url,
    sameAs: Object.values(siteConfig.social),
  };

  let json: Record<string, unknown>;
  if (data.type === "BlogPosting") {
    json = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.title,
      description: data.description,
      url: data.url,
      datePublished: data.datePublished,
      dateModified: data.dateModified ?? data.datePublished,
      author,
      publisher: author,
      mainEntityOfPage: { "@type": "WebPage", "@id": data.url },
      inLanguage: data.locale === "pt" ? "pt-BR" : "en",
      ...(data.image ? { image: data.image } : {}),
      ...(data.tags && data.tags.length > 0
        ? { keywords: data.tags.join(", ") }
        : {}),
    };
  } else if (data.type === "Person") {
    json = { "@context": "https://schema.org", ...author };
  } else if (data.type === "Service") {
    json = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: data.name,
      description: data.description,
      url: data.url,
      provider: author,
      areaServed: { "@type": "Country", name: "Brazil" },
      inLanguage: data.locale === "pt" ? "pt-BR" : "en",
    };
  } else {
    json = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
      description:
        data.locale === "pt"
          ? siteConfig.statement.pt
          : siteConfig.statement.en,
      inLanguage: data.locale === "pt" ? "pt-BR" : "en",
      author,
    };
  }

  // Escape `<` so a string value can never close the script tag early.
  // Safe: `json` is built from siteConfig + typed props — no user HTML.
  const body = JSON.stringify(json).replace(/</g, "\\u003c");

  return (
    <script
      id={id ?? `jsonld-${data.type.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
