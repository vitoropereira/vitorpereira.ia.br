import { describe, expect, it, vi } from "vitest";
import type { Fetch } from "../types";
import { criarAdapterYouTube } from "./adapter";
import channels from "./fixtures/channels.json";
import erro500 from "./fixtures/erro-500.json";
import playlistP1 from "./fixtures/playlistItems-p1.json";
import playlistP2 from "./fixtures/playlistItems-p2.json";
import erroMetrica from "./fixtures/report-400-metrica.json";
import baseVideo from "./fixtures/report-base-video.json";
import conta from "./fixtures/report-conta.json";
import impressoes from "./fixtures/report-impressoes.json";
import trafego from "./fixtures/report-trafego.json";
import videos from "./fixtures/videos.json";

type Resposta = { status: number; json: unknown };
type Rota = (url: URL) => Resposta | undefined;

const ok = (json: unknown): Resposta => ({ status: 200, json });

/** Rotas padrão do canal de teste; `extra` vem antes e sobrescreve. */
function criarFetch(...extra: Rota[]) {
  const padrao: Rota = (u) => {
    if (u.pathname.endsWith("/channels")) return ok(channels);
    if (u.pathname.endsWith("/playlistItems")) {
      return ok(u.searchParams.get("pageToken") ? playlistP2 : playlistP1);
    }
    if (u.pathname.endsWith("/videos")) return ok(videos);
    if (u.pathname.endsWith("/reports")) {
      const dims = u.searchParams.get("dimensions");
      const metrics = u.searchParams.get("metrics") ?? "";
      if (dims === "day,insightTrafficSourceType") return ok(trafego);
      if (metrics.startsWith("videoThumbnailImpressions")) {
        return ok(impressoes);
      }
      if (u.searchParams.get("filters")) return ok(baseVideo);
      return ok(conta);
    }
    return undefined;
  };
  return vi.fn<Fetch>(async (input) => {
    const u = new URL(input);
    for (const r of [...extra, padrao]) {
      const res = r(u);
      if (res) {
        return {
          ok: res.status >= 200 && res.status < 300,
          status: res.status,
          json: async () => res.json,
          text: async () => JSON.stringify(res.json),
        };
      }
    }
    throw new Error(`rota não mapeada no teste: ${input}`);
  });
}

const urls = (f: ReturnType<typeof criarFetch>) =>
  f.mock.calls.map(([u]) => new URL(u));

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

  it("monta a série com Analytics base, impressões e tráfego", async () => {
    const fetch = criarFetch();
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas, avisos } = await a.coletarPosts("2026-10-11");

    expect(avisos).toEqual([]);
    const d11 = metricas.find(
      (m) => m.external_id === "novoAAAAAA1" && m.dia === "2026-10-11",
    );
    expect(d11).toMatchObject({
      views: 40,
      watch_time_min: 80,
      avg_view_pct: 55.5,
      subs_gained: 1,
      impressions: 800,
      ctr: 5.0,
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

  it("impressão recusada não derruba a coleta", async () => {
    const fetch = criarFetch((u) =>
      u.searchParams.get("metrics")?.startsWith("videoThumbnailImpressions")
        ? { status: 400, json: erroMetrica }
        : undefined,
    );
    const a = criarAdapterYouTube({ fetch, accessToken: "tok", hoje: QUARTA });
    const { metricas, avisos } = await a.coletarPosts("2026-10-11");

    const d11 = metricas.find(
      (m) => m.external_id === "novoAAAAAA1" && m.dia === "2026-10-11",
    )!;
    expect(d11).toMatchObject({
      views: 40,
      watch_time_min: 80,
      avg_view_pct: 55.5,
      impressions: null,
      ctr: null,
    });
    expect(d11.extra.trafego).toEqual({ YT_SEARCH: 25, SHORTS: 15 });
    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toContain("videoThumbnailImpressions");

    // Depois da primeira recusa, não insiste nos outros vídeos.
    const tentativas = urls(fetch).filter((u) =>
      u.searchParams.get("metrics")?.startsWith("videoThumbnailImpressions"),
    );
    expect(tentativas).toHaveLength(1);
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
