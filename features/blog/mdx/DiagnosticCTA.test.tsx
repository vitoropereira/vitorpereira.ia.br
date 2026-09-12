import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@vercel/analytics", () => ({ track }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/2026/07/25/ferramentas-como-contrato",
}));

import { DiagnosticCTA } from "./DiagnosticCTA";

describe("DiagnosticCTA", () => {
  it("mantém um link funcional e mede o clique com contexto editorial", () => {
    render(
      <DiagnosticCTA locale="pt">
        Trazer o fluxo para diagnóstico
      </DiagnosticCTA>,
    );

    const link = screen.getByRole("link", {
      name: /trazer o fluxo para diagnóstico/i,
    });
    expect(link).toHaveAttribute("href", "/agendar/diagnostico-30min");
    link.addEventListener("click", (event) => event.preventDefault());

    fireEvent.click(link);

    expect(track).toHaveBeenCalledWith("diagnostic_cta_click", {
      source: "/2026/07/25/ferramentas-como-contrato",
      locale: "pt",
      target: "/agendar/diagnostico-30min",
    });
  });

  it("usa o destino em inglês sem misturar rotas", () => {
    render(<DiagnosticCTA locale="en">Book a diagnostic</DiagnosticCTA>);

    expect(
      screen.getByRole("link", { name: /book a diagnostic/i }),
    ).toHaveAttribute("href", "/en/booking/diagnostico-30min");
  });
});
