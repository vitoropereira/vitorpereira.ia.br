import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("@/lib/consent", () => ({
  readConsent: vi.fn(),
  writeConsent: vi.fn(),
  clearAnalyticsCookies: vi.fn(),
}));

import {
  clearAnalyticsCookies,
  readConsent,
  writeConsent,
} from "@/lib/consent";
import { ConsentBanner } from "./ConsentBanner";

const reload = vi.fn();

describe("ConsentBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload },
    });
  });

  it("mostra Aceitar e Recusar como botões equivalentes, com link de privacidade", () => {
    render(<ConsentBanner initiallyVisible locale="pt" />);

    expect(screen.getByRole("button", { name: "Aceitar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Recusar" })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Política de privacidade" })
        .getAttribute("href"),
    ).toBe("/privacidade");
  });

  it("aponta para a política em inglês no locale en", () => {
    render(<ConsentBanner initiallyVisible locale="en" />);

    expect(
      screen.getByRole("link", { name: "Privacy policy" }).getAttribute("href"),
    ).toBe("/en/privacy");
  });

  it("recusar sem consentimento anterior só grava e não recarrega", () => {
    vi.mocked(readConsent).mockReturnValue(null);
    render(<ConsentBanner initiallyVisible locale="pt" />);

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    expect(writeConsent).toHaveBeenCalledWith("rejected");
    expect(clearAnalyticsCookies).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("recusar depois de aceitar apaga os cookies e recarrega", () => {
    vi.mocked(readConsent).mockReturnValue("accepted");
    render(<ConsentBanner initiallyVisible locale="pt" />);

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));

    expect(writeConsent).toHaveBeenCalledWith("rejected");
    expect(clearAnalyticsCookies).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});
