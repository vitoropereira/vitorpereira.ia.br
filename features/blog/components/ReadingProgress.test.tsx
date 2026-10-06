import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReadingProgress } from "./ReadingProgress";

describe("ReadingProgress", () => {
  beforeEach(() => {
    // rAF síncrono: o componente agenda a atualização num frame.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it("começa em 0", () => {
    render(<ReadingProgress locale="pt" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  });

  it("acompanha o scroll (~50% na metade)", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 1000,
    });
    render(<ReadingProgress locale="en" />);
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 500,
    });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    const bar = screen.getByRole("progressbar");
    expect(
      Math.abs(Number(bar.getAttribute("aria-valuenow")) - 50),
    ).toBeLessThanOrEqual(1);
    expect(bar).toHaveAttribute("aria-label", "Reading progress");
  });
});
