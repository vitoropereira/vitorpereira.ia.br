import { render, screen } from "@testing-library/react";
import { ContactCTA } from "./ContactCTA";

describe("ContactCTA — próximo passo", () => {
  it("orienta a conversa para um processo em PT", () => {
    render(<ContactCTA locale="pt" />);
    expect(screen.getByText(/tem um processo repetitivo/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /conversar sobre um processo/i }),
    ).toHaveAttribute("href", "/contato");
  });

  it("preserva o CTA em inglês", () => {
    render(<ContactCTA locale="en" />);
    expect(
      screen.getByRole("link", { name: /discuss a workflow/i }),
    ).toHaveAttribute("href", "/en/contact");
  });
});
