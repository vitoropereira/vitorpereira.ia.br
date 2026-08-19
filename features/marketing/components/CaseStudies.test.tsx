import { render, screen } from "@testing-library/react";
import { CaseStudies } from "./CaseStudies";

describe("CaseStudies", () => {
  it("liga problemas reais aos artigos técnicos em PT", () => {
    const { container } = render(<CaseStudies locale="pt" />);

    expect(container.querySelector("#casos")).toBeInTheDocument();
    expect(
      screen.getByText(/casos e decisões de produção/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /fila que preservou o payload/i }),
    ).toHaveAttribute("href", "/2026/08/06/fila-que-guarda-o-payload-cru");
    expect(screen.getByRole("link", { name: /idor e rls/i })).toHaveAttribute(
      "href",
      "/2026/08/08/idor-a-fronteira-e-o-servidor",
    );
    expect(screen.getByRole("link", { name: /quatro eixos/i })).toHaveAttribute(
      "href",
      "/2026/08/13/avaliar-agente-quatro-eixos",
    );
  });

  it("usa apenas cases com tradução real na versão inglesa", () => {
    render(<CaseStudies locale="en" />);
    expect(
      screen.getByRole("link", {
        name: /queue that preserved the raw payload/i,
      }),
    ).toHaveAttribute("href", "/en/2026/08/06/fila-que-guarda-o-payload-cru");
    expect(screen.queryByText(/four axes/i)).not.toBeInTheDocument();
  });
});
