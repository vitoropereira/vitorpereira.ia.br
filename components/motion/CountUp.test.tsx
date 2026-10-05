import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { CountUp } from "./CountUp.tsx";
import { mockIntersectionObserver, mockMatchMedia } from "./testUtils";

describe("CountUp", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;

  beforeEach(() => {
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
  });
  afterEach(() => {
    io.restore();
    restoreMM();
    vi.useRealTimers();
  });

  it("o HTML inicial já tem o valor final (SEO e sem JS)", () => {
    const { container } = render(<CountUp value="3,6M+" />);
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("3,6M+");
  });

  it("expõe o valor final para leitor de tela e esconde o animado", () => {
    const { container } = render(<CountUp value="70+" />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("70+");
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("anima ao entrar na tela e termina exatamente no texto original", () => {
    vi.useFakeTimers();
    const { container } = render(<CountUp value="~700" durationMs={1000} />);
    const visual = container.querySelector("[aria-hidden]")!;
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(300));
    expect(visual.textContent).not.toBe("~700");
    act(() => vi.advanceTimersByTime(1500));
    expect(visual.textContent).toBe("~700");
  });

  it("com reduced-motion não anima", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    vi.useFakeTimers();
    const { container } = render(<CountUp value="~400" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(50));
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("~400");
  });

  it("texto não numérico renderiza como está, sem lançar", () => {
    const { container } = render(<CountUp value="N/A" />);
    act(() => io.trigger(true));
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("N/A");
  });
});
