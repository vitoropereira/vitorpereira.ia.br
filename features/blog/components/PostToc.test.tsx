import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PostToc } from "./PostToc";
import { mockIntersectionObserver } from "@/components/motion/testUtils";

const items = [
  { slug: "a", text: "Primeiro", level: 2 as const },
  { slug: "b", text: "Segundo", level: 2 as const },
];

describe("PostToc", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  beforeEach(() => {
    io = mockIntersectionObserver();
  });
  afterEach(() => io.restore());

  it("marca o item intersectando com aria-current", () => {
    render(<PostToc items={items} locale="pt" />);
    expect(screen.getByRole("navigation", { name: "Neste post" })).toBeTruthy();
    act(() => {
      io.instances[0].cb([
        { isIntersecting: true, target: { id: "b" } as Element },
      ]);
    });
    expect(screen.getByText("Segundo").closest("a")).toHaveAttribute(
      "aria-current",
      "location",
    );
    expect(screen.getByText("Primeiro").closest("a")).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("não renderiza nada sem itens", () => {
    const { container } = render(<PostToc items={[]} locale="en" />);
    expect(container).toBeEmptyDOMElement();
  });
});
