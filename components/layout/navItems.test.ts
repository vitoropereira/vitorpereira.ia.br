import { describe, expect, it } from "vitest";
import { buildNavItems } from "./navItems";

describe("buildNavItems", () => {
  for (const locale of ["pt", "en"] as const) {
    it(`${locale}: itens são JSON-serializáveis (fronteira RSC)`, () => {
      const items = buildNavItems(locale, (k) => k);
      expect(JSON.parse(JSON.stringify(items))).toEqual(items);
      for (const it of items)
        for (const p of it.matchPatterns ?? []) expect(typeof p).toBe("string");
    });
  }
});
