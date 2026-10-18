import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { Fetch } from "../types";
import { criarAdapterYouTube } from "./adapter";
import channels from "./fixtures/channels.json";
import erro500 from "./fixtures/erro-500.json";
import playlistP1 from "./fixtures/playlistItems-p1.json";
import playlistP2 from "./fixtures/playlistItems-p2.json";
import baseVideo from "./fixtures/report-base-video.json";
import conta from "./fixtures/report-conta.json";
import trafego from "./fixtures/report-trafego.json";
import erro403 from "./fixtures/reporting-403.json";
import jobCriado from "./fixtures/reporting-job-criado.json";
import jobs from "./fixtures/reporting-jobs.json";
import jobsVazio from "./fixtures/reporting-jobs-vazio.json";
import reports from "./fixtures/reporting-reports.json";
import videos from "./fixtures/videos.json";

const reachCsv = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "fixtures/reach-basic.csv"),
  "utf8",
);
// Versão antiga do dia 11, substituída pelo backfill r-1011-b.
const reachCsvAntigo = [
  "date,channel_id,video_id,video_thumbnail_impressions,video_thumbnail_impressions_ctr",
  "20261011,UCcanalDeTesteXXXXXXXXXX,novoAAAAAA1,1,1",
].join("\n");
const soHeader = reachCsvAntigo.split("\n")[0] + "\n";

type Resposta = { status: number; json?: unknown; text?: string };
type Rota = (url: URL, method: string) => Resposta | undefined;

const ok = (json: unknown): Resposta => ({ status: 200, json });
const ehReporting = (u: URL) =>
  u.hostname === "youtubereporting.googleapis.com";

/** Rotas padrão do canal de teste; `extra` vem antes e sobrescreve. */
function criarFetch(...extra: Rota[]) {
  const padrao: Rota = (u, method) => {
    if (ehReporting(u)) {
      if (u.pathname === "/v1/jobs") {
        return method === "POST" ? ok(jobCriado) : ok(jobs);
      }
      if (u.pathname === "/v1/jobs/job-alcance/reports") return ok(reports);
      if (u.pathname.endsWith("/r-1011-a")) {
        return { status: 200, text: reachCsvAntigo };
      }
      if (u.pathname.endsWith("/r-1011-b")) {
        return { status: 200, text: reachCsv };
      }
      if (u.pathname.endsWith("/r-1012"))
        return { status: 200, text: soHeader };
      return undefined;
    }
    if (u.pathname.endsWith("/channels")) return ok(channels);
    if (u.pathname.endsWith("/playlistItems")) {
      return ok(u.searchParams.get("pageToken") ? playlistP2 : playlistP1);
    }
    if (u.pathname.endsWith("/videos")) return ok(videos);
    if (u.pathname.endsWith("/reports")) {
      const dims = u.searchParams.get("dimensions");
      if (dims === "day,insightTrafficSourceType") return ok(trafego);
      if (u.searchParams.get("filters")) return ok(baseVideo);
      return ok(conta);
    }
    return undefined;
  };
  return vi.fn<Fetch>(async (input, init) => {
    const u = new URL(input);
    const method = init?.method ?? "GET";
    for (const r of [...extra, padrao]) {
      const res = r(u, method);
      if (res) {
        return {
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          json: async () => res.json,
          text: async () => res.text ?? JSON.stringify(res.json),
        };
      }
    }
    throw new Error(`rota não mapeada no teste: ${input}`);
  });
}

const urls = (f: ReturnType<typeof criarFetch>) =>
  f.mock.calls.map(([u]) => new URL(u));

const doNovo = <T extends { external_id: string; dia: string }>(
  metricas: T[],
  dia: string,
) => metricas.find((m) => m.external_id === "novoAAAAAA1" && m.dia === dia);

// 2026-10-14 é quarta; 2026-10-12 é segunda.
const QUARTA = "2026-10-14";
const SEGUNDA = "2026-10-12";

