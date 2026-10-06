import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Faq, buildCostAnswer, getFaq } from "./Faq";
import {
  formatDuration,
  formatPrice,
  getBookingService,
} from "@/features/booking/services";

describe("Faq", () => {
  it.each(["pt", "en"] as const)(
    "5 perguntas como <details> (%s)",
    (locale) => {
      const { container } = render(<Faq locale={locale} withJsonLd />);
      expect(container.querySelectorAll("details")).toHaveLength(5);
    },
  );

  it("o preço vem do catálogo de agendamento, não de texto fixo", () => {
    const service = getBookingService("escopo-software-30-dias")!;
    const pt = getFaq("pt")
      .map((i) => i.a)
      .join(" ")
      .toLowerCase();
    const en = getFaq("en")
      .map((i) => i.a)
      .join(" ")
      .toLowerCase();
    expect(pt).toContain(formatPrice(service, "pt").toLowerCase());
    expect(en).toContain(formatPrice(service, "en").toLowerCase());
  });

  it("emite JSON-LD FAQPage com as mesmas perguntas", () => {
    const { container } = render(<Faq locale="pt" withJsonLd />);
    const ld = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(5);
    getFaq("pt").forEach((item, i) =>
      expect(ld.mainEntity[i].name).toBe(item.q),
    );
  });

  it("withJsonLd=false não emite script", () => {
    const { container } = render(<Faq locale="pt" withJsonLd={false} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it.each(["pt", "en"] as const)(
    "4ª resposta traz o preço do piloto e a conversa grátis do catálogo (%s)",
    (locale) => {
      const pilot = getBookingService("escopo-software-30-dias")!;
      const diag = getBookingService("diagnostico-30min")!;
      const a = getFaq(locale)[3].a;
      expect(a.toLowerCase()).toContain(
        formatPrice(pilot, locale).toLowerCase(),
      );
      const name = diag[locale].name;
      const dur = formatDuration(diag, locale);
      expect(a).toContain(
        locale === "pt"
          ? `A primeira conversa, o ${name} (${dur}), é`
          : `The first conversation, the ${name} (${dur}), is`,
      );
      expect(a.toLowerCase()).toContain(
        formatPrice(diag, locale).toLowerCase(),
      );
    },
  );

  it("falha alto quando falta entrada no catálogo", () => {
    const diag = getBookingService("diagnostico-30min")!;
    expect(() => buildCostAnswer(undefined, diag, "pt")).toThrow(/catálogo/);
    expect(() => buildCostAnswer(diag, undefined, "en")).toThrow(/catálogo/);
  });
});
