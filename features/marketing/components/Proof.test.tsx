import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Proof } from "./Proof";
import {
  mockIntersectionObserver,
  mockMatchMedia,
} from "@/components/motion/testUtils";

describe("Proof", () => {
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

  it("mantém os 4 números finais acessíveis em PT", () => {
    render(<Proof locale="pt" />);
    for (const v of ["70+", "~700", "3,6M+", "~400"]) {
      expect(screen.getAllByText(v).length).toBeGreaterThan(0);
    }
    expect(
      screen.getByText("founders simultâneos", { selector: "span" }),
    ).toBeInTheDocument();
  });

  it("cada stat entra com Reveal escalonado", () => {
    const { container } = render(<Proof locale="en" />);
    const revealed = container.querySelectorAll("[data-reveal]");
    expect(revealed).toHaveLength(4);
    expect(
      (revealed[3] as HTMLElement).style.getPropertyValue("--reveal-delay"),
    ).toBe("240ms");
  });
});
