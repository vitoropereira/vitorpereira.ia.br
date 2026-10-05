import { calloutsToBlockquotes, videosToLinks, absolutizeInternalLinks } from "./transforms.ts";
import { SITE_URL, MAX_BODY, DIAGNOSTIC_PATH } from "../syndication/config.ts";

export type SyndicationFormat = "summary" | "teaser" | "full";

function transformInline(md: string): string {
  return unwrapParagraphs(absolutizeInternalLinks(videosToLinks(calloutsToBlockquotes(md)), SITE_URL));
}

/**
 * `<DiagnosticCTA locale="x">texto</DiagnosticCTA>` → link markdown para o
 * agendamento, pelo mesmo `/api/track` dos outros links que saem pro TabNews —
 * no site o componente mede o clique; fora dele, quem mede é o redirect.
 */
function diagnosticCtasToLinks(md: string, format: SyndicationFormat): string {
  return md.replace(
    /<DiagnosticCTA\s+locale=["'](pt|en)["']\s*>([\s\S]*?)<\/DiagnosticCTA>/g,
    (_m, locale: "pt" | "en", inner: string) =>
      `[${inner.replace(/\s+/g, " ").trim()}](${trackUrl(SITE_URL + DIAGNOSTIC_PATH[locale], format)})`,
  );
}

/** Linha que abre um bloco próprio do markdown — nunca é continuação de parágrafo. */
const BLOCK_START = /^\s*(```|\||#|>|[-*+]\s|\d+[.)]\s|<)/;

/**
 * No site, as quebras manuais do MDX (parágrafo quebrado a ~80 colunas) somem
 * no render; no TabNews viram quebra de linha visível no meio da frase. Junta as
 * linhas de cada parágrafo — e a continuação de um item de lista ao item — sem
 * tocar em código cercado, tabela, citação, título, HTML/componente nem em
 * quebra forçada (dois espaços ou `\` no fim da linha).
 */
function unwrapParagraphs(md: string): string {
  const out: string[] = [];
  let inFence = false;
  let joinable = false;
  for (const line of md.split("\n")) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      joinable = false;
      continue;
    }
    if (inFence || line.trim() === "") {
      out.push(line);
      joinable = false;
      continue;
    }
    if (joinable && !BLOCK_START.test(line)) {
      out[out.length - 1] = `${out[out.length - 1].trimEnd()} ${line.trim()}`;
    } else {
      out.push(line);
    }
    const last = out[out.length - 1];
    const isList = /^\s*([-*+]|\d+[.)])\s/.test(last);
    joinable = (isList || !BLOCK_START.test(last)) && !/( {2}|\\)$/.test(last);
  }
  return out.join("\n");
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

/**
 * Quebra uma seção em blocos separados por linha em branco, sem partir bloco
 * de código cercado (que pode ter linha em branco dentro).
 */
function splitBlocks(lines: string[]): string[] {
  const blocks: string[] = [];
  let cur: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === "" && !/^```/.test(line)) {
      if (cur.length) blocks.push(cur.join("\n"));
      cur = [];
    } else cur.push(line);
  }
  if (cur.length) blocks.push(cur.join("\n"));
  return blocks;
}

/** Tabela, lista, código, citação e subtítulo viram lixo numa linha só — o resumo quer prosa. */
function isProse(block: string): boolean {
  const first = block.trimStart();
  return !/^(```|\||[-*+]\s|\d+[.)]\s|>|#)/.test(first);
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
    const para = splitBlocks(rest).find(isProse);
    items.push(para ? `- **${h[1].trim()}** — ${firstSentence(para)}` : `- **${h[1].trim()}**`);
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
  const { title, canonicalUrl, format } = input;
  const body = diagnosticCtasToLinks(input.body, format);
  let out: string;
  if (format === "summary") {
    const summary = extractSummary(transformInline(body));
    if (summary === "") throw new Error("Post sem seções '## ' — use --format teaser ou full.");
    out = summary + cta(title, canonicalUrl, format);
  } else if (format === "teaser") {
    out = extractTeaser(transformInline(body)) + cta(title, canonicalUrl, format);
  } else {
    // Sem rodapé de origem: o TabNews já mostra "Fonte" com o source_url (a canônica).
    out = transformInline(body);
  }
  if (out.length > MAX_BODY)
    throw new Error(`Body de ${out.length} chars excede o limite de ${MAX_BODY.toLocaleString("pt-BR")} do TabNews.`);
  return out;
}
