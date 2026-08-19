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
    {
      locale: "pt",
      draft: false,
      permalink: "/2027/01/02/agendado",
      title: "Post agendado",
      excerpt: "Entra sem novo deploy depois da data.",
      date: "2027-01-02T10:00:00-03:00",
      tags: [],
    },
  ],
}));

import { GET, dynamic, revalidate } from "./route";

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

  it("lista a página canônica do Agente Operacional", async () => {
    const text = await body();
    expect(text).toContain(
      `- [Agente Operacional de IA](${BASE}/servicos/agente-operacional)`,
    );
    expect(text).toContain(
      `- [Operational AI Agent](${BASE}/en/services/operational-ai-agent)`,
    );
  });

  it("recalcula posts agendados depois da data e limita o cache a 10 minutos", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2027-01-02T09:00:00-03:00"));
      expect(await body()).not.toContain("Post agendado");

      vi.setSystemTime(new Date("2027-01-02T11:00:00-03:00"));
      const res = await GET();
      expect(await res.text()).toContain("Post agendado");
      expect(dynamic).toBe("force-dynamic");
      expect(revalidate).toBe(600);
      expect(res.headers.get("Cache-Control")).toContain("s-maxage=600");
    } finally {
      vi.useRealTimers();
    }
  });
});
