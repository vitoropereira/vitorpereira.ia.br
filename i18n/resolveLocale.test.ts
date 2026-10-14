import { describe, expect, it } from "vitest";
import { resolveLocale } from "./resolveLocale";

describe("resolveLocale", () => {
  it("mantém rotas sem prefixo em pt-BR mesmo após uma visita em inglês", () => {
    expect(resolveLocale("/servicos/agente-operacional")).toBe("pt");
  });

  it("resolve somente o prefixo /en como inglês", () => {
    expect(resolveLocale("/en")).toBe("en");
    expect(resolveLocale("/en/posts/tools-as-contracts")).toBe("en");
  });

  it("/admin fica em pt, fora do i18n", () => {
    expect(resolveLocale("/admin")).toBe("pt");
    expect(resolveLocale("/admin/redes")).toBe("pt");
  });
});
