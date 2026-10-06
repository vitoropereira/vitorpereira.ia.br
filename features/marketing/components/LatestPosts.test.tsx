import { render, screen } from "@testing-library/react";
import { LatestPosts } from "./LatestPosts";

describe("LatestPosts", () => {
  it("renderiza 6 cards, o primeiro em destaque e o sexto oculto só no 2-col", () => {
    const { container } = render(<LatestPosts locale="pt" />);
    const cards = container.querySelectorAll("article");
    expect(cards).toHaveLength(6);
    expect(cards[0].querySelector("a")).toHaveAttribute(
      "data-featured",
      "true",
    );
    expect(cards[1].querySelector("a")).not.toHaveAttribute("data-featured");
    expect(cards[0].className).toContain("sm:col-span-2");
    expect(cards[5].className).toContain("sm:max-lg:hidden");
  });

  it("o nome acessível de cada link começa pelo título", () => {
    const { container } = render(<LatestPosts locale="pt" />);
    container.querySelectorAll("article").forEach((card) => {
      const title = card.querySelector("h3")!.textContent!;
      const link = card.querySelector("a")!;
      expect(link.textContent!.startsWith(title)).toBe(true);
    });
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(6);
  });
});
