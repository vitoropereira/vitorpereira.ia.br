import { describe, expect, it } from "vitest";
import { cardLinks, cardSiteLinks, vCardUrls } from "./links";
import { siteConfig } from "@/lib/siteConfig";

describe("cardLinks", () => {
  it("não repete id", () => {
    const ids = cardLinks.map((link) => link.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("só aponta para https absoluto", () => {
    for (const link of cardLinks) {
      expect(link.href.startsWith("https://")).toBe(true);
    }
  });

  it("tem rótulo e descrição preenchidos", () => {
    for (const link of cardLinks) {
      expect(link.label.length).toBeGreaterThan(0);
      expect(link.description.length).toBeGreaterThan(0);
    }
  });
});

describe("cardSiteLinks", () => {
  it("usa caminho relativo — são rotas do próprio site", () => {
    for (const link of cardSiteLinks) {
      expect(link.href.startsWith("/")).toBe(true);
    }
  });
});

describe("vCardUrls", () => {
  it("começa pelo site e inclui todos os perfis", () => {
    const urls = vCardUrls();
    expect(urls[0]).toBe(siteConfig.url);
    expect(urls).toHaveLength(cardLinks.length + 1);
  });
});
