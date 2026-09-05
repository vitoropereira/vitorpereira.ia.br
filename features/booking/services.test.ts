import {
  bookingServices,
  formatDuration,
  formatPrice,
  getBookingService,
} from "./services";

describe("catálogo de agendamento", () => {
  it("mantém slugs únicos e alinhados com o event type do Cal.com", () => {
    const slugs = bookingServices.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const service of bookingServices) {
      expect(service.calSlug).toBe(service.slug);
    }
  });

  it("marca o diagnóstico como gratuito e em destaque", () => {
    const diagnostic = getBookingService("diagnostico-30min");
    expect(diagnostic?.priceBRL).toBeNull();
    expect(diagnostic?.featured).toBe(true);
    expect(formatPrice(diagnostic!, "pt")).toBe("Grátis");
    expect(formatPrice(diagnostic!, "en")).toBe("Free");
  });

  it("usa 'a partir de' só no projeto de alto ticket", () => {
    expect(
      formatPrice(getBookingService("escopo-software-30-dias")!, "pt"),
    ).toBe("A partir de R$ 20.000");
    expect(formatPrice(getBookingService("agente-pessoal")!, "pt")).toBe(
      "R$ 3.500",
    );
  });

  it("formata duração nos dois idiomas", () => {
    expect(formatDuration(getBookingService("diagnostico-30min")!, "pt")).toBe(
      "30 min",
    );
    expect(
      formatDuration(getBookingService("consultoria-tecnica")!, "pt"),
    ).toBe("1 hora");
    expect(
      formatDuration(getBookingService("revisao-arquitetura")!, "en"),
    ).toBe("2 hours");
  });

  it("formata o preço no separador do idioma de quem lê", () => {
    // Regressão: toLocaleString("pt-BR") rodava nos dois locales, então o leitor
    // inglês via "R$ 20.000" — que em convenção en-US se lê como vinte reais.
    const projeto = getBookingService("escopo-software-30-dias")!;
    expect(formatPrice(projeto, "pt")).toBe("A partir de R$ 20.000");
    expect(formatPrice(projeto, "en")).toBe("From R$ 20,000");
    expect(formatPrice(getBookingService("agente-pessoal")!, "en")).toBe(
      "R$ 3,500",
    );
  });

  it("decide 'a partir de' por atributo do serviço, não por limiar de preço", () => {
    for (const service of bookingServices) {
      const pt = formatPrice(service, "pt");
      expect(pt.startsWith("A partir de")).toBe(Boolean(service.priceFrom));
    }
  });

  it("formata duração fracionária sem separador decimal", () => {
    const noventa = { ...getBookingService("mentoria")!, durationMinutes: 90 };
    expect(formatDuration(noventa, "pt")).toBe("1h30");
    expect(formatDuration(noventa, "en")).toBe("1h30");
  });

  it("tem copy nos dois idiomas para todo serviço", () => {
    for (const service of bookingServices) {
      expect(service.pt.name.length).toBeGreaterThan(3);
      expect(service.en.name.length).toBeGreaterThan(3);
      expect(service.pt.summary.length).toBeGreaterThan(20);
      expect(service.en.summary.length).toBeGreaterThan(20);
    }
  });
});
