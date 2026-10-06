import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guarda os seletores `.prose-about` de app/globals.css: eles dependem dos ids
// que o rehype-slug gera destes headings. Renomear um heading quebra aqui, e
// não em silêncio no estilo.
const read = (f: string) => readFileSync(`content/pages/${f}`, "utf8");

describe(".prose-about depende dos headings da página Sobre", () => {
  it("PT", () => {
    const s = read("sobre.mdx");
    expect(s).toContain("## Destaques");
    expect(s).toContain("## Minha jornada");
  });
  it("EN", () => {
    const s = read("sobre.en.mdx");
    expect(s).toContain("## Highlights");
    expect(s).toContain("## Career timeline");
  });
});
