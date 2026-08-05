/**
 * new-post — cria o esqueleto de um post novo em content/posts/AAAA/MM/DD/slug/.
 *
 * Uso LOCAL (autoria). Não chama API nenhuma, não precisa de key.
 *
 *   pnpm new:post "Ferramentas como contrato"
 *   pnpm new:post "Nove números banidos" --date 2026-08-11 --tags arquitetura,dados
 *
 * Flags:
 *   --date <AAAA-MM-DD>  data do post (default: hoje, timezone local)
 *   --slug <slug>        slug custom (default: derivado do título)
 *   --tags <a,b,c>       tags do frontmatter (default: vazio)
 *   --description <str>  description do frontmatter (default: placeholder)
 *   --publish            cria com draft:false (default: draft:true)
 *   --cover-prompt       cria também um cover.prompt.txt vazio pro gen:cover
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

/** Slug ASCII, minúsculo, hifenizado — remove acentos e pontuação. */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    // combining diacritics — escape explícito pra não depender de bytes literais no fonte
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Valida AAAA-MM-DD e devolve as partes já zero-padded. */
export function parseDate(input: string): { year: string; month: string; day: string } {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Data inválida (esperado AAAA-MM-DD): ${input}`);
  const [, year, month, day] = m;
  const asDate = new Date(`${input}T12:00:00Z`);
  if (Number.isNaN(asDate.getTime())) throw new Error(`Data inexistente: ${input}`);
  return { year, month, day };
}

function todayLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function buildFrontmatter(opts: {
  title: string;
  description: string;
  date: string;
  tags: string[];
  draft: boolean;
}): string {
  const tags = opts.tags.length > 0 ? `[${opts.tags.join(", ")}]` : "[]";
  return [
    "---",
    `title: "${opts.title.replace(/"/g, '\\"')}"`,
    `description: "${opts.description.replace(/"/g, '\\"')}"`,
    `date: ${opts.date}T10:00:00-03:00`,
    `draft: ${opts.draft}`,
    `tags: ${tags}`,
    "comments: true",
    "---",
  ].join("\n");
}

function main(): void {
  const argv = process.argv.slice(2);
  let title: string | undefined;
  let date: string | undefined;
  let slug: string | undefined;
  let description = "TODO: escreva a description (vai pro card, pro OG e pro Google).";
  let tags: string[] = [];
  let draft = true;
  let coverPrompt = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--date") date = argv[++i];
    else if (a === "--slug") slug = argv[++i];
    else if (a === "--description") description = argv[++i];
    else if (a === "--tags") tags = (argv[++i] ?? "").split(",").map((t) => t.trim()).filter(Boolean);
    else if (a === "--publish") draft = false;
    else if (a === "--cover-prompt") coverPrompt = true;
    else if (a.startsWith("--")) fail(`Flag desconhecida: ${a}`);
    else if (title === undefined) title = a;
    else fail(`Argumento inesperado: ${a}`);
  }

  if (!title) {
    fail('Uso: pnpm new:post "Título do post" [--date AAAA-MM-DD] [--slug s] [--tags a,b] [--publish]');
  }

  const finalSlug = slug ? slugify(slug) : slugify(title);
  if (!finalSlug) fail(`Não consegui derivar um slug de "${title}" — passe --slug.`);

  let parts: { year: string; month: string; day: string };
  try {
    parts = parseDate(date ?? todayLocal());
  } catch (e) {
    fail(e instanceof Error ? e.message : String(e));
  }

  const dir = path.join("content", "posts", parts.year, parts.month, parts.day, finalSlug);
  const mdxPath = path.join(dir, "index.mdx");
  if (existsSync(mdxPath)) fail(`Já existe: ${mdxPath}`);

  const frontmatter = buildFrontmatter({
    title,
    description,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    tags,
    draft,
  });

  mkdirSync(dir, { recursive: true });
  writeFileSync(mdxPath, `${frontmatter}\n\nTODO: escreva o post.\n`);

  if (coverPrompt) {
    const promptPath = path.join(dir, "cover.prompt.txt");
    if (!existsSync(promptPath)) {
      writeFileSync(promptPath, "TODO: prompt da capa. Rode `pnpm gen:cover --post " + dir + "`.\n");
    }
  }

  console.log(`\n✓ ${mdxPath}`);
  console.log(`· permalink: /${parts.year}/${parts.month}/${parts.day}/${finalSlug}`);
  console.log(`· draft: ${draft}${draft ? " (não aparece em produção)" : ""}`);
  if (coverPrompt) console.log(`· capa: edite ${path.join(dir, "cover.prompt.txt")} e rode pnpm gen:cover --post ${dir}`);
  console.log(`\nQuando publicar, gere a versão EN com:\n  pnpm translate ${dir}\n`);
}

// Só roda quando invocado como CLI — os helpers acima são importáveis nos testes.
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
