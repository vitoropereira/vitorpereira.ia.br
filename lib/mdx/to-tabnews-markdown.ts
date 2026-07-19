import { calloutsToBlockquotes, videosToLinks, absolutizeInternalLinks } from "./transforms.ts";
import { SITE_URL, MAX_BODY } from "../syndication/config.ts";

export type SyndicationFormat = "summary" | "teaser" | "full";

function transformInline(md: string): string {
  return absolutizeInternalLinks(videosToLinks(calloutsToBlockquotes(md)), SITE_URL);
}

function firstSentence(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const m = clean.match(/^(.*?[.!?])(\s|$)/);
  return (m ? m[1] : clean).trim();
}

/**
 * Marca, por linha, se ela é um heading `## ` real — ignorando linhas dentro
 * de blocos de código cercados por ``` (fence), onde `## ` é só texto/comentário.
 */
function findRealHeadingLines(lines: string[]): boolean[] {
  const isHeading: boolean[] = new Array(lines.length).fill(false);
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^##\s+/.test(lines[i])) isHeading[i] = true;
  }
  return isHeading;
}

function extractSummary(body: string): string {
  const lines = body.split("\n");
  const isHeading = findRealHeadingLines(lines);
  const items: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isHeading[i]) continue;
    const h = lines[i].match(/^##\s+(.+)$/);
    if (!h) continue;
    const rest: string[] = [];
    for (let j = i + 1; j < lines.length && !isHeading[j]; j++) rest.push(lines[j]);
    const para = rest.join("\n").trim().split(/\n\s*\n/)[0] ?? "";
    items.push(`- **${h[1].trim()}** — ${firstSentence(para)}`);
  }
  return items.join("\n");
}

function extractTeaser(body: string): string {
  const lines = body.split("\n");
  const isHeading = findRealHeadingLines(lines);
  const idx = isHeading.findIndex(Boolean);
  return (idx === -1 ? lines : lines.slice(0, idx)).join("\n").trim();
}

/**
 * Link do CTA passa pelo redirect de rastreio `/api/track` (log de clique
 * first-party). O UTM é adicionado pelo próprio redirect — aqui só vai `to` (a
 * canônica) + `f` (formato). Mantém as páginas de post estáticas.
 */
function trackUrl(canonicalUrl: string, format: SyndicationFormat): string {
  return `${SITE_URL}/api/track?to=${encodeURIComponent(canonicalUrl)}&f=${format}`;
}

function cta(title: string, canonicalUrl: string, format: SyndicationFormat): string {
  return `\n\n---\n\nEscrevi o resto no meu site:\n\n**[${title}](${trackUrl(canonicalUrl, format)})**`;
}

export function toTabNewsMarkdown(input: {
  body: string;
  title: string;
  canonicalUrl: string;
  format: SyndicationFormat;
}): string {
  const { body, title, canonicalUrl, format } = input;
  let out: string;
  if (format === "summary") {
    const summary = extractSummary(transformInline(body));
    if (summary === "") throw new Error("Post sem seções '## ' — use --format teaser ou full.");
    out = summary + cta(title, canonicalUrl, format);
  } else if (format === "teaser") {
    out = extractTeaser(transformInline(body)) + cta(title, canonicalUrl, format);
  } else {
    out = `${transformInline(body)}\n\n---\n\nPublicado originalmente em ${trackUrl(canonicalUrl, "full")}`;
  }
  if (out.length > MAX_BODY)
    throw new Error(`Body de ${out.length} chars excede o limite de ${MAX_BODY.toLocaleString("pt-BR")} do TabNews.`);
  return out;
}
