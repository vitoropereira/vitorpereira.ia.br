import { describe, it, expect, vi } from "vitest";
import { buildTabNewsPreview, publishToTabNews } from "./publish-tabnews.ts";
import type { SourcePost } from "./types.ts";

const post: SourcePost = {
  title: "As 7 perguntas",
  body: "Lede.\n\n## 1. Objetivo — x\n\nCondição verificável. Mais.",
  canonicalUrl: "https://vitorpereira.ia.br/2026/07/18/arquitetura",
  permalink: "/2026/07/18/arquitetura",
  locale: "pt",
  draft: false,
  tags: ["agentes"],
};

describe("buildTabNewsPreview", () => {
  it("monta title/body/sourceUrl sem rede", () => {
    const c = buildTabNewsPreview(post, "summary", "published");
    expect(c.title).toBe("As 7 perguntas");
    expect(c.sourceUrl).toBe(post.canonicalUrl);
    expect(c.status).toBe("published");
    expect(c.body).toContain("- **1. Objetivo — x** — Condição verificável.");
  });
});

describe("publishToTabNews", () => {
  it("faz login, publica o body dado e devolve a URL", async () => {
    const createSession = vi.fn().mockResolvedValue({ token: "t".repeat(96), expiresAt: "z" });
    const createContent = vi.fn().mockResolvedValue({ url: "https://www.tabnews.com.br/vitor/as-7", ownerUsername: "vitor", slug: "as-7" });
    const content = { title: "T", body: "corpo editado", sourceUrl: post.canonicalUrl, status: "published" as const };
    const r = await publishToTabNews(content, "summary", { email: "a@b.com", password: "secret123" }, { createSession, createContent });
    expect(r.url).toBe("https://www.tabnews.com.br/vitor/as-7");
    expect(createContent.mock.calls[0][1]).toMatchObject({ body: "corpo editado", sourceUrl: post.canonicalUrl, status: "published" });
  });
});
