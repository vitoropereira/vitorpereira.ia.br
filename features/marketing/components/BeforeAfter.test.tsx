import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  mockIntersectionObserver,
  mockMatchMedia,
} from "@/components/motion/testUtils";
import { BeforeAfter } from "./BeforeAfter";

let restoreIO: () => void;
let restoreMM: () => void;
beforeEach(() => {
  restoreIO = mockIntersectionObserver().restore;
  restoreMM = mockMatchMedia(false);
});
afterEach(() => {
  restoreIO();
  restoreMM();
});

describe("BeforeAfter", () => {
  it.each(["pt", "en"] as const)(
    "duas colunas, 4 itens cada, sem números (%s)",
    (locale) => {
      const { container } = render(<BeforeAfter locale={locale} />);
      const lists = container.querySelectorAll("ul");
      expect(lists).toHaveLength(2);
      lists.forEach((ul) => expect(ul.querySelectorAll("li")).toHaveLength(4));
      expect(container.textContent).not.toMatch(/\d/);
    },
  );

  it("é rotulado como exemplo", () => {
    render(<BeforeAfter locale="pt" />);
    expect(screen.getByText(/exemplo/i)).toBeInTheDocument();
  });
});
