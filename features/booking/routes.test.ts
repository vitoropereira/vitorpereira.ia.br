import { bookingRoutes, bookingRoute, bookingIndex } from "./routes";
import { bookingServices } from "./services";

describe("rotas de agendamento", () => {
  it("resolve as rotas de entrada usadas pelos CTAs", () => {
    expect(bookingRoutes.diagnostic("pt")).toBe("/agendar/diagnostico-30min");
    expect(bookingRoutes.diagnostic("en")).toBe(
      "/en/booking/diagnostico-30min",
    );
    expect(bookingRoutes.operationalAgent("pt")).toBe(
      "/agendar/escopo-software-30-dias",
    );
    expect(bookingIndex("en")).toBe("/en/booking");
  });

  it("estoura se o CTA apontar para slug fora do catálogo", () => {
    // A proteção que faltava: antes as rotas eram string solta no siteConfig,
    // então renomear um serviço deixava o CTA apontando para 404 em silêncio.
    expect(() => bookingRoute("servico-que-nao-existe", "pt")).toThrow(
      /não existe em bookingServices/,
    );
  });

  it("gera rota válida para todo serviço do catálogo", () => {
    for (const service of bookingServices) {
      expect(bookingRoute(service.slug, "pt")).toBe(`/agendar/${service.slug}`);
      expect(bookingRoute(service.slug, "en")).toBe(
        `/en/booking/${service.slug}`,
      );
    }
  });
});
