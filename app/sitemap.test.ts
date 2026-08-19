import { describe, it, expect, vi } from "vitest";
import { siteConfig } from "@/lib/siteConfig";

// Minimal mocked content: one PT post with an EN pair, one PT-only post.
vi.mock("@/content", () => ({
  posts: [
    {
      locale: "pt",
      draft: false,
      permalink: "/2026/04/21/pair",
      date: "2026-04-21",
      tags: [],
      translationSlug: "/en/2026/04/21/pair",
    },
    {
      locale: "pt",
      draft: false,
      permalink: "/2026/05/31/solo",
      date: "2026-05-31",
      tags: [],
      translationSlug: null,
    },
    {
      locale: "pt",
      draft: false,
      permalink: "/2027/01/02/agendado",
      date: "2027-01-02T10:00:00-03:00",
      tags: [],
      translationSlug: null,
    },
  ],
}));

import sitemap, { revalidate } from "./sitemap";

const BASE = siteConfig.url;

describe("sitemap — hreflang alternates", () => {
  const find = (url: string) => sitemap().find((e) => e.url === url);

  it("post com tradução: alternates recíprocos pt-BR + en", () => {
    const e = find(`${BASE}/2026/04/21/pair`);
    expect(e).toBeDefined();
    const langs = e?.alternates?.languages as Record<string, string>;
    expect(langs["pt-BR"]).toBe(`${BASE}/2026/04/21/pair`);
    expect(langs.en).toBe(`${BASE}/en/2026/04/21/pair`);
  });

  it("post SEM tradução: não fabrica alternate self-referencial", () => {
    const e = find(`${BASE}/2026/05/31/solo`);
    expect(e).toBeDefined();
    // Bug: antes emitia `en` = a própria URL PT. Sem par, não há alternates.
    const langs = e?.alternates?.languages as
      | Record<string, string>
      | undefined;
    expect(langs?.en).toBeUndefined();
  });

  it("inclui as páginas canônicas PT/EN do Agente Operacional", () => {
    const service = find(`${BASE}/servicos/agente-operacional`);
    expect(service).toBeDefined();
    expect(service?.lastModified).toBeUndefined();
    expect(find(`${BASE}/en/services/operational-ai-agent`)).toBeDefined();
  });

  it("inclui post agendado quando a janela de ISR reexecuta após a publicação", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2027-01-02T09:00:00-03:00"));
      expect(find(`${BASE}/2027/01/02/agendado`)).toBeUndefined();

      vi.setSystemTime(new Date("2027-01-02T11:00:00-03:00"));
      expect(find(`${BASE}/2027/01/02/agendado`)).toBeDefined();
      expect(revalidate).toBe(600);
    } finally {
      vi.useRealTimers();
    }
  });
});
