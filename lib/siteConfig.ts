import type { Locale } from "./i18n/config";

export const siteConfig = {
  name: "Vitor Pereira",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://vitorpereira.ia.br",
  tagline: {
    pt: "IA aplicada em sistemas reais.",
    en: "Applied AI in real systems.",
  },
  statement: {
    pt: "IA aplicada em sistemas reais. Sem hype, sem demo fake. Código, automação e produto funcionando de verdade — mostrados por quem constrói.",
    en: "Applied AI in real systems. No hype, no fake demos. Code, automation, and products that actually work — shown by the person who builds them.",
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
  booking: {
    /** Perfil no Cal.com. O agendamento roda embutido no próprio site. */
    calHandle: "vitorpereira",
    /** Rotas internas — o cliente nunca sai de vitorpereira.ia.br. */
    routes: {
      index: { pt: "/agendar", en: "/en/booking" },
      diagnostic: {
        pt: "/agendar/diagnostico-30min",
        en: "/en/booking/diagnostico-30min",
      },
      operationalAgent: {
        pt: "/agendar/escopo-software-30-dias",
        en: "/en/booking/escopo-software-30-dias",
      },
    },
  },
  twitterHandle: "@VITORONOFRE",
  featuredCategories: [] as string[],
  defaultLocale: "pt" as Locale,
  locales: ["pt", "en"] as const satisfies readonly Locale[],
  postsPerPage: 20,
} as const;

export type SiteConfig = typeof siteConfig;
