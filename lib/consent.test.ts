// @vitest-environment jsdom
import { clearAnalyticsCookies, readConsent, writeConsent } from "./consent";

function cookieNames() {
  return document.cookie
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
}

describe("clearAnalyticsCookies", () => {
  beforeEach(() => {
    for (const name of cookieNames()) {
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  });

  it("expira os cookies de GA e Clarity e preserva consent e NEXT_LOCALE", () => {
    writeConsent("accepted");
    document.cookie = "NEXT_LOCALE=en; path=/";
    for (const name of ["_ga", "_ga_ABC123", "_gid", "_clck", "_clsk"]) {
      document.cookie = `${name}=x; path=/`;
    }

    clearAnalyticsCookies();

    const names = cookieNames();
    expect(names).toContain("consent");
    expect(names).toContain("NEXT_LOCALE");
    for (const name of ["_ga", "_ga_ABC123", "_gid", "_clck", "_clsk"]) {
      expect(names).not.toContain(name);
    }
    expect(readConsent()).toBe("accepted");
  });
});
