import { render, screen } from "@testing-library/react";
import { OperationalAgentService } from "./OperationalAgentService";
import { bookingRoutes } from "@/features/booking/routes";

describe("OperationalAgentService", () => {
  it("define escopo, controles, investimento e CTA em português", () => {
    render(<OperationalAgentService locale="pt" />);

    expect(
      screen.getByRole("heading", { name: /um processo real/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Implantar", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/logs, regras e aprovação humana/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /piloto de um workflow operacional/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/a partir de r\$ 20\.000/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/sistema ampliado.*r\$ 40\.000/i),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: /agendar diagnóstico de escopo/i,
    });
    expect(links).toHaveLength(2);
    for (const link of links)
      expect(link).toHaveAttribute(
        "href",
        bookingRoutes.operationalAgent("pt"),
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
      screen.getByRole("heading", {
        name: /pilot for one operational workflow/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/from r\$ 20,000/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/expanded system.*r\$ 40,000/i),
    ).toBeInTheDocument();

    const links = screen.getAllByRole("link", {
      name: /book a scoping session/i,
    });
    expect(links).toHaveLength(2);
    for (const link of links)
      expect(link).toHaveAttribute(
        "href",
        bookingRoutes.operationalAgent("en"),
      );

    expect(
      screen.getByRole("link", { name: /i prefer another channel/i }),
    ).toHaveAttribute("href", "/en/contact");
  });

  it.each([
    ["pt", ["Mapear", "Avaliar", "Implantar", "Operar"]],
    ["en", ["Map", "Evaluate", "Deploy", "Operate"]],
  ] as const)("tem método, como funciona e FAQ (%s)", (locale, steps) => {
    const { container } = render(<OperationalAgentService locale={locale} />);
    for (const step of steps)
      expect(
        screen.getByRole("heading", { name: step, level: 3 }),
      ).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(5);
    // HowItWorks (5 passos) + MethodTimeline (4) = 2 listas ordenadas.
    const lists = container.querySelectorAll("ol");
    expect(lists).toHaveLength(2);
    expect(lists[0].querySelectorAll(":scope > li")).toHaveLength(5);
    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).toBeNull();
  });
});
