import { render, screen } from "@testing-library/react";
import { ContactCTA } from "./ContactCTA";
import { bookingRoutes } from "@/features/booking/routes";

describe("ContactCTA — próximo passo", () => {
  it("leva ao agendamento do diagnóstico em PT, mantendo o contato como alternativa", () => {
    render(<ContactCTA locale="pt" />);
    expect(screen.getByText(/tem um processo repetitivo/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /agendar diagnóstico de 30 min/i }),
    ).toHaveAttribute("href", bookingRoutes.diagnostic("pt"));
    expect(
      screen.getByRole("link", { name: /outros canais/i }),
    ).toHaveAttribute("href", "/contato");
  });

  it("preserva o mesmo caminho em inglês", () => {
    render(<ContactCTA locale="en" />);
    expect(
      screen.getByRole("link", { name: /book a 30-min diagnostic/i }),
    ).toHaveAttribute("href", bookingRoutes.diagnostic("en"));
    expect(
      screen.getByRole("link", { name: /other channels/i }),
    ).toHaveAttribute("href", "/en/contact");
  });
});
