import { describe, expect, it } from "vitest";
import { inicioSemana, semanaDe, ultimasSemanas } from "./semana";

describe("inicioSemana", () => {
  it("segunda é o próprio início", () => {
    expect(inicioSemana("2026-10-12")).toBe("2026-10-12");
  });

  it("domingo pertence à semana da segunda anterior", () => {
    expect(inicioSemana("2026-10-18")).toBe("2026-10-12");
  });

  it("quarta volta para a segunda", () => {
    expect(inicioSemana("2026-10-14")).toBe("2026-10-12");
  });
});

describe("semanaDe (instante em America/Sao_Paulo)", () => {
  it("domingo 23h30 BRT ainda é a semana que começou na segunda anterior", () => {
    // 2026-10-18 23:30 BRT = 2026-10-19 02:30 UTC
    expect(semanaDe(new Date("2026-10-19T02:30:00Z"))).toBe("2026-10-12");
  });

  it("segunda 00h30 BRT (03h30 UTC) abre semana nova", () => {
    expect(semanaDe(new Date("2026-10-19T03:30:00Z"))).toBe("2026-10-19");
  });

  it("published_at UTC de segunda 02h00 cai no domingo anterior em BRT", () => {
    expect(semanaDe("2026-10-19T02:00:00Z")).toBe("2026-10-12");
  });
});

describe("ultimasSemanas", () => {
  it("devolve n inícios em ordem crescente, terminando na semana atual", () => {
    expect(ultimasSemanas("2026-10-14", 3)).toEqual([
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
    ]);
  });
});
