import { describe, it, expect } from "vitest";
import { permalinkFromPath, loadPostFromPath } from "./load-post.ts";
import { writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("permalinkFromPath", () => {
  it("deriva o permalink do caminho do post", () => {
    expect(permalinkFromPath("content/posts/2026/07/18/arquitetura-mental/index.mdx")).toBe("/2026/07/18/arquitetura-mental");
  });
  it("aceita caminho absoluto", () => {
    expect(permalinkFromPath("/x/y/content/posts/2026/05/31/ancora/index.mdx")).toBe("/2026/05/31/ancora");
  });
  it("rejeita caminho que não é post PT", () => {
    expect(() => permalinkFromPath("content/posts/2026/07/18/x/index.en.mdx")).toThrow(/válido/);
  });
});

describe("loadPostFromPath", () => {
  it("carrega um SourcePost a partir do .mdx", () => {
    const root = mkdtempSync(join(tmpdir(), "post-"));
    const dir = join(root, "content/posts/2026/07/18/test-slug");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "index.mdx");
    writeFileSync(
      file,
      `---\ntitle: "Título de Teste"\ndraft: false\ntags: [agentes, ia]\n---\n\nCorpo do post.\n`,
    );

    const post = loadPostFromPath(file);

    expect(post).toEqual({
      title: "Título de Teste",
      body: "Corpo do post.",
      canonicalUrl: "https://vitorpereira.ia.br/2026/07/18/test-slug",
      permalink: "/2026/07/18/test-slug",
      locale: "pt",
      draft: false,
      tags: ["agentes", "ia"],
    });
  });
});
