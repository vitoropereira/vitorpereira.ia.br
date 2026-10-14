import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./gtag";

type GtagWindow = { gtag?: unknown };

describe("trackEvent", () => {
  afterEach(() => {
    delete (window as GtagWindow).gtag;
  });

  it("não faz nada nem lança erro sem window.gtag", () => {
    expect(() => trackEvent("x", { a: 1 })).not.toThrow();
  });

  it("chama gtag('event', nome, params) quando o GA está carregado", () => {
    const gtag = vi.fn();
    (window as GtagWindow).gtag = gtag;

    trackEvent("x", { a: 1 });

    expect(gtag).toHaveBeenCalledWith("event", "x", { a: 1 });
  });
});
