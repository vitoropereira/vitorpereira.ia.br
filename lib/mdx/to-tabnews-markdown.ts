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

function extractSummary(body: string): string {
  const lines = body.split("\n");
  const items: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^##\s+(.+)$/);
    if (!h) continue;
    const rest: string[] = [];
    for (let j = i + 1; j < lines.length && !/^##\s+/.test(lines[j]); j++) rest.push(lines[j]);
    const para = rest.join("\n").trim().split(/\n\s*\n/)[0] ?? "";
    items.push(`- **${h[1].trim()}** — ${firstSentence(para)}`);
  }
  return items.join("\n");
}

function extractTeaser(body: string): string {
  const idx = body.search(/^##\s+/m);
  return (idx === -1 ? body : body.slice(0, idx)).trim();
}

function cta(title: string, canonicalUrl: string, format: SyndicationFormat): string {
  const url = `${canonicalUrl}?utm_source=tabnews&utm_medium=syndication&utm_content=${format}`;
  return `\n\n---\n\nEscrevi o resto no meu site:\n\n**[${title}](${url})**`;
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
    out = extractSummary(transformInline(body)) + cta(title, canonicalUrl, format);
  } else if (format === "teaser") {
    out = extractTeaser(transformInline(body)) + cta(title, canonicalUrl, format);
  } else {
    const url = `${canonicalUrl}?utm_source=tabnews&utm_medium=syndication&utm_content=full`;
    out = `${transformInline(body)}\n\n---\n\nPublicado originalmente em ${url}`;
  }
  if (out.length > MAX_BODY) throw new Error(`Body de ${out.length} chars excede o limite de 20.000 do TabNews.`);
  return out;
}
