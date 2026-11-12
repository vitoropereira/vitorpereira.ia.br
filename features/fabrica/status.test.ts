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
  it("campos v2 (JSON de exemplo da issue #105): historico, resumo, gargalo e tempo médio", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [],
        versao: 2,
        historico: {
          porteiro: [0, 0, 0, 0, 0, 6, 1],
          chamou: [0, 0, 0, 0, 0, 5, 0],
          volta: [0, 0, 0, 0, 0, 2, 0],
          "no-ar": [0, 0, 0, 0, 0, 0, 1],
        },
        gargalo: { estacao: "porteiro", qtd: 1 },
        tempo_medio_horas: 33.5,
        repos: [
          {
            alias: "vp",
            repo: "vitoropereira/vitorpereira.ia.br",
            itens: [],
            resumo: {
              ativos: 1,
              entregues: 1,
              voltas: 2,
              ultimo_deploy: "2026-11-12T14:07:28Z",
              saude: "atencao",
            },
          },
        ],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.historico).toEqual({
      porteiro: [0, 0, 0, 0, 0, 6, 1],
      chamou: [0, 0, 0, 0, 0, 5, 0],
      volta: [0, 0, 0, 0, 0, 2, 0],
      "no-ar": [0, 0, 0, 0, 0, 0, 1],
    });
    expect(r.status.repos[0]).toEqual({
      alias: "vp",
      repo: "vitoropereira/vitorpereira.ia.br",
      itens: [],
      resumo: {
        ativos: 1,
        entregues: 1,
        voltas: 2,
        ultimoDeploy: "2026-11-12T14:07:28Z",
        saude: "atencao",
      },
    });
    expect(r.status.gargalo).toEqual({ estacao: "porteiro", qtd: 1 });
    expect(r.status.tempoMedioHoras).toBe(33.5);
  });

  it("historico sujo vira 7 números ≥ 0 e resumo ignora chave estranha", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [],
        repos: [
          { repo: "o/site", resumo: { ativos: -3, lixo: "x" }, itens: [] },
        ],
        historico: {
          volta: [1, "x", -2],
          longo: [9, 9, 1, 2, 3, 4, 5, 6, 7],
          nada: "x",
        },
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.historico.volta).toEqual([0, 0, 0, 0, 1, 0, 0]);
    expect(r.status.historico.longo).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(r.status.historico.nada).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(r.status.repos[0].resumo.ativos).toBe(0);
    expect(r.status.repos[0].resumo).not.toHaveProperty("lixo");
  });

  it("evento separa o tipo do resto da linha", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [],
        eventos: [
          { ts: "t", tipo: "porteiro", veredito: "aguarda-dono" },
          { ts: "t", tipo: "merge", titulo: "Corrige X" },
          { ts: "t", tipo: "volta", veredito: "volta" },
        ],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.eventos.map((e) => [e.tipo, e.texto])).toEqual([
      ["porteiro", "(aguarda-dono)"],
      ["merge", "Corrige X"],
      ["volta", ""],
    ]);
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
    // Sem `resumo`, "ativos" conta os itens do grupo (o kanban mostra 1).
    expect(r.status.repos[0].resumo).toEqual({
      ativos: 1,
      entregues: 0,
      voltas: 0,
      ultimoDeploy: null,
      saude: "",
    });
  });

  it("item solto sem apelido entra no grupo do mesmo repo com apelido", async () => {
    fetchMock.mockResolvedValue(
      resposta({
        estacoes: [],
        repos: [
          {
            alias: "vp",
            repo: "o/site",
            itens: [{ n: 1, titulo: "A", estacao: "x" }],
            resumo: { ativos: 5 },
          },
        ],
        itens: [{ n: 2, titulo: "B", repo: "o/site", estacao: "x" }],
      }),
    );
    const r = await carregarStatus(agora);
    if (r.erro) throw new Error("esperava dados");
    expect(r.status.repos).toHaveLength(1);
    expect(r.status.repos[0].itens.map((i) => i.n)).toEqual([1, 2]);
    // Com `resumo`, vale o número do produtor.
    expect(r.status.repos[0].resumo.ativos).toBe(5);
  });
});
