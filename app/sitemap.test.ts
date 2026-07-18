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
  ],
}));

import sitemap from "./sitemap";

const BASE = siteConfig.url;

describe("sitemap — hreflang alternates", () => {
  const entries = sitemap();
  const find = (url: string) => entries.find((e) => e.url === url);

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
    const langs = e?.alternates?.languages as Record<string, string> | undefined;
    expect(langs?.en).toBeUndefined();
  });
});
