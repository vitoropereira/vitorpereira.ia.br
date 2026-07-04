import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renderiza o wordmark two-tone com o nome", () => {
    render(<Logo variant="wordmark" />);
    expect(screen.getByText("vitor")).toBeInTheDocument();
    expect(screen.getByText("pereira")).toBeInTheDocument();
  });

  it("renderiza o mark acessível", () => {
    render(<Logo variant="mark" />);
    expect(
      screen.getByRole("img", { name: /vitor pereira/i }),
    ).toBeInTheDocument();
  });
});
