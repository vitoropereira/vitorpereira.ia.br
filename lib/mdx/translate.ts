import matter from "gray-matter";

/** Rotas institucionais PT → EN, aplicadas em links internos do corpo. */
const ROUTE_MAP: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/sobre$/, "/en/about"],
  [/^\/contato$/, "/en/contact"],
  [/^\/portfolio$/, "/en/portfolio"],
  [/^\/posts$/, "/en/posts"],
  [/^\/privacidade$/, "/en/privacy"],
  [/^\/termos$/, "/en/terms"],
];

/**
 * Reescreve links internos markdown de PT pra EN.
 *
 * - rotas institucionais seguem o routeMap (`/sobre` → `/en/about`)
 * - permalinks de post ganham o prefixo `/en` (`/2026/07/18/x` → `/en/2026/07/18/x`)
 * - links já em `/en/...`, âncoras (`#`) e URLs absolutas ficam intactos
 */
export function localizeInternalLinks(body: string): string {
  return body.replace(/\]\((\/[^)\s]*)\)/g, (full, href: string) => {
    if (href.startsWith("/en/") || href === "/en") return full;

    const [pathname, hash] = href.split("#");
    const suffix = hash ? `#${hash}` : "";

    for (const [pattern, target] of ROUTE_MAP) {
      if (pattern.test(pathname)) return `](${target}${suffix})`;
    }
    if (/^\/\d{4}\/\d{2}\/\d{2}\/[^/]+$/.test(pathname)) {
      return `](/en${pathname}${suffix})`;
    }
    return full;
  });
}

export type TranslatedPost = {
  title: string;
  description: string;
  body: string;
};

/**
 * Monta o `index.en.mdx` final: frontmatter do PT com title/description
 * traduzidos, todo o resto (date, draft, tags, comments, cover…) preservado
 * byte a byte pelo gray-matter, e o corpo com links já localizados.
 *
 * O campo `tabnews` é removido — a sindicação é específica do post PT.
 */
export function buildEnglishMdx(sourceMdx: string, translated: TranslatedPost): string {
  const parsed = matter(sourceMdx);
  const data: Record<string, unknown> = { ...parsed.data };
  data.title = translated.title;
  data.description = translated.description;
  delete data.tabnews;

  const body = localizeInternalLinks(translated.body.trim());
  return matter.stringify(`\n${body}\n`, data);
}

/** Caminho do irmão EN de um post PT. */
export function englishPathFor(mdxPath: string): string {
  if (!mdxPath.endsWith("/index.mdx")) {
    throw new Error(`Esperado um caminho .../index.mdx, recebi: ${mdxPath}`);
  }
  return mdxPath.replace(/\/index\.mdx$/, "/index.en.mdx");
}
