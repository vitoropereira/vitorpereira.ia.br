import { render, screen } from "@testing-library/react";
import { OperationalAgentService } from "./OperationalAgentService";
import { siteConfig } from "@/lib/siteConfig";

describe("OperationalAgentService", () => {
  it("define escopo, controles, investimento e CTA em português", () => {
    render(<OperationalAgentService locale="pt" />);

    expect(
      screen.getByRole("heading", { name: /um processo real/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/map → evaluate → deploy → operate/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/logs, regras e aprovação humana/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /a partir de r\$ 20\.000/i }),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: /agendar diagnóstico de escopo/i,
    });
    expect(links).toHaveLength(2);
    for (const link of links)
      expect(link).toHaveAttribute(
        "href",
        siteConfig.booking.routes.operationalAgent.pt,
      );

    expect(
      screen.getByRole("link", { name: /prefiro outro canal/i }),
    ).toHaveAttribute("href", "/contato");
  });

  it("mantém o contrato em inglês", () => {
    render(<OperationalAgentService locale="en" />);

    expect(
      screen.getByRole("heading", { name: /one real workflow/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /from r\$ 20,000/i }),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: /book a scoping session/i,
    });
    expect(links).toHaveLength(2);
    for (const link of links)
      expect(link).toHaveAttribute(
        "href",
        siteConfig.booking.routes.operationalAgent.en,
      );

    expect(
      screen.getByRole("link", { name: /i prefer another channel/i }),
    ).toHaveAttribute("href", "/en/contact");
  });
});
