import { describe, expect, it } from "vitest";
import { formatStat, parseStat } from "./stat";

describe("parseStat", () => {
  it.each([
    ["70+", { prefix: "", value: 70, decimals: 0, suffix: "+" }],
    ["~700", { prefix: "~", value: 700, decimals: 0, suffix: "" }],
    ["3,6M+", { prefix: "", value: 3.6, decimals: 1, suffix: "M+" }],
    ["~400", { prefix: "~", value: 400, decimals: 0, suffix: "" }],
    ["3.6M+", { prefix: "", value: 3.6, decimals: 1, suffix: "M+" }],
  ])("%s", (input, expected) => {
    expect(parseStat(input)).toMatchObject(expected);
  });

  it("devolve null para texto sem número", () => {
    expect(parseStat("N/A")).toBeNull();
  });
});

describe("formatStat", () => {
  it("o valor final reproduz o texto original", () => {
    for (const s of ["70+", "~700", "3,6M+", "~400", "3.6M+"]) {
      const p = parseStat(s)!;
      expect(formatStat(p.value, p)).toBe(s);
    }
  });

  it("valores intermediários usam o separador e as casas do original", () => {
    const p = parseStat("3,6M+")!;
    expect(formatStat(1.234, p)).toBe("1,2M+");
    expect(formatStat(0, p)).toBe("0,0M+");
  });
});
