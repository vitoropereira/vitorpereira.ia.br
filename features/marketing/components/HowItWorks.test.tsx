import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  mockIntersectionObserver,
  mockMatchMedia,
} from "@/components/motion/testUtils";
import { HowItWorks } from "./HowItWorks";

const BANNED = /\b(RLS|guardrails?|LLM|webhooks?|event-driven)\b/i;

// Reveal é client component: precisa dos mocks de IntersectionObserver/matchMedia no jsdom.
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

describe("HowItWorks", () => {
  it.each([
    ["pt", "Algo chega", "Tudo fica registrado"],
    ["en", "Something arrives", "Everything is recorded"],
  ] as const)("tem 5 passos em ordem (%s)", (locale, first, last) => {
    render(<HowItWorks locale={locale} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent(first);
    expect(items[4]).toHaveTextContent(last);
  });

  it.each(["pt", "en"] as const)("não usa jargão (%s)", (locale) => {
    const { container } = render(<HowItWorks locale={locale} />);
    expect(container.textContent).not.toMatch(BANNED);
  });

  it("destaca a aprovação humana", () => {
    render(<HowItWorks locale="pt" />);
    expect(
      screen.getByText(/você aprova o que é sensível/i),
    ).toBeInTheDocument();
  });

  it("tem a linha conectora decorativa", () => {
    const { container } = render(<HowItWorks locale="pt" />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    const line = container.querySelector("line.how-line");
    expect(line).not.toBeNull();
    // vector-effect faz o Chrome ignorar pathLength e a linha vira tracejada.
    expect(line?.hasAttribute("vector-effect")).toBe(false);
    expect(line?.getAttribute("pathLength")).toBe("100");
    expect(line?.getAttribute("stroke-dasharray")).toBe("100");
  });
});
