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
  it("full: corpo inteiro sem rodapé de origem (o TabNews já mostra a Fonte pelo source_url)", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY, format: "full" });
    expect(out).toContain("## 1. Objetivo");
    expect(out).not.toContain("Publicado originalmente");
    expect(out.trimEnd().endsWith("O erro comum é excesso, não falta. Mais uma frase.")).toBe(true);
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

const BODY_CTA = `Intro.

## Próximo passo

Se fizer sentido, <DiagnosticCTA locale="pt">traga o caso para um
diagnóstico de 30 minutos</DiagnosticCTA>.`;

const BODY_TABLE_LIST = `Intro.

## Dados

| Leitura | Valor |
| --- | --- |
| A | 1 |

A projeção errou 0,8 ponto. Mais texto.

## Fontes

- [Site](https://exemplo.com): descrição.

## Só código

\`\`\`py
print(1)
\`\`\``;

describe("toTabNewsMarkdown — componentes e blocos", () => {
  it.each(["summary", "full"] as const)("%s: DiagnosticCTA vira link rastreado pro agendamento", (format) => {
    const out = toTabNewsMarkdown({ ...base, body: BODY_CTA, format });
    expect(out).not.toContain("DiagnosticCTA");
    const target = encodeURIComponent("https://vitorpereira.ia.br/agendar/diagnostico-30min");
    expect(out).toContain(
      `[traga o caso para um diagnóstico de 30 minutos](https://vitorpereira.ia.br/api/track?to=${target}&f=${format})`,
    );
  });

  it("DiagnosticCTA em inglês aponta pra rota EN", () => {
    const out = toTabNewsMarkdown({
      ...base,
      body: `## Next\n\n<DiagnosticCTA locale="en">book it</DiagnosticCTA>.`,
      format: "full",
    });
    expect(out).toContain(encodeURIComponent("https://vitorpereira.ia.br/en/booking/diagnostico-30min"));
  });

  it("summary: pula tabela, lista e código e usa o primeiro parágrafo de texto", () => {
    const out = toTabNewsMarkdown({ ...base, body: BODY_TABLE_LIST, format: "summary" });
    expect(out).toContain("- **Dados** — A projeção errou 0,8 ponto.");
    expect(out).not.toContain("| --- |");
    expect(out).not.toContain("- - ");
    // seção sem parágrafo de texto: só o título, sem travessão vazio
    expect(out).toContain("- **Fontes**\n");
    expect(out).toMatch(/- \*\*Só código\*\*(\n|$)/);
    expect(out).not.toContain("print(1)");
  });

  describe("parágrafos quebrados à mão no MDX", () => {
    const WRAPPED = `Primeira linha do parágrafo
continua aqui
e termina aqui.

Outro parágrafo
em duas linhas.

| a | b |
| --- | --- |
| 1 | 2 |

\`\`\`python
x = 1
y = 2
\`\`\`

- item um
  continua o item um
- item dois

> citação linha um
> citação linha dois

## Título
Texto logo abaixo
do título.

<Callout type="note">
  dentro do componente
  em duas linhas
</Callout>`;

    const full = () => toTabNewsMarkdown({ ...base, body: WRAPPED, format: "full" });

    it("junta as linhas de cada parágrafo numa só", () => {
      expect(full()).toContain("Primeira linha do parágrafo continua aqui e termina aqui.");
      expect(full()).toContain("Outro parágrafo em duas linhas.");
      expect(full()).toContain("## Título\nTexto logo abaixo do título.");
    });

    it("preserva tabela, código e citação linha a linha", () => {
      expect(full()).toContain("| a | b |\n| --- | --- |\n| 1 | 2 |");
      expect(full()).toContain("\`\`\`python\nx = 1\ny = 2\n\`\`\`");
      expect(full()).toContain("citação linha um\n");
    });

    it("mantém cada item de lista na própria linha, juntando só a continuação", () => {
      expect(full()).toContain("- item um continua o item um\n- item dois");
    });

    it("teaser também junta as linhas da lede", () => {
      const out = toTabNewsMarkdown({ ...base, body: WRAPPED, format: "teaser" });
      expect(out).toContain("Primeira linha do parágrafo continua aqui e termina aqui.");
    });
  });
});
