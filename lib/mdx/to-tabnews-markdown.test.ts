import { describe, it, expect } from "vitest";
import { toTabNewsMarkdown } from "./to-tabnews-markdown.ts";

const BODY = `Intro em [um link](/2026/05/31/ancora) que fisga.

Segundo parágrafo da lede.

## 1. Objetivo — o que precisa estar concluído?

Objetivo é condição de término verificável. Segue mais texto.

## 2. Contexto — o que ele sabe?

O erro comum é excesso, não falta. Mais uma frase.`;

const base = { title: "As 7 perguntas", canonicalUrl: "https://vitorpereira.ia.br/2026/07/18/arquitetura" };

describe("toTabNewsMarkdown", () => {
  it("summary: linha por seção + CTA com UTM", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "summary" });
    expect(out).toContain("- **1. Objetivo — o que precisa estar concluído?** — Objetivo é condição de término verificável.");
    expect(out).toContain("- **2. Contexto — o que ele sabe?** — O erro comum é excesso, não falta.");
    expect(out).toContain("utm_content=summary");
    expect(out).toContain("[As 7 perguntas](https://vitorpereira.ia.br/2026/07/18/arquitetura?");
  });
  it("teaser: lede (até 1º ##) com link absoluto + CTA", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "teaser" });
    expect(out).toContain("[um link](https://vitorpereira.ia.br/2026/05/31/ancora)");
    expect(out).toContain("Segundo parágrafo da lede.");
    expect(out).not.toContain("## 1. Objetivo");
    expect(out).toContain("utm_content=teaser");
  });
  it("full: corpo inteiro + rodapé de origem", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "full" });
    expect(out).toContain("## 1. Objetivo");
    expect(out).toContain("Publicado originalmente");
    expect(out).toContain("utm_content=full");
  });
  it("estoura acima de 20k chars", () => {
    expect(() => toTabNewsMarkdown({ ...base, body: "x".repeat(20001), format: "full" })).toThrow(/20/);
  });
});
