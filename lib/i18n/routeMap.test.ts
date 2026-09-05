import { describe, expect, it } from "vitest";
import { institutionalRoutes, swapLocale } from "./routeMap";

describe("institutionalRoutes — serviço", () => {
  it("mantém pares canônicos PT/EN para o Agente Operacional", () => {
    expect(institutionalRoutes.operationalAgent).toEqual({
      pt: "/servicos/agente-operacional",
      en: "/en/services/operational-ai-agent",
    });
  });
});

describe("swapLocale", () => {
  it("troca as rotas institucionais nos dois sentidos", () => {
    expect(swapLocale("/contato", "en")).toBe("/en/contact");
    expect(swapLocale("/en/contact", "pt")).toBe("/contato");
    expect(swapLocale("/", "en")).toBe("/en");
    expect(swapLocale("/en", "pt")).toBe("/");
  });

  it("troca rota aninhada cujo segmento pai muda de nome entre idiomas", () => {
    // Regressão: o seletor de idioma gerava /en/agendar/<slug> (404) porque
    // swapLocale só casava caminho exato e caía no fallback de posts.
    expect(swapLocale("/agendar/mentoria", "en")).toBe("/en/booking/mentoria");
    expect(swapLocale("/en/booking/mentoria", "pt")).toBe("/agendar/mentoria");
    expect(swapLocale("/agendar/diagnostico-30min", "en")).toBe(
      "/en/booking/diagnostico-30min",
    );
  });

  it("preserva o caminho de post, que compartilha slug entre idiomas", () => {
    expect(swapLocale("/2026/08/19/meu-post", "en")).toBe(
      "/en/2026/08/19/meu-post",
    );
    expect(swapLocale("/en/2026/08/19/meu-post", "pt")).toBe(
      "/2026/08/19/meu-post",
    );
  });
});
