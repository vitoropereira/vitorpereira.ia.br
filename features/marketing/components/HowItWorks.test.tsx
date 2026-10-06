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
  it.each(["pt", "en"] as const)("tem 5 passos em ordem (%s)", (locale) => {
    render(<HowItWorks locale={locale} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
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
    expect(container.querySelector("line.how-line")).not.toBeNull();
  });
});
