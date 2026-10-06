import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  mockIntersectionObserver,
  mockMatchMedia,
} from "@/components/motion/testUtils";
import { Hero } from "./Hero";

describe("Hero — oferta operacional", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;

  beforeEach(() => {
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
  });

  afterEach(() => {
    io.restore();
    restoreMM();
  });

  it("explica o trabalho comprável e leva ao serviço e aos casos em PT", () => {
    render(<Hero locale="pt" />);

    expect(
      screen.getByText(
        /projeto e implanto agentes que executam processos reais/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /conhecer o agente operacional/i }),
    ).toHaveAttribute("href", "/servicos/agente-operacional");
    expect(
      screen.getByRole("link", { name: /ver casos reais/i }),
    ).toHaveAttribute("href", "#casos");
  });

  it("preserva a experiência bilíngue", () => {
    render(<Hero locale="en" />);

    expect(
      screen.getByText(/design and deploy agents that execute real workflows/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /explore the operational ai agent/i }),
    ).toHaveAttribute("href", "/en/services/operational-ai-agent");
  });

  it("mostra o log de exemplo ao lado do texto", () => {
    render(<Hero locale="pt" />);
    expect(
      screen.getByRole("figure", { name: /exemplo de um agente/i }),
    ).toBeInTheDocument();
  });

  it("o hero não é envolvido por Reveal (é o LCP)", () => {
    const { container } = render(<Hero locale="pt" />);
    expect(container.querySelector("[data-reveal]")).toBeNull();
  });
});
