import { getPostsByLocale } from "@/features/blog/lib/queries";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { siteConfig } from "@/lib/siteConfig";

// Recalcula a visibilidade temporal de posts agendados em runtime. O conteúdo
// continua vindo do build Velite; a decisão público/agendado não fica congelada.
export const dynamic = "force-dynamic";
// Sem isto, um post agendado só entraria no feed no próximo deploy.
export const revalidate = 600;

const PAGE_LABELS: Record<
  keyof typeof institutionalRoutes,
  { pt: string; en: string }
> = {
  home: { pt: "Home", en: "Home" },
  about: { pt: "Sobre", en: "About" },
  portfolio: { pt: "Portfólio", en: "Portfolio" },
  operationalAgent: {
    pt: "Agente Operacional de IA",
    en: "Operational AI Agent",
  },
  contact: { pt: "Contato", en: "Contact" },
  privacy: { pt: "Privacidade", en: "Privacy" },
  terms: { pt: "Termos", en: "Terms" },
  postsList: { pt: "Todos os posts", en: "All posts" },
};

const SOCIAL_LABELS: Record<keyof typeof siteConfig.social, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  tabnews: "TabNews",
};

/** Collapse to a single line: llms.txt entries are one bullet each. */
function oneLine(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Drop a section entirely when it has no entries — an empty heading is noise. */
function section(heading: string, lines: string): string {
  return lines ? `\n## ${heading}\n\n${lines}\n` : "";
}

function postLines(locale: "pt" | "en"): string {
  return getPostsByLocale(locale, { preview: false })
    .map((p) => {
      const url = `${siteConfig.url}${p.permalink}`;
      const excerpt = p.excerpt ? `: ${oneLine(p.excerpt)}` : "";
      return `- [${oneLine(p.title)}](${url})${excerpt}`;
    })
    .join("\n");
}

function pageLines(locale: "pt" | "en"): string {
  return (
    Object.keys(institutionalRoutes) as Array<keyof typeof institutionalRoutes>
  )
    .map(
      (key) =>
        `- [${PAGE_LABELS[key][locale]}](${siteConfig.url}${institutionalRoutes[key][locale]})`,
    )
    .join("\n");
}

export async function GET() {
  const social = (
    Object.keys(siteConfig.social) as Array<keyof typeof siteConfig.social>
  )
    .map((key) => `- [${SOCIAL_LABELS[key]}](${siteConfig.social[key]})`)
    .join("\n");

  const body = `# ${siteConfig.name}

> ${siteConfig.statement.pt}

${siteConfig.author.name} — desenvolvedor e empreendedor. Escreve sobre IA aplicada,
agentes, automação e engenharia de software em sistemas que rodam em produção.
Conteúdo bilíngue: português (raiz) e inglês (prefixo \`/en\`).
${section("Páginas (pt-BR)", pageLines("pt"))}${section("Posts (pt-BR)", postLines("pt"))}${section("Pages (en)", pageLines("en"))}${section("Posts (en)", postLines("en"))}${section(
    "Feeds",
    [
      `- [RSS (pt-BR)](${siteConfig.url}/rss.xml)`,
      `- [RSS (en)](${siteConfig.url}/en/rss.xml)`,
      `- [Sitemap](${siteConfig.url}/sitemap.xml)`,
    ].join("\n"),
  )}${section("Elsewhere", social)}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
