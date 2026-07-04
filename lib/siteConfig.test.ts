import { describe, it, expect } from "vitest";
import { siteConfig } from "./siteConfig";

describe("siteConfig", () => {
  it("tem tagline curta nos dois idiomas", () => {
    expect(siteConfig.tagline.pt).toBe("IA aplicada em sistemas reais.");
    expect(siteConfig.tagline.en).toBe("Applied AI in real systems.");
  });
  it("tem statement completo nos dois idiomas", () => {
    expect(siteConfig.statement.pt).toContain("Sem hype");
    expect(siteConfig.statement.en).toContain("No hype");
  });
});
