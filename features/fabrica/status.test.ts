import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { carregarStatus } from "./status";

const fetchMock = vi.fn();
const agora = new Date("2026-11-11T12:00:00Z");

const resposta = (corpo: unknown, ok = true) => ({
  ok,
  json: async () => corpo,
});

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("FACTORY_GITHUB_TOKEN", "tok");
  vi.stubEnv("FACTORY_STATUS_REPO", "");
  vi.stubEnv("FACTORY_STATUS_BRANCH", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe("carregarStatus", () => {
  it("sem token não chama o fetch", async () => {
    vi.stubEnv("FACTORY_GITHUB_TOKEN", "");
    expect(await carregarStatus(agora)).toEqual({ erro: "sem-token" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["404", () => fetchMock.mockResolvedValue(resposta({}, false))],
    [
      "rede",
      () => fetchMock.mockRejectedValue(new Error("ECONNRESET api.github.com")),
    ],
  ])("falha (%s) vira indisponivel sem a mensagem crua", async (_, prep) => {
    prep();
    const r = await carregarStatus(agora);
    expect(r).toEqual({ erro: "indisponivel" });
    expect(JSON.stringify(r)).not.toContain("github");
  });

  it("JSON válido vira dados tipados, com idade e velho", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        gerado_em: "2026-11-11T11:00:00Z",
        estacoes: [],
        repos: { "a/b": { itens: [{ titulo: "A", estacao: "provar" }] } },
        aguardando_dono: [],
        eventos: [{ em: "x", texto: "y" }],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.itens[0]).toMatchObject({
      titulo: "A",
      repo: "a/b",
      estacao: "provar",
    });
    expect(r.status.estacoes).toHaveLength(10);
    expect(r.minutosDesde).toBe(60);
    expect(r.velho).toBe(true);
  });

  it("status recente não é velho", async () => {
    fetchMock.mockResolvedValue(
      resposta({ gerado_em: "2026-11-11T11:50:00Z", estacoes: [] }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.velho).toBe(false);
  });

  it("usa estacoes[] do arquivo, na ordem", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [{ id: "z", nome: "Zê" }, "a"],
        repos: [{ repo: "r/s", itens: [{ titulo: "T", estacao: "z" }] }],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.estacoes).toEqual([
      { id: "z", nome: "Zê" },
      { id: "a", nome: "a" },
    ]);
    expect(r.status.itens[0].repo).toBe("r/s");
  });

  it("JSON sem estacoes é indisponivel", async () => {
    fetchMock.mockResolvedValue(resposta({ itens: [] }));
    expect(await carregarStatus(agora)).toEqual({ erro: "indisponivel" });
  });

  it("usa URL e headers corretos, com repo/branch padrão e por env", async () => {
    fetchMock.mockResolvedValue(resposta({ estacoes: [] }));
    await carregarStatus(agora);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://api.github.com/repos/vitoropereira/dev-flow/contents/status.json?ref=fabrica-status",
    );
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(init.headers.Accept).toBe("application/vnd.github.raw+json");
    expect(init.cache).toBe("no-store");
    expect(init.headers["X-GitHub-Api-Version"]).toBe("2022-11-28");

    vi.stubEnv("FACTORY_STATUS_REPO", "o/r");
    vi.stubEnv("FACTORY_STATUS_BRANCH", "dev");
    await carregarStatus(agora);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://api.github.com/repos/o/r/contents/status.json?ref=dev",
    );
  });
  it("campos v2: historico de 7 dias, resumo do repo, gargalo e tempo médio", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [],
        repos: [
          {
            alias: "vp",
            repo: "o/site",
            resumo: {
              ativos: 3,
              entregues: 5,
              voltas: 1,
              ultimo_deploy: "2026-11-11T14:22:00Z",
              saude: "ok",
              lixo: "x",
            },
            itens: [{ titulo: "A", estacao: "provar" }],
          },
        ],
        historico: {
          merge: [1, 2, 3, 4, 5, 6, 7],
          volta: [1, "x", -2],
          longo: [9, 9, 1, 2, 3, 4, 5, 6, 7],
        },
        gargalo: { estacao: "porteiro", qtd: 4 },
        tempo_medio_horas: 33,
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.historico.merge).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(r.status.historico.volta).toEqual([0, 0, 0, 0, 1, 0, 0]);
    expect(r.status.historico.longo).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(r.status.repos[0]).toMatchObject({
      alias: "vp",
      repo: "o/site",
      resumo: {
        ativos: 3,
        entregues: 5,
        voltas: 1,
        ultimoDeploy: "2026-11-11T14:22:00Z",
        saude: "ok",
      },
    });
    expect(r.status.repos[0].resumo).not.toHaveProperty("lixo");
    expect(r.status.itens).toHaveLength(1);
    expect(r.status.gargalo).toEqual({ estacao: "porteiro", qtd: 4 });
    expect(r.status.tempoMedioHoras).toBe(33);
  });

  it("status v1 (sem campos v2) usa os padrões", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [],
        repos: [{ repo: "o/site", itens: [{ titulo: "A", estacao: "x" }] }],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.historico).toEqual({});
    expect(r.status.gargalo).toBeNull();
    expect(r.status.tempoMedioHoras).toBeNull();
    expect(r.status.repos[0].resumo).toEqual({
      ativos: 0,
      entregues: 0,
      voltas: 0,
      ultimoDeploy: null,
      saude: "",
    });
  });
});
