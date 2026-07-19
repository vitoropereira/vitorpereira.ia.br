import { describe, it, expect } from "vitest";
import { toTabNewsMarkdown } from "./to-tabnews-markdown.ts";

const BODY = `Intro em [um link](/2026/05/31/ancora) que fisga.

Segundo parágrafo da lede.

## 1. Objetivo — o que precisa estar concluído?

Objetivo é condição de término verificável. Segue mais texto.

## 2. Contexto — o que ele sabe?

O erro comum é excesso, não falta. Mais uma frase.`;

const base = { title: "As 7 perguntas", canonicalUrl: "https://vitorpereira.ia.br/2026/07/18/arquitetura" };

const BODY_NO_SECTIONS = `Apenas um parágrafo, sem nenhuma seção.

Mais um parágrafo aqui, ainda sem heading nível 2.`;

const BODY_WITH_FENCE = `Intro antes do primeiro heading real.

\`\`\`md
## Isso não é um heading de verdade
código dentro do fence, não deve virar item nem cortar o teaser
\`\`\`

## Heading real depois do fence

Conteúdo da seção real. Mais uma frase.`;

describe("toTabNewsMarkdown", () => {
  it("summary: linha por seção + CTA pelo /api/track (f=summary)", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "summary" });
    expect(out).toContain("- **1. Objetivo — o que precisa estar concluído?** — Objetivo é condição de término verificável.");
    expect(out).toContain("- **2. Contexto — o que ele sabe?** — O erro comum é excesso, não falta.");
    expect(out).toContain("f=summary");
    expect(out).toContain("[As 7 perguntas](https://vitorpereira.ia.br/api/track?to=");
    // a canônica vai como parâmetro `to` (encodada), não como UTM cru no markdown
    expect(out).toContain(encodeURIComponent("https://vitorpereira.ia.br/2026/07/18/arquitetura"));
    expect(out).not.toContain("utm_content=");
  });
  it("teaser: lede (até 1º ##) com link absoluto + CTA pelo /api/track", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "teaser" });
    expect(out).toContain("[um link](https://vitorpereira.ia.br/2026/05/31/ancora)");
    expect(out).toContain("Segundo parágrafo da lede.");
    expect(out).not.toContain("## 1. Objetivo");
    expect(out).toContain("/api/track?to=");
    expect(out).toContain("f=teaser");
  });
  it("full: corpo inteiro + rodapé de origem pelo /api/track", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "full" });
    expect(out).toContain("## 1. Objetivo");
    expect(out).toContain("Publicado originalmente");
    expect(out).toContain("/api/track?to=");
    expect(out).toContain("f=full");
  });
  it("estoura acima de 20k chars", () => {
    expect(() => toTabNewsMarkdown({ ...base, body: "x".repeat(20001), format: "full" })).toThrow(/20/);
  });
  it("summary: sem seções '## ' falha loud em vez de virar só o CTA", () => {
    expect(() => toTabNewsMarkdown({ ...base, body: BODY_NO_SECTIONS, format: "summary" })).toThrow(/seções/);
  });
  it("summary: '## ' dentro de um fence não vira item, heading real fora do fence sim", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY_WITH_FENCE, format: "summary" });
    expect(out).toContain("- **Heading real depois do fence** — Conteúdo da seção real.");
    expect(out).not.toContain("Isso não é um heading de verdade");
  });
  it("teaser: '## ' dentro de um fence não corta a lede, e o fence permanece intacto", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY_WITH_FENCE, format: "teaser" });
    expect(out).toContain("Intro antes do primeiro heading real.");
    expect(out).toContain("```md");
    expect(out).toContain("## Isso não é um heading de verdade");
    expect(out).toContain("código dentro do fence, não deve virar item nem cortar o teaser");
    expect(out).not.toContain("## Heading real depois do fence");
  });
  it("full: fence com '## ' interno permanece intacto no corpo completo", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY_WITH_FENCE, format: "full" });
    expect(out).toContain("## Isso não é um heading de verdade");
    expect(out).toContain("## Heading real depois do fence");
  });
});
