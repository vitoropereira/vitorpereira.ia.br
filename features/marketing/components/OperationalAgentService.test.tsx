import { render, screen } from "@testing-library/react";
import { OperationalAgentService } from "./OperationalAgentService";

describe("OperationalAgentService", () => {
  it("define escopo, controles e CTA em português", () => {
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
    const links = screen.getAllByRole("link", {
      name: /conversar sobre um processo/i,
    });
    expect(links).toHaveLength(2);
    for (const link of links) expect(link).toHaveAttribute("href", "/contato");
  });

  it("mantém o contrato em inglês", () => {
    render(<OperationalAgentService locale="en" />);

    expect(
      screen.getByRole("heading", { name: /one real workflow/i }),
    ).toBeInTheDocument();
    const links = screen.getAllByRole("link", { name: /discuss a workflow/i });
    expect(links).toHaveLength(2);
    for (const link of links)
      expect(link).toHaveAttribute("href", "/en/contact");
  });
});
