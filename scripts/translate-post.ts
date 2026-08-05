/**
 * translate-post — gera a versão EN (`index.en.mdx`) de um post PT via Claude.
 *
 * Precisa de ANTHROPIC_API_KEY no ambiente. Roda local (autoria) e no CI
 * (.github/workflows/translate-posts.yml, que abre PR com o resultado).
 *
 *   pnpm translate content/posts/2026/07/25/ferramentas-como-contrato
 *   pnpm translate --all --dry-run
 *
 * Flags:
 *   --all        traduz todo post PT publicado (draft:false) que ainda não tem .en
 *   --include-drafts  junto com --all, inclui drafts
 *   --force      sobrescreve um index.en.mdx existente
 *   --dry-run    imprime o que faria (com --all não chama a API)
 *   --limit <n>  com --all, no máximo n posts nesta rodada (default 3)
 *
 * A tradução NUNCA é publicada direto: o frontmatter EN herda o `draft` do PT,
 * e no CI o resultado vira PR pra revisão humana.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import matter from "gray-matter";
import { buildEnglishMdx, englishPathFor, type TranslatedPost } from "../lib/mdx/translate.ts";

const MODEL = "claude-opus-5";
const POSTS_ROOT = path.join("content", "posts");

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const SYSTEM = `You translate Brazilian-Portuguese technical blog posts into English for a personal engineering blog (vitorpereira.ia.br). The author is Vitor Pereira, a software engineer working on applied AI.

Voice: direct, concrete, technical, no hype and no marketing register. He writes short paragraphs, uses em dashes, and states claims plainly. Preserve that. Do not make the English more formal, more enthusiastic, or more hedged than the Portuguese. Translate meaning, not word order — the result must read as if it were written in English, not translated.

Rules:
- Return the body as MDX, preserving every structural element exactly: heading levels, list markers, tables, blockquotes, bold/italic, and blank-line spacing between blocks.
- NEVER translate: code inside fenced blocks or inline backticks, MDX component names and their props (<Callout type="info">, <Video id="..." />), URLs, identifiers, file paths, CLI flags, and library or product names.
- DO translate the human-readable text nested inside MDX components (e.g. the children of <Callout>).
- Keep established English technical terms as-is rather than inventing translations (queue, payload, guardrail, deploy, tenant).
- Keep internal markdown links pointing at the same path — a later step rewrites them for the /en routes. Do not add or remove links.
- Hard-wrap body prose at roughly 80 characters, matching the source style. Never hard-wrap inside a code block, a table row, or a link.
- The description is meta text: one sentence, under 300 characters, no markdown.
- The title should read like an English headline, not a literal gloss of the Portuguese.`;

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "The post title in English." },
    description: { type: "string", description: "The frontmatter description in English, one sentence, no markdown." },
    body: { type: "string", description: "The full post body in English MDX, without frontmatter." },
  },
  required: ["title", "description", "body"],
  additionalProperties: false,
} as const;

async function translate(client: Anthropic, source: { title: string; description: string; body: string }): Promise<TranslatedPost> {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    system: SYSTEM,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: `Translate this post to English.

TITLE: ${source.title}

DESCRIPTION: ${source.description}

BODY:
${source.body}`,
      },
    ],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === "refusal") {
    throw new Error(`Modelo recusou a tradução (${message.stop_details?.category ?? "sem categoria"}).`);
  }
  if (message.stop_reason === "max_tokens") {
    throw new Error("Resposta truncada em max_tokens — post longo demais pra uma passada.");
  }

  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error("Resposta sem bloco de texto.");

  const parsed = JSON.parse(text.text) as TranslatedPost;
  if (!parsed.title?.trim() || !parsed.description?.trim() || !parsed.body?.trim()) {
    throw new Error("Tradução veio com campo vazio (title/description/body).");
  }
  return parsed;
}

/** Todo content/posts/**\/index.mdx do repo. */
export function findPtPosts(root: string = POSTS_ROOT): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === "index.mdx") out.push(full);
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

async function translateOne(client: Anthropic, mdxPath: string, force: boolean, dryRun: boolean): Promise<boolean> {
  const enPath = englishPathFor(mdxPath);
  if (existsSync(enPath) && !force) {
    console.log(`· pulando (já tem EN): ${mdxPath}`);
    return false;
  }

  const raw = readFileSync(mdxPath, "utf8");
  const { data, content } = matter(raw);
  const title = String(data.title ?? "");
  if (!title) fail(`Post sem título no frontmatter: ${mdxPath}`);

  if (dryRun) {
    console.log(`· [dry-run] traduziria ${mdxPath} → ${enPath}`);
    return false;
  }

  console.log(`· traduzindo ${mdxPath} …`);
  const translated = await translate(client, {
    title,
    description: String(data.description ?? ""),
    body: content.trim(),
  });

  writeFileSync(enPath, buildEnglishMdx(raw, translated));
  console.log(`  ✓ ${enPath}`);
  return true;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let target: string | undefined;
  let all = false;
  let includeDrafts = false;
  let force = false;
  let dryRun = false;
  let limit = 3;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") all = true;
    else if (a === "--include-drafts") includeDrafts = true;
    else if (a === "--force") force = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--limit") limit = Number(argv[++i]);
    else if (a.startsWith("--")) fail(`Flag desconhecida: ${a}`);
    else if (target === undefined) target = a;
    else fail(`Argumento inesperado: ${a}`);
  }

  if (!all && !target) fail("Uso: pnpm translate <caminho-do-post> | pnpm translate --all [--limit n]");
  if (all && target) fail("Use --all OU um caminho, não os dois.");
  if (!Number.isInteger(limit) || limit < 1) fail(`--limit inválido: ${limit}`);

  let queue: string[];
  if (all) {
    queue = findPtPosts().filter((p) => {
      if (existsSync(englishPathFor(p)) && !force) return false;
      const { data } = matter(readFileSync(p, "utf8"));
      return includeDrafts || !data.draft;
    });
    if (queue.length === 0) {
      console.log("\n✓ Nada pendente — todo post PT publicado já tem versão EN.\n");
      return;
    }
    if (queue.length > limit) {
      console.log(`· ${queue.length} pendentes; processando ${limit} nesta rodada (--limit).`);
      queue = queue.slice(0, limit);
    }
  } else {
    const mdxPath = target!.endsWith("index.mdx")
      ? target!
      : path.join(target!.replace(/\/$/, ""), "index.mdx");
    if (!existsSync(mdxPath)) fail(`Arquivo não encontrado: ${mdxPath}`);
    queue = [mdxPath];
  }

  const needsApi = !dryRun;
  if (needsApi && !process.env.ANTHROPIC_API_KEY) {
    fail("ANTHROPIC_API_KEY não está no ambiente.");
  }
  const client = new Anthropic();

  let written = 0;
  for (const mdxPath of queue) {
    try {
      if (await translateOne(client, mdxPath, force, dryRun)) written++;
    } catch (e) {
      console.error(`  ✖ ${mdxPath}: ${e instanceof Error ? e.message : String(e)}`);
      process.exitCode = 1;
    }
  }

  console.log(`\n${written} arquivo(s) escrito(s).`);
  if (written > 0) console.log("Revise antes de publicar — a tradução herda o draft do post PT.\n");
}

await main();