describe("coletarPosts", () => {
  it("encadeia canal, uploads paginados e videos.list", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { posts } = await a.coletarPosts("2026-10-11");

    expect(posts.map((p) => p.external_id)).toEqual([
      "novoAAAAAA1",
      "velhoBBBBB2",
    ]);
    expect(posts[0]).toMatchObject({
      url: "https://www.youtube.com/watch?v=novoAAAAAA1",
      tipo: "short",
    });
    expect(posts[1].tipo).toBe("longo");

    const chamadas = urls(fetch);
    const playlist = chamadas.filter((u) =>
      u.pathname.endsWith("/playlistItems"),
    );
    expect(playlist).toHaveLength(2);
    expect(playlist[0].searchParams.get("playlistId")).toBe(
      "UUcanalDeTesteXXXXXXXXXX",
    );
    expect(playlist[1].searchParams.get("pageToken")).toBe("PAGINA2");
    const vids = chamadas.find((u) => u.pathname.endsWith("/videos"))!;
    expect(vids.searchParams.get("id")).toBe("novoAAAAAA1,velhoBBBBB2");
    expect(vids.searchParams.get("part")).toBe(
      "snippet,statistics,contentDetails",
    );

    // O token vai no header, nunca na URL.
    expect(chamadas.every((u) => !u.search.includes("tok"))).toBe(true);
    expect(fetch.mock.calls[0][1]?.headers?.authorization).toBe("Bearer tok");
  });

  it("monta a série com Analytics base, alcance da Reporting e tráfego", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas, avisos } = await a.coletarPosts("2026-10-11");

    expect(avisos).toEqual([]);
    const d11 = doNovo(metricas, "2026-10-11");
    expect(d11).toMatchObject({
      views: 40,
      watch_time_min: 80,
      avg_view_pct: 55.5,
      subs_gained: 1,
      impressions: 800,
      ctr: expect.closeTo(5.0, 10),
      likes: null,
      comments: null,
      extra: { trafego: { YT_SEARCH: 25, SHORTS: 15 } },
    });

    // Uma consulta base por vídeo da série, cobrindo a janela reprocessada.
    const base = urls(fetch).filter((u) =>
      u.searchParams.get("metrics")?.startsWith("views,"),
    );
    expect(base.map((u) => u.searchParams.get("filters"))).toEqual([
      "video==novoAAAAAA1",
    ]);
    expect(base[0].searchParams.get("dimensions")).toBe("day");
    expect(base[0].searchParams.get("startDate")).toBe("2026-10-11");
    expect(base[0].searchParams.get("endDate")).toBe(QUARTA);
  });

  it("likes e comments acumulados entram só na linha de hoje", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas } = await a.coletarPosts("2026-10-11");

    const hoje = metricas.find(
      (m) => m.external_id === "novoAAAAAA1" && m.dia === QUARTA,
    );
    expect(hoje).toMatchObject({
      likes: 5,
      comments: 0,
      views: null,
      extra: { views_total: 300 },
    });
  });

  it("o Analytics v2 não recebe mais métrica de impressão", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    await a.coletarPosts("2026-10-11");

    const analytics = urls(fetch).filter(
      (u) => u.hostname === "youtubeanalytics.googleapis.com",
    );
    expect(analytics.length).toBeGreaterThan(0);
    expect(
      analytics.some((u) =>
        u.searchParams.get("metrics")?.includes("videoThumbnailImpressions"),
      ),
    ).toBe(false);
  });

  it("baixa só a versão mais nova de cada relatório da janela", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    await a.coletarPosts("2026-10-11");

    const reporting = urls(fetch).filter(ehReporting);
    expect(reporting.map((u) => u.pathname)).toEqual([
      "/v1/jobs",
      "/v1/jobs/job-alcance/reports",
      "/v1/media/CHANNEL/r-1011-b",
      "/v1/media/CHANNEL/r-1012",
    ]);
    expect(reporting[1].searchParams.get("startTimeAtOrAfter")).toBe(
      "2026-10-11T00:00:00Z",
    );
    // Job já existia: nenhum POST.
    expect(fetch.mock.calls.some(([, i]) => i?.method === "POST")).toBe(false);
  });

  it("alcance só preenche linha que a consulta base montou", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas } = await a.coletarPosts("2026-10-11");

    // O CSV traz o dia 10 (fora da janela), o 13 (sem linha na base) e o
    // vídeo velho (fora da série). Nenhum vira linha: o gravador sobrescreveria
    // views e watch_time com null.
    expect(doNovo(metricas, "2026-10-10")).toBeUndefined();
    expect(doNovo(metricas, "2026-10-13")).toBeUndefined();
    expect(metricas.some((m) => m.external_id === "velhoBBBBB2")).toBe(false);
    // Célula vazia no CSV continua null, nunca 0.
    expect(doNovo(metricas, "2026-10-12")).toMatchObject({
      views: 30,
      impressions: null,
      ctr: null,
    });
    // Vídeo sem linha no CSV naquele dia fica null.
    expect(doNovo(metricas, QUARTA)).toMatchObject({
      impressions: null,
      ctr: null,
    });
  });

  it("job novo: cria, avisa e deixa impressões null", async () => {
    const fetch = criarFetch((u, method) =>
      ehReporting(u) && u.pathname === "/v1/jobs" && method === "GET"
        ? ok(jobsVazio)
        : undefined,
    );
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas, avisos } = await a.coletarPosts("2026-10-11");

    const post = fetch.mock.calls.find(([, i]) => i?.method === "POST")!;
    expect(new URL(post[0]).pathname).toBe("/v1/jobs");
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatch(/job-novo.*48h/);
    expect(
      metricas.every((m) => m.impressions === null && m.ctr === null),
    ).toBe(true);
    expect(doNovo(metricas, "2026-10-11")).toMatchObject({ views: 40 });
    expect(
      urls(fetch).some(
        (u) => ehReporting(u) && u.pathname.endsWith("/reports"),
      ),
    ).toBe(false);
  });

  it("job sem relatório ainda: avisa e segue com null", async () => {
    const fetch = criarFetch((u) =>
      ehReporting(u) && u.pathname.endsWith("/reports") ? ok({}) : undefined,
    );
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas, avisos } = await a.coletarPosts("2026-10-11");

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain("sem relatório");
    expect(doNovo(metricas, "2026-10-11")).toMatchObject({
      views: 40,
      impressions: null,
      ctr: null,
    });
  });

  it.each([
    ["listar jobs", (u: URL) => u.pathname === "/v1/jobs", 403],
    ["listar relatórios", (u: URL) => u.pathname.endsWith("/reports"), 400],
    ["baixar", (u: URL) => u.pathname.startsWith("/v1/media/"), 404],
  ])("Reporting recusando %s não derruba a coleta", async (_, alvo, status) => {
    const fetch = criarFetch((u) =>
      ehReporting(u) && alvo(u) ? { status, json: erro403 } : undefined,
    );
    const a = criarAdapterYouTube({
      fetch,
      accessToken: "tok-secreto",
      hoje: QUARTA,
    });
    const { metricas, avisos } = await a.coletarPosts("2026-10-11");

    const d11 = doNovo(metricas, "2026-10-11")!;
    expect(d11).toMatchObject({
      views: 40,
      watch_time_min: 80,
      avg_view_pct: 55.5,
      impressions: null,
      ctr: null,
    });
    expect(d11.extra.trafego).toEqual({ YT_SEARCH: 25, SHORTS: 15 });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain(`HTTP ${status}`);
    expect(avisos[0]).not.toContain("tok-secreto");
    expect(avisos[0]).not.toContain("googleapis");
  });

  it("erro que não é da API na Reporting propaga", async () => {
    const fetch = criarFetch((u) => {
      if (ehReporting(u)) throw new TypeError("fetch failed");
      return undefined;
    });
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    await expect(a.coletarPosts("2026-10-11")).rejects.toThrow("fetch failed");
  });

  it("vídeo com mais de 90 dias fica fora da série fora da segunda", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { posts, metricas } = await a.coletarPosts("2026-10-11");

    // O post continua cadastrado; só a série é pulada.
    expect(posts.some((p) => p.external_id === "velhoBBBBB2")).toBe(true);
    expect(metricas.some((m) => m.external_id === "velhoBBBBB2")).toBe(false);
    const filtros = urls(fetch).map((u) => u.searchParams.get("filters"));
    expect(filtros).not.toContain("video==velhoBBBBB2");
  });

  it("na segunda o vídeo com mais de 90 dias entra na série", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({
      fetch,
      accessToken: "tok",
      hoje: SEGUNDA,
    });
    const { metricas } = await a.coletarPosts("2026-10-09");

    const velho = metricas.filter((m) => m.external_id === "velhoBBBBB2");
    expect(velho.find((m) => m.dia === SEGUNDA)).toMatchObject({
      views: 30,
      // likeCount oculto no statistics → null, não 0.
      likes: null,
      comments: 12,
    });
  });

  it("backfill parte da publicação e quebra o Analytics em janelas de um ano", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    await a.coletarPosts("2005-04-23", "backfill");

    const base = urls(fetch).filter(
      (u) =>
        u.searchParams.get("metrics")?.startsWith("views,") &&
        u.searchParams.get("filters") === "video==velhoBBBBB2",
    );
    expect(
      base.map((u) => [
        u.searchParams.get("startDate"),
        u.searchParams.get("endDate"),
      ]),
    ).toEqual([["2026-01-10", QUARTA]]);
  });

  it("erro 500 propaga com status e mensagem do Google", async () => {
    const fetch = criarFetch((u) =>
      u.pathname.endsWith("/videos")
        ? { status: 500, json: erro500 }
        : undefined,
    );
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    await expect(a.coletarPosts("2026-10-11")).rejects.toThrow(
      /HTTP 500: Internal error encountered/,
    );
  });
});

describe("coletarConta", () => {
  it("seguidores só no dia corrente e views_dia por dia", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { contas } = await a.coletarConta(QUARTA);

    expect(contas.map((c) => c.dia)).toEqual([
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      QUARTA,
    ]);
    expect(contas.map((c) => c.seguidores)).toEqual([null, null, null, 321]);
    // 0 é dado; dia sem linha no relatório é ausência.
    expect(contas.map((c) => c.views_dia)).toEqual([120, 90, 0, null]);
    expect(contas[1].extra).toEqual({ subs_gained: 1, subs_lost: 1 });

    const rel = urls(fetch).find((u) => u.pathname.endsWith("/reports"))!;
    expect(rel.searchParams.get("dimensions")).toBe("day");
    expect(rel.searchParams.get("filters")).toBeNull();
  });

  it("hiddenSubscriberCount ligado deixa seguidores null", async () => {
    const oculto = structuredClone(channels);
    oculto.items[0].statistics.hiddenSubscriberCount = true;
    const fetch = criarFetch((u) =>
      u.pathname.endsWith("/channels") ? ok(oculto) : undefined,
    );
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { contas } = await a.coletarConta(QUARTA);
    expect(contas.every((c) => c.seguidores === null)).toBe(true);
  });
});
