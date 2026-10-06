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

  it("liga os passos com linha vertical no mobile (menos o último)", () => {
    render(<HowItWorks locale="pt" />);
    const items = screen.getAllByRole("listitem");
    items.slice(0, -1).forEach((li) => {
      expect(li.className).toContain("before:w-px");
      expect(li.className).toContain("sm:before:hidden");
    });
    expect(items[4]!.className).not.toContain("before:w-px");
  });

  it("centraliza o ícone no desktop (self-start do mobile não vaza pro lg)", () => {
    const { container } = render(<HowItWorks locale="pt" />);
    const li = screen.getAllByRole("listitem")[0]!;
    expect(li.className).toContain("lg:items-center");
    // self-start (mobile) venceria o items-center do flex e desalinharia a linha svg.
    const icon = container.querySelector("li div.bg-accent")!;
    expect(icon.className).toContain("sm:self-auto");
  });
});
