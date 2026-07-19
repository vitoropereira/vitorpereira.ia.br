import { readFileSync, writeFileSync } from "node:fs";

/** Lê um campo string simples do frontmatter (aspas opcionais). */
export function readFrontmatterField(mdxPath: string, field: string): string | undefined {
  const fm = readFileSync(mdxPath, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return undefined;
  const line = fm[1].split("\n").find((l) => l.startsWith(`${field}:`));
  return line?.slice(field.length + 1).trim().replace(/^["']|["']$/g, "");
}

/**
 * Insere `tabnews: "<url>"` no frontmatter, preservando o resto.
 * Idempotente: se a chave `tabnews:` já existir, é substituída in-place
 * (nunca duplicada); caso contrário é inserida antes do `---` de fechamento.
 */
export function writeSyndicationMarker(mdxPath: string, url: string): void {
  const src = readFileSync(mdxPath, "utf8");
  const m = src.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!m) throw new Error(`Frontmatter não encontrado em ${mdxPath}`);
  const [full, open, body, close] = m;
  const line = `tabnews: "${url}"`;
  const hasMarker = /^tabnews:.*$/m.test(body);
  const newBody = hasMarker ? body.replace(/^tabnews:.*$/m, line) : `${body}\n${line}`;
  writeFileSync(mdxPath, `${open}${newBody}${close}${src.slice(full.length)}`);
}
