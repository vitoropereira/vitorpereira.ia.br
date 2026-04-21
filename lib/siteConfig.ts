import type { Locale } from "./i18n/config";

export const siteConfig = {
  name: "Vitor Pereira",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitorpereira.ia.br",
  tagline: {
    pt: "Dev full-stack com 10+ anos de experiência construindo SaaS, automação e produtos com IA.",
    en: "Full-stack dev with 10+ years building SaaS, automation, and AI products.",
  },
  author: {
    name: "Vitor Onofre Pereira",
    url: "https://vitorpereira.ia.br/sobre",
  },
  social: {
    linkedin: "https://www.linkedin.com/in/vitor-onofre-pereira/",
    github: "https://github.com/vitoropereira",
    instagram: "https://www.instagram.com/vitorpereirasaas/",
    x: "https://x.com/VITORONOFRE",
    youtube: "https://www.youtube.com/@vitoropereira",
    tabnews: "https://www.tabnews.com.br/vitorpereirasaas",
  },
  twitterHandle: "@VITORONOFRE",
  featuredCategories: [] as string[],
  defaultLocale: "pt" as Locale,
  locales: ["pt", "en"] as const satisfies readonly Locale[],
  postsPerPage: 20,
} as const;

export type SiteConfig = typeof siteConfig;
