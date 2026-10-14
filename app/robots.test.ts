import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "./robots";

afterEach(() => vi.unstubAllEnvs());

describe("robots", () => {
  it("produção libera o site e bloqueia /admin", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const rules = [robots().rules].flat();
    expect(rules).toContainEqual(
      expect.objectContaining({ userAgent: "*", allow: "/" }),
    );
    expect(rules.flatMap((r) => [r.disallow ?? []].flat())).toContain("/admin");
  });

  it("fora de produção bloqueia tudo", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots().rules).toEqual([{ userAgent: "*", disallow: "/" }]);
  });
});
