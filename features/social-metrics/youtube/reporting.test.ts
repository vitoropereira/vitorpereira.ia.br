import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import type { Fetch } from "../types";
import erro403 from "./fixtures/reporting-403.json";
import jobCriado from "./fixtures/reporting-job-criado.json";
import jobs from "./fixtures/reporting-jobs.json";
import jobsVazio from "./fixtures/reporting-jobs-vazio.json";
import reports from "./fixtures/reporting-reports.json";
import { ErroApi } from "./http";
import {
  criarClienteReporting,
  NOME_JOB,
  parseAlcance,
  REPORTING_API,
  TIPO_ALCANCE,
} from "./reporting";

const csv = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "fixtures/reach-basic.csv"),
  "utf8",
);

type Resposta = { status: number; json?: unknown; text?: string };

function fakeFetch(rota: (url: URL, method: string) => Resposta | undefined) {
  return vi.fn<Fetch>(async (input, init) => {
    const res = rota(new URL(input), init?.method ?? "GET");
    if (!res) throw new Error(`rota não mapeada no teste: ${input}`);
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      json: async () => res.json,
      text: async () => res.text ?? JSON.stringify(res.json),
    };
  });
}

describe("garantirJob", () => {
  it("sem job do alcance, cria com POST e devolve o id", async () => {
    const fetch = fakeFetch((u, method) => {
      if (u.pathname === "/v1/jobs" && method === "GET") {
        return { status: 200, json: jobsVazio };
      }
      if (u.pathname === "/v1/jobs" && method === "POST") {
        return { status: 200, json: jobCriado };
      }
    });
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    expect(await c.garantirJob()).toEqual({ id: "job-novo", criado: true });

    const [url, init] = fetch.mock.calls[1];
    expect(url).toBe(`${REPORTING_API}/jobs`);
    expect(REPORTING_API).toBe("https://youtubereporting.googleapis.com/v1");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init!.body!)).toEqual({
      reportTypeId: TIPO_ALCANCE,
      name: NOME_JOB,
    });
    expect(TIPO_ALCANCE).toBe("channel_reach_basic_a1");
    expect(init?.headers?.authorization).toBe("Bearer tok");
  });

  it("com o job já listado, não cria outro", async () => {
    const fetch = fakeFetch((u, method) =>
      u.pathname === "/v1/jobs" && method === "GET"
        ? { status: 200, json: jobs }
        : undefined,
    );
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    expect(await c.garantirJob()).toEqual({ id: "job-alcance", criado: false });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1]?.headers?.authorization).toBe("Bearer tok");
  });

  it("procura o job em todas as páginas antes de criar", async () => {
    const fetch = fakeFetch((u) => {
      if (u.pathname !== "/v1/jobs") return undefined;
      return u.searchParams.get("pageToken") === "P2"
        ? { status: 200, json: jobs }
        : { status: 200, json: { jobs: [], nextPageToken: "P2" } };
    });
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    expect(await c.garantirJob()).toEqual({ id: "job-alcance", criado: false });
    expect(
      fetch.mock.calls.every(([, i]) => (i?.method ?? "GET") === "GET"),
    ).toBe(true);
  });

  it("erro da API vira ErroApi com status, sem token nem URL", async () => {
    const fetch = fakeFetch(() => ({ status: 403, json: erro403 }));
    const c = criarClienteReporting({ fetch, accessToken: "tok-secreto" });
    const erro = await c.garantirJob().catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect((erro as ErroApi).status).toBe(403);
    expect((erro as ErroApi).message).toContain(
      "The caller does not have permission",
    );
    expect((erro as ErroApi).message).not.toContain("tok-secreto");
    expect((erro as ErroApi).message).not.toContain("googleapis");
  });
});

