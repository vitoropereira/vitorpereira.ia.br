import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { loadPostFromPath } from "../lib/mdx/load-post.ts";
import { readFrontmatterField, writeSyndicationMarker } from "../lib/mdx/frontmatter.ts";
import { buildTabNewsPreview, publishToTabNews } from "../lib/syndication/publish-tabnews.ts";
import type { SyndicationFormat } from "../lib/mdx/to-tabnews-markdown.ts";
import { recordSyndication } from "../lib/analytics/record.ts";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}
const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let target: string | undefined;
  let dryRun = false;
  let draft = false;
  let format: SyndicationFormat = "summary";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--draft") draft = true;
    else if (a === "--format") {
      format = argv[++i] as SyndicationFormat;
    } else if (a.startsWith("--")) fail(`Flag desconhecida: ${a}`);
    else if (target === undefined) target = a;
    else fail(`Argumento inesperado: ${a}`);
  }
  if (!target) fail("Uso: pnpm crosspost <caminho-do-post> [--dry-run] [--format summary|teaser|full] [--draft]");
  if (!["summary", "teaser", "full"].includes(format)) fail(`--format inválido: ${format}`);
  const status = draft ? "draft" : "published";

  const mdxPath = target.endsWith("index.mdx") ? target : `${target.replace(/\/$/, "")}/index.mdx`;
  if (!existsSync(mdxPath)) fail(`Arquivo não encontrado: ${mdxPath}`);

  const post = loadPostFromPath(mdxPath);
  if (post.draft) fail("Post está draft:true — publique no site antes de sindicar.");
  if (!post.title) fail("Post sem título no frontmatter.");

  const already = readFrontmatterField(mdxPath, "tabnews");
  if (already && !dryRun) fail(`Já sindicado: ${already} (remova o campo tabnews pra republicar).`);

  const slug = basename(mdxPath.replace(/\/index\.mdx$/, ""));
  const previewPath = `.syndication/${slug}.preview.md`;
  const content = buildTabNewsPreview(post, format, status);

  if (dryRun) {
    mkdirSync(".syndication", { recursive: true });
    writeFileSync(previewPath, `<!-- title: ${content.title} | source_url: ${content.sourceUrl} -->\n\n${content.body}\n`);
    console.log(`· dry-run — nada publicado`);
    console.log(`· formato: ${format} | status: ${status}`);
    console.log(`· preview salvo em ${previewPath} — edite e rode sem --dry-run pra publicar essa versão.\n`);
    console.log(content.body);
    return;
  }

  const email = process.env.TABNEWS_EMAIL?.trim();
  const password = process.env.TABNEWS_PASSWORD?.trim();
  if (!email || !password) fail("Defina TABNEWS_EMAIL e TABNEWS_PASSWORD no .env.development.local.");

  // A mão do Vitor manda: se existe preview editado, publica ELE (sem o cabeçalho <!-- ... -->).
  const finalBody = existsSync(previewPath)
    ? readFileSync(previewPath, "utf8").replace(/<!--[\s\S]*?-->\n*/, "").trim()
    : content.body;

  console.log(`· publicando "${post.title}" no TabNews (${format}${existsSync(previewPath) ? ", preview editado" : ""})…`);
  const result = await publishToTabNews({ ...content, body: finalBody }, format, { email, password });
  writeSyndicationMarker(mdxPath, result.url);
  console.log(`✓ publicado: ${result.url}`);
  console.log(`  marcador gravado em ${mdxPath} — revise o diff e commite.`);

  // Analytics (best-effort): registra a linha de syndication. Falha aqui NÃO
  // derruba o comando — o post no TabNews e o marcador já são a fonte da verdade.
  if (process.env.SUPABASE_TOKEN && process.env.SUPABASE_PROJECT_REF) {
    try {
      await recordSyndication({
        postPermalink: post.permalink,
        canonicalUrl: post.canonicalUrl,
        target: "tabnews",
        externalUrl: result.url,
        externalSlug: result.externalSlug,
        format,
        status,
        title: post.title,
        summaryCharCount: finalBody.length,
        tags: post.tags,
      });
      console.log(`  ✓ registrado no Supabase (vitor_syndications).`);
    } catch (e) {
      console.warn(`  ⚠ analytics não gravou (${errMsg(e)}) — post ok; dá pra backfill depois.`);
    }
  }
}

main().catch((e: unknown) => fail(errMsg(e)));
