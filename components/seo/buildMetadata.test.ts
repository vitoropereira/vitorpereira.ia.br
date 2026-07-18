import { describe, it, expect } from "vitest";
import { buildMetadata } from "./buildMetadata";
import { siteConfig } from "@/lib/siteConfig";

const BASE = siteConfig.url;
type Langs = Record<string, string>;

describe("buildMetadata — hreflang alternates", () => {
  it("canonical sempre aponta pra própria URL", () => {
    const md = buildMetadata({
      title: "T",
      description: "D",
      path: "/2026/05/31/x",
      locale: "pt",
    });
    expect(md.alternates?.canonical).toBe(`${BASE}/2026/05/31/x`);
  });

  it("post PT com tradução EN: emite par recíproco pt-BR + en", () => {
    const md = buildMetadata({
      title: "T",
      description: "D",
      path: "/2026/04/21/hello-world",
      locale: "pt",
      alternatePath: "/en/2026/04/21/hello-world",
      type: "article",
    });
    const langs = md.alternates?.languages as Langs;
    expect(langs["pt-BR"]).toBe(`${BASE}/2026/04/21/hello-world`);
    expect(langs.en).toBe(`${BASE}/en/2026/04/21/hello-world`);
  });

  it("post PT SEM tradução: NÃO fabrica hreflang en apontando pra home /en", () => {
    const md = buildMetadata({
      title: "T",
      description: "D",
      path: "/2026/05/31/chatbot-nao-e-agente",
      locale: "pt",
      type: "article",
    });
    const langs = md.alternates?.languages as Langs;
    expect(langs["pt-BR"]).toBe(`${BASE}/2026/05/31/chatbot-nao-e-agente`);
    // Bug: antes vinha `${BASE}/en` (home EN) → par não-recíproco → "no return tag".
    expect(langs.en).toBeUndefined();
  });

  it("página EN sem par PT: NÃO fabrica hreflang pt-BR apontando pra home", () => {
    const md = buildMetadata({
      title: "T",
      description: "D",
      path: "/en/only",
      locale: "en",
    });
    const langs = md.alternates?.languages as Langs;
    expect(langs.en).toBe(`${BASE}/en/only`);
    expect(langs["pt-BR"]).toBeUndefined();
  });
});
