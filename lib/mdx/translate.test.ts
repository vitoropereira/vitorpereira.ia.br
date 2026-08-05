import { describe, expect, it } from "vitest";
import matter from "gray-matter";
import { buildEnglishMdx, englishPathFor, localizeInternalLinks } from "./translate.ts";

describe("localizeInternalLinks", () => {
  it("mapeia rotas institucionais para os equivalentes EN", () => {
    expect(localizeInternalLinks("veja o [blog](/posts) e o [sobre](/sobre)")).toBe(
      "veja o [blog](/en/posts) e o [sobre](/en/about)",
    );
    expect(localizeInternalLinks("[contato](/contato)")).toBe("[contato](/en/contact)");
  });

  it("prefixa permalinks de post com /en", () => {
    expect(localizeInternalLinks("[texto anterior](/2026/07/18/arquitetura-mental-do-agente)")).toBe(
      "[texto anterior](/en/2026/07/18/arquitetura-mental-do-agente)",
    );
  });

  it("preserva a âncora ao reescrever", () => {
    expect(localizeInternalLinks("[x](/2026/07/18/slug#uma-secao)")).toBe(
      "[x](/en/2026/07/18/slug#uma-secao)",
    );
    expect(localizeInternalLinks("[x](/sobre#destaques)")).toBe("[x](/en/about#destaques)");
  });

  it("não mexe em URLs absolutas, âncoras puras nem links já em /en", () => {
    const untouched = [
      "[site](https://vitorpereira.ia.br/posts)",
      "[topo](#introducao)",
      "[ja-en](/en/posts)",
      "[ja-en-post](/en/2026/07/18/slug)",
    ].join("\n");
    expect(localizeInternalLinks(untouched)).toBe(untouched);
  });

  it("não reescreve caminhos internos desconhecidos", () => {
    expect(localizeInternalLinks("[algo](/rota-que-nao-existe)")).toBe("[algo](/rota-que-nao-existe)");
  });
});

describe("buildEnglishMdx", () => {
  const source = [
    "---",
    'title: "Ferramentas como contrato"',
    'description: "Um agente não chama sua API porque leu o código."',
    "date: 2026-07-25T10:00:00-03:00",
    "draft: true",
    "tags: [agentes, arquitetura]",
    "comments: true",
    'tabnews: "https://www.tabnews.com.br/vitor/x"',
    "---",
    "",
    "No [texto anterior](/2026/07/18/arquitetura-mental-do-agente) eu listei sete perguntas.",
    "",
    "```ts",
    'const x = "não traduzir";',
    "```",
  ].join("\n");

  const translated = {
    title: "Tools as contracts",
    description: "An agent does not call your API because it read the code.",
    body: [
      "In the [previous post](/2026/07/18/arquitetura-mental-do-agente) I listed seven questions.",
      "",
      "```ts",
      'const x = "não traduzir";',
      "```",
    ].join("\n"),
  };

  it("traduz title/description e preserva o resto do frontmatter", () => {
    const { data } = matter(buildEnglishMdx(source, translated));
    expect(data.title).toBe("Tools as contracts");
    expect(data.description).toBe("An agent does not call your API because it read the code.");
    expect(data.draft).toBe(true);
    expect(data.comments).toBe(true);
    expect(data.tags).toEqual(["agentes", "arquitetura"]);
    expect(new Date(data.date as string).toISOString()).toBe("2026-07-25T13:00:00.000Z");
  });

  it("remove o marcador tabnews (sindicação é do post PT)", () => {
    const { data } = matter(buildEnglishMdx(source, translated));
    expect(data.tabnews).toBeUndefined();
  });

  it("localiza links internos do corpo traduzido", () => {
    const out = buildEnglishMdx(source, translated);
    expect(out).toContain("(/en/2026/07/18/arquitetura-mental-do-agente)");
  });

  it("não altera o conteúdo de code fences", () => {
    const out = buildEnglishMdx(source, translated);
    expect(out).toContain('const x = "não traduzir";');
  });

  it("herda draft:false quando o post PT está publicado", () => {
    const published = source.replace("draft: true", "draft: false");
    const { data } = matter(buildEnglishMdx(published, translated));
    expect(data.draft).toBe(false);
  });
});

describe("englishPathFor", () => {
  it("troca index.mdx por index.en.mdx", () => {
    expect(englishPathFor("content/posts/2026/07/25/slug/index.mdx")).toBe(
      "content/posts/2026/07/25/slug/index.en.mdx",
    );
  });

  it("rejeita caminho que não é um post PT", () => {
    expect(() => englishPathFor("content/posts/2026/07/25/slug/index.en.mdx")).toThrow();
  });
});
