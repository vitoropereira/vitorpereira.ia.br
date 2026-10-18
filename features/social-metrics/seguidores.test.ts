import { describe, expect, it } from "vitest";
import { reconstruirSeguidores, type LinhaSeguidores } from "./seguidores";

const l = (
  dia: string,
  subs_gained: number | null,
  subs_lost: number | null,
  seguidores: number | null = null,
): LinhaSeguidores => ({ dia, seguidores, subs_gained, subs_lost });

describe("reconstruirSeguidores", () => {
  it("parte da âncora no último dia com Analytics e desconta o saldo para trás", () => {
    // Âncora real em 14 (atraso de 3 dias do Analytics: último dado no 11).
    const calc = reconstruirSeguidores([
      l("2026-10-08", 1, 0),
      l("2026-10-09", 5, 2),
      l("2026-10-10", 0, 1),
      l("2026-10-11", 3, 0),
      l("2026-10-14", null, null, 100),
    ]);

    expect([...calc.entries()]).toEqual([
      ["2026-10-11", 100],
      // fim do 10 = fim do 11 − (3 − 0)
      ["2026-10-10", 97],
      // fim do 9 = 97 − (0 − 1)
      ["2026-10-09", 98],
      // fim do 8 = 98 − (5 − 2)
      ["2026-10-08", 95],
    ]);
    // De ponta a ponta: âncora − saldo de 9 a 11.
    expect(calc.get("2026-10-08")).toBe(100 - (5 - 2) - (0 - 1) - (3 - 0));
  });

  it("dias depois do último Analytics não recebem número", () => {
    const calc = reconstruirSeguidores([
      l("2026-10-10", 1, 0),
      l("2026-10-11", 1, 0),
      l("2026-10-12", null, null),
      l("2026-10-14", null, null, 50),
    ]);
    expect(calc.has("2026-10-12")).toBe(false);
    expect(calc.has("2026-10-13")).toBe(false);
    expect(calc.has("2026-10-14")).toBe(false);
    expect(calc.get("2026-10-11")).toBe(50);
  });

  it("lacuna de Analytics interrompe a série em vez de pulá-la", () => {
    const calc = reconstruirSeguidores([
      l("2026-10-05", 4, 0),
      l("2026-10-06", 4, 0),
      // 07 sem linha nenhuma; 08 com linha mas sem ganhos/perdas.
      l("2026-10-08", null, 3),
      l("2026-10-09", 2, 0),
      l("2026-10-10", 1, 1),
      l("2026-10-11", null, null, 10),
    ]);
    expect([...calc.keys()]).toEqual(["2026-10-10", "2026-10-09"]);
    expect(calc.has("2026-10-08")).toBe(false);
    expect(calc.has("2026-10-06")).toBe(false);
    expect(calc.has("2026-10-05")).toBe(false);
  });

  it("sem seguidores real nenhum, o mapa sai vazio", () => {
    expect(
      reconstruirSeguidores([l("2026-10-10", 1, 0), l("2026-10-11", 1, 0)])
        .size,
    ).toBe(0);
  });

  it("sem Analytics nenhum, o mapa sai vazio", () => {
    expect(
      reconstruirSeguidores([
        l("2026-10-10", null, null),
        l("2026-10-11", null, null, 30),
      ]).size,
    ).toBe(0);
    expect(reconstruirSeguidores([]).size).toBe(0);
  });

  it("âncora mais antiga que o último Analytics soma o saldo para frente", () => {
    // Contagem ficou oculta depois do 09: a última real é a do 09.
    const calc = reconstruirSeguidores([
      l("2026-10-08", 1, 0),
      l("2026-10-09", 2, 0, 40),
      l("2026-10-10", 3, 1),
      l("2026-10-11", 5, 0),
    ]);
    // fim do 11 = 40 + (3 − 1) + (5 − 0)
    expect(calc.get("2026-10-11")).toBe(47);
    expect(calc.get("2026-10-10")).toBe(42);
    expect(calc.get("2026-10-09")).toBe(40);
    expect(calc.get("2026-10-08")).toBe(38);
  });

  it("lacuna entre âncora antiga e o último Analytics não vira saldo zero", () => {
    const calc = reconstruirSeguidores([
      l("2026-10-08", 1, 0),
      l("2026-10-09", 2, 0, 40),
      // 10 sem ganhos/perdas: o saldo dele é desconhecido.
      l("2026-10-10", null, null),
      l("2026-10-11", 5, 0),
    ]);
    expect(calc.size).toBe(0);
  });

  it("usa a âncora mais recente e aceita linhas fora de ordem", () => {
    const calc = reconstruirSeguidores([
      l("2026-10-11", 1, 0, 20),
      l("2026-10-10", 1, 0, 999),
      l("2026-10-09", 1, 0),
    ]);
    expect(calc.get("2026-10-11")).toBe(20);
    expect(calc.get("2026-10-10")).toBe(19);
    expect(calc.get("2026-10-09")).toBe(18);
  });
});
