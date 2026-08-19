import { describe, expect, it } from "vitest";
import { institutionalRoutes } from "./routeMap";

describe("institutionalRoutes — serviço", () => {
  it("mantém pares canônicos PT/EN para o Agente Operacional", () => {
    expect(institutionalRoutes.operationalAgent).toEqual({
      pt: "/servicos/agente-operacional",
      en: "/en/services/operational-ai-agent",
    });
  });
});
