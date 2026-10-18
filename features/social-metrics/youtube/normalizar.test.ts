import { describe, expect, it } from "vitest";
import {
  aplicarLinhaAnalytics,
  linhasPorNome,
  metricaVazia,
  numOuNull,
  parseDuracaoISO8601,
  postDoVideo,
  tipoPorDuracao,
} from "./normalizar";

describe("parseDuracaoISO8601", () => {
  it("parseia os formatos que a Data API devolve", () => {
    expect(parseDuracaoISO8601("PT3M")).toBe(180);
    expect(parseDuracaoISO8601("PT3M1S")).toBe(181);
    expect(parseDuracaoISO8601("P0D")).toBe(0);
    expect(parseDuracaoISO8601("PT1H2M3S")).toBe(3723);
    expect(parseDuracaoISO8601("P1DT1S")).toBe(86_401);
  });

  it("formato inválido vira null", () => {
    expect(parseDuracaoISO8601("3 minutos")).toBeNull();
  });
});

describe("tipoPorDuracao", () => {
  it("180 s é short e 181 s é longo", () => {
    expect(tipoPorDuracao(180)).toBe("short");
    expect(tipoPorDuracao(181)).toBe("longo");
  });

  it("sem duração não chuta tipo", () => {
    expect(tipoPorDuracao(null)).toBeNull();
  });
});

describe("numOuNull", () => {
  it('ausente vira null e "0" vira 0', () => {
    expect(numOuNull(undefined)).toBeNull();
    expect(numOuNull(null)).toBeNull();
    expect(numOuNull("0")).toBe(0);
    expect(numOuNull("42")).toBe(42);
    expect(numOuNull(3.5)).toBe(3.5);
    expect(numOuNull("abc")).toBeNull();
  });
});

describe("postDoVideo", () => {
  it("monta url, tipo e campos do snippet", () => {
    expect(
      postDoVideo({
        id: "abcdefghijk",
        snippet: { title: "Oi", publishedAt: "2026-10-01T12:00:00Z" },
        contentDetails: { duration: "PT3M1S" },
      }),
    ).toEqual({
      rede: "youtube",
      external_id: "abcdefghijk",
      url: "https://www.youtube.com/watch?v=abcdefghijk",
      published_at: "2026-10-01T12:00:00Z",
      titulo: "Oi",
      tipo: "longo",
    });
  });
});

describe("linhasPorNome", () => {
  it("mapeia pela columnHeaders, não pela posição", () => {
    const linhas = linhasPorNome({
      columnHeaders: [{ name: "views" }, { name: "day" }],
      rows: [[10, "2026-10-13"]],
    });
    expect(linhas).toEqual([{ views: 10, day: "2026-10-13" }]);
  });

  it("relatório sem rows vira lista vazia", () => {
    expect(linhasPorNome({ columnHeaders: [{ name: "day" }] })).toEqual([]);
  });
});

describe("aplicarLinhaAnalytics", () => {
  it("leva cada métrica para a coluna da tabela", () => {
    const m = aplicarLinhaAnalytics(metricaVazia("v1", "2026-10-13"), {
      day: "2026-10-13",
      views: 100,
      estimatedMinutesWatched: 250,
      averageViewPercentage: 41.5,
      subscribersGained: 3,
    });
    expect(m).toMatchObject({
      views: 100,
      watch_time_min: 250,
      avg_view_pct: 41.5,
      subs_gained: 3,
    });
  });

  it("sem coluna de impressão, impressions e ctr ficam null", () => {
    const m = aplicarLinhaAnalytics(metricaVazia("v1", "2026-10-13"), {
      views: 0,
    });
    expect(m.views).toBe(0);
    expect(m.impressions).toBeNull();
    expect(m.ctr).toBeNull();
  });

  it("não apaga o que outra consulta já preencheu", () => {
    const base = aplicarLinhaAnalytics(metricaVazia("v1", "2026-10-13"), {
      views: 7,
    });
    const depois = aplicarLinhaAnalytics(
      { ...base, impressions: 900, ctr: 4.2 },
      { subscribersGained: 2 },
    );
    expect(depois).toMatchObject({
      views: 7,
      subs_gained: 2,
      impressions: 900,
      ctr: 4.2,
    });
  });

  it("coluna de impressão do v2 é ignorada", () => {
    const m = aplicarLinhaAnalytics(metricaVazia("v1", "2026-10-13"), {
      videoThumbnailImpressions: 900,
      videoThumbnailImpressionsClickRate: 4.2,
    });
    expect(m.impressions).toBeNull();
    expect(m.ctr).toBeNull();
  });
});
