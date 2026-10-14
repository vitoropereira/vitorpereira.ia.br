import { describe, expect, it } from "vitest";
import { diaSaoPaulo, ehSegunda, somarDias, ultimosDias } from "./dia";

describe("diaSaoPaulo", () => {
  it("usa a data de Brasília, não a UTC", () => {
    expect(diaSaoPaulo(new Date("2026-10-14T02:30:00Z"))).toBe("2026-10-13");
    expect(diaSaoPaulo(new Date("2026-10-14T03:00:00Z"))).toBe("2026-10-14");
  });
});

describe("ultimosDias", () => {
  it("devolve os n dias até o dia dado, em ordem", () => {
    expect(ultimosDias("2026-10-14", 4)).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
    ]);
  });

  it("atravessa a virada do mês", () => {
    expect(ultimosDias("2026-11-01", 2)).toEqual(["2026-10-31", "2026-11-01"]);
  });
});

describe("somarDias", () => {
  it("soma e subtrai dias de calendário", () => {
    expect(somarDias("2026-10-14", -3)).toBe("2026-10-11");
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("ehSegunda", () => {
  it("reconhece a segunda-feira", () => {
    expect(ehSegunda("2026-10-12")).toBe(true);
    expect(ehSegunda("2026-10-14")).toBe(false);
  });
});
