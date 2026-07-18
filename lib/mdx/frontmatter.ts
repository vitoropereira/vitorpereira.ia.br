import { readFileSync, writeFileSync } from "node:fs";

/** Lê um campo string simples do frontmatter (aspas opcionais). */
export function readFrontmatterField(mdxPath: string, field: string): string | undefined {
  const fm = readFileSync(mdxPath, "utf8").match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return undefined;
  const line = fm[1].split("\n").find((l) => l.startsWith(`${field}:`));
  return line?.slice(field.length + 1).trim().replace(/^["']|["']$/g, "");
}

/** Insere `tabnews: "<url>"` antes do `---` de fechamento, preservando o resto. */
export function writeSyndicationMarker(mdxPath: string, url: string): void {
  const src = readFileSync(mdxPath, "utf8");
  const m = src.match(/^(---\n[\s\S]*?)(\n---)/);
  if (!m) throw new Error(`Frontmatter não encontrado em ${mdxPath}`);
  writeFileSync(mdxPath, `${m[1]}\ntabnews: "${url}"${m[2]}${src.slice(m[0].length)}`);
}
