import { describe, expect, it } from "vitest";
import { curvaPorIdade, diaZero, viewsNoDia } from "./idade";

// `views` em vitor_social_post_metrics é a view DO DIA (Analytics com
// `dimensions: day`): D+N é a soma de D0 até D+N, não o valor de uma linha.

describe("diaZero", () => {
  it("post às 23h30 de Brasília conta no dia de Brasília, não no UTC", () => {
    // 2026-10-10T02:30Z = 2026-10-09 23h30 em São Paulo.
    expect(diaZero("2026-10-10T02:30:00Z")).toBe("2026-10-09");
  });

  it("sem published_at não há dia zero", () => {
    expect(diaZero(null)).toBeNull();
  });
});

describe("viewsNoDia", () => {
  const serie5dias = [
    { dia: "2026-10-09", views: 100 },
    { dia: "2026-10-10", views: 50 },
    { dia: "2026-10-11", views: 20 },
    { dia: "2026-10-12", views: 10 },
    { dia: "2026-10-13", views: 5 },
    { dia: "2026-10-14", views: 1 },
  ];

  it("post de 5 dias: D+1 numérico, D+7 e D+30 vazios", () => {
    const pub = "2026-10-09T15:00:00Z";
    const hoje = "2026-10-14";
    expect(viewsNoDia(pub, serie5dias, 1, hoje)).toBe(150);
    expect(viewsNoDia(pub, serie5dias, 5, hoje)).toBe(186);
    expect(viewsNoDia(pub, serie5dias, 7, hoje)).toBeNull();
    expect(viewsNoDia(pub, serie5dias, 30, hoje)).toBeNull();
  });

  it("dia faltando vale o acumulado da última linha anterior", () => {
    const serie = [
      { dia: "2026-10-01", views: 100 },
      { dia: "2026-10-02", views: 40 },
      // 03 e 04 faltam
      { dia: "2026-10-05", views: 10 },
    ];
    const pub = "2026-10-01T12:00:00Z";
    expect(viewsNoDia(pub, serie, 3, "2026-10-14")).toBe(140);
    expect(viewsNoDia(pub, serie, 4, "2026-10-14")).toBe(150);
  });

  it("view null no dia não vira zero, mas não apaga o acumulado", () => {
    const serie = [
      { dia: "2026-10-01", views: 100 },
      { dia: "2026-10-02", views: null },
    ];
    expect(viewsNoDia("2026-10-01T12:00:00Z", serie, 1, "2026-10-14")).toBe(
      100,
    );
  });

  it("virada às 23h30 de Brasília: a linha do dia 9 é o D0", () => {
    const serie = [
      { dia: "2026-10-09", views: 7 },
      { dia: "2026-10-10", views: 3 },
    ];
    const pub = "2026-10-10T02:30:00Z";
    expect(viewsNoDia(pub, serie, 0, "2026-10-14")).toBe(7);
    expect(viewsNoDia(pub, serie, 1, "2026-10-14")).toBe(10);
    // Hoje = 10 em Brasília: o post tem 1 dia de idade, D+2 ainda não chegou.
    expect(viewsNoDia(pub, serie, 2, "2026-10-10")).toBeNull();
  });

  it("série vazia com os N dias cumpridos dá null, nunca 0 inventado", () => {
    expect(viewsNoDia("2026-09-01T12:00:00Z", [], 7, "2026-10-14")).toBeNull();
  });

  it("linha antes do D0 não entra na soma", () => {
    const serie = [
      { dia: "2026-09-30", views: 999 },
      { dia: "2026-10-01", views: 1 },
    ];
    expect(viewsNoDia("2026-10-01T12:00:00Z", serie, 1, "2026-10-14")).toBe(1);
  });
});

describe("curvaPorIdade", () => {
  it("vai só até a idade atual, acumulando", () => {
    const serie = [
      { dia: "2026-10-12", views: 10 },
      { dia: "2026-10-14", views: 5 },
    ];
    expect(curvaPorIdade(serie, "2026-10-12", "2026-10-14")).toEqual([
      { idade: 0, views: 10 },
      { idade: 1, views: 10 },
      { idade: 2, views: 15 },
    ]);
  });

  it("antes da primeira linha a curva fica null", () => {
    const serie = [{ dia: "2026-10-13", views: 4 }];
    expect(curvaPorIdade(serie, "2026-10-12", "2026-10-13")).toEqual([
      { idade: 0, views: null },
      { idade: 1, views: 4 },
    ]);
  });

  it("dia zero no futuro devolve curva vazia", () => {
    expect(curvaPorIdade([], "2026-10-20", "2026-10-14")).toEqual([]);
  });
});
