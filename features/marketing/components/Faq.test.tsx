import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Faq, getFaq } from "./Faq";
import { formatPrice, getBookingService } from "@/features/booking/services";

describe("Faq", () => {
  it.each(["pt", "en"] as const)(
    "5 perguntas como <details> (%s)",
    (locale) => {
      const { container } = render(<Faq locale={locale} />);
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
    const { container } = render(<Faq locale="pt" />);
    const ld = JSON.parse(
      container.querySelector('script[type="application/ld+json"]')!
        .textContent!,
    );
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(5);
  });

  it("withJsonLd=false não emite script", () => {
    const { container } = render(<Faq locale="pt" withJsonLd={false} />);
    expect(container.querySelector("script")).toBeNull();
  });
});
