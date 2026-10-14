import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./gtag";

type GtagWindow = { gtag?: unknown };

describe("trackEvent", () => {
  beforeEach(() => {
    document.cookie = "consent=accepted; path=/";
  });

  afterEach(() => {
    delete (window as GtagWindow).gtag;
    document.cookie = "consent=; path=/; max-age=0";
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

  it("não envia após retirar o consentimento, mesmo com gtag ainda carregado", () => {
    const gtag = vi.fn();
    (window as GtagWindow).gtag = gtag;
    document.cookie = "consent=; path=/; max-age=0";

    trackEvent("x", { a: 1 });

    expect(gtag).not.toHaveBeenCalled();
  });
});