describe("relatoriosDaJanela", () => {
  it("pede a partir de `desde`, pagina e fica com a versão mais nova de cada dia", async () => {
    const [a, b, c1012] = [
      reports.reports[0],
      reports.reports[2],
      reports.reports[1],
    ];
    const fetch = fakeFetch((u) => {
      if (u.pathname !== "/v1/jobs/job-alcance/reports") return undefined;
      return u.searchParams.get("pageToken") === "P2"
        ? { status: 200, json: { reports: [b] } }
        : { status: 200, json: { reports: [a, c1012], nextPageToken: "P2" } };
    });
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    const rels = await c.relatoriosDaJanela("job-alcance", "2026-10-11");

    // O backfill (r-1011-b) substitui o relatório antigo do mesmo dia.
    expect(rels.map((r) => r.id).sort()).toEqual(["r-1011-b", "r-1012"]);
    const primeira = new URL(fetch.mock.calls[0][0]);
    expect(primeira.searchParams.get("startTimeAtOrAfter")).toBe(
      "2026-10-11T00:00:00Z",
    );
  });

  it("descarta relatório que começa antes da janela", async () => {
    const antigo = {
      ...reports.reports[0],
      id: "r-1009",
      startTime: "2026-10-09T07:00:00Z",
    };
    const fetch = fakeFetch(() => ({
      status: 200,
      json: { reports: [antigo, reports.reports[1]] },
    }));
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    const rels = await c.relatoriosDaJanela("job-alcance", "2026-10-11");
    expect(rels.map((r) => r.id)).toEqual(["r-1012"]);
  });

  it("compara createTime e startTime por instante, não por string", async () => {
    // Mesmo dia com fração de segundo diferente: lexicalmente "…00Z" ganharia
    // de "…00.500Z", e o relatório velho seria o escolhido.
    const velho = {
      ...reports.reports[0],
      id: "velho",
      createTime: "2026-10-12T15:00:00Z",
    };
    const novo = {
      ...reports.reports[0],
      id: "novo",
      startTime: "2026-10-11T07:00:00.000Z",
      createTime: "2026-10-12T15:00:00.500Z",
    };
    const fetch = fakeFetch(() => ({
      status: 200,
      json: { reports: [novo, velho] },
    }));
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    const rels = await c.relatoriosDaJanela("job-alcance", "2026-10-11");
    expect(rels.map((r) => r.id)).toEqual(["novo"]);
  });

  it("job sem relatório devolve lista vazia", async () => {
    const fetch = fakeFetch(() => ({ status: 200, json: {} }));
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    expect(await c.relatoriosDaJanela("job-alcance", "2026-10-11")).toEqual([]);
  });
});

describe("baixar", () => {
  it("baixa o CSV do downloadUrl com o mesmo Bearer", async () => {
    const url = reports.reports[2].downloadUrl;
    const fetch = fakeFetch((u) =>
      u.toString() === url ? { status: 200, text: csv } : undefined,
    );
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    expect(await c.baixar(url)).toBe(csv);
    expect(fetch.mock.calls[0][1]?.headers?.authorization).toBe("Bearer tok");
  });

  it("download recusado vira ErroApi sem a URL", async () => {
    const fetch = fakeFetch(() => ({ status: 404, json: {} }));
    const c = criarClienteReporting({ fetch, accessToken: "tok" });
    const erro = await c
      .baixar(reports.reports[2].downloadUrl)
      .catch((e: unknown) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect((erro as ErroApi).status).toBe(404);
    expect((erro as ErroApi).message).not.toContain("r-1011-b");
  });
});

describe("parseAlcance", () => {
  const alcance = parseAlcance(csv);

  it("soma impressões do mesmo vídeo e dia e pondera o CTR, em %", () => {
    const d11 = alcance.get("novoAAAAAA1|2026-10-11")!;
    expect(d11.impressions).toBe(800);
    // (600 × 4% + 200 × 8%) / 800 = 5%
    expect(d11.ctr).toBeCloseTo(5.0, 10);
  });

  it("converte a data YYYYMMDD do CSV para YYYY-MM-DD", () => {
    expect(alcance.has("novoAAAAAA1|2026-10-10")).toBe(true);
    expect(alcance.has("velhoBBBBB2|2026-10-11")).toBe(true);
  });

  it("célula vazia vira null, nunca 0", () => {
    expect(alcance.get("novoAAAAAA1|2026-10-12")).toEqual({
      impressions: null,
      ctr: null,
    });
  });

  it("0 impressões é dado, mas o CTR fica null", () => {
    expect(alcance.get("novoAAAAAA1|2026-10-13")).toEqual({
      impressions: 0,
      ctr: null,
    });
  });

  it("linha sem video_id é ignorada", () => {
    expect([...alcance.keys()].some((k) => k.startsWith("|"))).toBe(false);
  });

  it("acha as colunas pelo header, não pela posição", () => {
    const m = parseAlcance(
      [
        "video_thumbnail_impressions_ctr,video_id,extra_nova,date,video_thumbnail_impressions",
        "0.1,v1,x,2026-10-11,10",
        "abc,v2,x,20261011,5",
      ].join("\r\n"),
    );
    expect(m.get("v1|2026-10-11")?.impressions).toBe(10);
    expect(m.get("v1|2026-10-11")?.ctr).toBeCloseTo(10, 10);
    expect(m.get("v2|2026-10-11")).toEqual({ impressions: 5, ctr: null });
  });

  it("CSV só com header (dia sem dado) dá mapa vazio", () => {
    expect(parseAlcance(csv.split("\n")[0] + "\n").size).toBe(0);
    expect(parseAlcance("").size).toBe(0);
  });
});
