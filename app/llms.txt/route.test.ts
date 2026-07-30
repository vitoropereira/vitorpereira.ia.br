import { describe, it, expect, vi } from "vitest";
import { siteConfig } from "@/lib/siteConfig";

// Minimal mocked content: one published PT post, one draft, and no EN posts —
// the draft must never leak and the empty EN section must be dropped entirely.
vi.mock("@/content", () => ({
  posts: [
    {
      locale: "pt",
      draft: false,
      permalink: "/2026/05/31/publicado",
      title: "Post publicado",
      excerpt: "Resumo\ncom quebra de linha.",
      date: "2026-05-31",
      tags: [],
    },
    {
      locale: "pt",
      draft: true,
      permalink: "/2026/06/01/rascunho",
      title: "Post rascunho",
      excerpt: "Não deve aparecer.",
      date: "2026-06-01",
      tags: [],
    },
  ],
}));

import { GET } from "./route";

const BASE = siteConfig.url;

async function body(): Promise<string> {
  return await (await GET()).text();
}

describe("llms.txt", () => {
  it("abre com H1 e blockquote do statement (formato da spec)", async () => {
    const text = await body();
    expect(text.startsWith(`# ${siteConfig.name}\n`)).toBe(true);
    expect(text).toContain(`> ${siteConfig.statement.pt}`);
  });

  it("lista post publicado com URL absoluta e excerpt em uma linha", async () => {
    const text = await body();
    expect(text).toContain(
      `- [Post publicado](${BASE}/2026/05/31/publicado): Resumo com quebra de linha.`,
    );
  });

  it("não vaza draft", async () => {
    const text = await body();
    expect(text).not.toContain("rascunho");
    expect(text).not.toContain("Não deve aparecer");
  });

  it("omite seção vazia em vez de deixar heading órfão", async () => {
    const text = await body();
    // Sem posts EN no mock, a seção não deve existir de forma alguma.
    expect(text).not.toContain("## Posts (en)");
    // As seções de páginas, que nunca são vazias, seguem presentes.
    expect(text).toContain("## Páginas (pt-BR)");
    expect(text).toContain("## Pages (en)");
  });

  it("serve text/plain utf-8", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  });
});
