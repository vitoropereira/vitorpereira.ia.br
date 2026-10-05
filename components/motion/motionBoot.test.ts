import { afterEach, describe, expect, it, vi } from "vitest";
import { MOTION_BOOT_SCRIPT } from "./motionBoot";

function runBoot() {
   
  new Function(MOTION_BOOT_SCRIPT)();
}

describe("MOTION_BOOT_SCRIPT", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.className = "";
    delete document.documentElement.dataset.motion;
  });

  it("marca <html> com .js antes da pintura", () => {
    runBoot();
    expect(document.documentElement.classList.contains("js")).toBe(true);
  });

  it("remove .js se nenhum Reveal montou em 4s (hidratação falhou)", () => {
    vi.useFakeTimers();
    runBoot();
    vi.advanceTimersByTime(4000);
    expect(document.documentElement.classList.contains("js")).toBe(false);
  });

  it("mantém .js quando o Reveal sinalizou que está pronto", () => {
    vi.useFakeTimers();
    runBoot();
    document.documentElement.dataset.motion = "ready";
    vi.advanceTimersByTime(4000);
    expect(document.documentElement.classList.contains("js")).toBe(true);
  });
});
