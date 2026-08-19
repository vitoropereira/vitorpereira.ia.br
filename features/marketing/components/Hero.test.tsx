import { render, screen } from "@testing-library/react";
import { Hero } from "./Hero";

describe("Hero — oferta operacional", () => {
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
});
