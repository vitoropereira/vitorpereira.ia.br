import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let locale: "pt" | "en" = "pt";
vi.mock("next-intl", () => ({
  useLocale: () => locale,
  useTranslations: () => (key: string) => key,
}));

import { Footer } from "./Footer";

const casos = {
  pt: {
    links: {
      Blog: "/posts",
      Portfólio: "/portfolio",
      "Agente Operacional": "/servicos/agente-operacional",
      Sobre: "/sobre",
      Contato: "/contato",
    },
  },
  en: {
    links: {
      Blog: "/en/posts",
      Portfolio: "/en/portfolio",
      "Operational Agent": "/en/services/operational-ai-agent",
      About: "/en/about",
      Contact: "/en/contact",
    },
  },
} as const;

describe("Footer", () => {
  afterEach(() => {
    locale = "pt";
  });

  for (const l of ["pt", "en"] as const) {
    it(`mostra os 5 links de navegação em ${l}`, () => {
      locale = l;
      render(<Footer />);
      const nav = screen.getByRole("navigation", {
        name: l === "pt" ? "Navegação" : "Navigation",
      });
      for (const [label, href] of Object.entries(casos[l].links)) {
        const a = Array.from(nav.querySelectorAll("a")).find(
          (el) => el.textContent === label,
        );
        expect(a, label).toBeTruthy();
        expect(a).toHaveAttribute("href", href);
      }
    });
  }

  it("botão de cookies dispara consent:reopen", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    render(<Footer />);
    fireEvent.click(screen.getByRole("button", { name: "manageCookies" }));
    expect(spy.mock.calls.some(([e]) => e.type === "consent:reopen")).toBe(
      true,
    );
    spy.mockRestore();
  });
});
