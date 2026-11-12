// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, fetchMock } = vi.hoisted(() => ({
  getUser: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  forbidden: vi.fn(() => {
    throw new Error("FORBIDDEN");
  }),
}));

vi.mock("next/font/google", () => ({
  JetBrains_Mono: () => ({ className: "font-mono-teste" }),
}));

import FabricaPage from "./page";

const comUsuario = (email: string) =>
  getUser.mockResolvedValue({ data: { user: { email } }, error: null });

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas,root@y.com:*");
  vi.stubEnv("FACTORY_GITHUB_TOKEN", "tok");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  getUser.mockReset();
  fetchMock.mockReset();
});

describe("/admin/fabrica — resistência", () => {
  it("sem sessão redireciona para o login e não busca no GitHub", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(FabricaPage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sem a seção fabrica dá 403 e não busca no GitHub", async () => {
    comUsuario("x@y.com");
    await expect(FabricaPage()).rejects.toThrow("FORBIDDEN");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("com * renderiza as estações e o que espera o dono", async () => {
    comUsuario("root@y.com");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        gerado_em: new Date().toISOString(),
        estacoes: [],
        itens: [],
        aguardando_dono: [
          { titulo: "Aprovar plano X", repo: "a/b", estacao: "bancada" },
        ],
      }),
    });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).toContain("Pedido (intake)");
    expect(html).toContain("Relatório");
    expect(html).toContain("Aprovar plano X");
  });

  it("sem token mostra aviso com o nome da variável, sem 500", async () => {
    comUsuario("root@y.com");
    vi.stubEnv("FACTORY_GITHUB_TOKEN", "");
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).toContain("FACTORY_GITHUB_TOKEN");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// Formato real do status.json (factory/status.py do dev-flow), sintético.
const statusReal = () => ({
  versao: 1,
  gerado_em: new Date(Date.now() - 4 * 60_000).toISOString(),
  dono: "dono",
  estacoes: [
    { id: "pedido", nome: "Pedido (intake)", faz: "x" },
    { id: "porteiro", nome: "Porteiro", faz: "x" },
    { id: "relatorio", nome: "Relatório", faz: "x" },
  ],
  repos: [
    {
      alias: "vp",
      repo: "o/site",
      itens: [
        {
          n: 101,
          titulo: "Admin da fábrica",
          estacao: "porteiro",
          aguarda: "ok do dono no PR",
          labels: ["dev-flow"],
          url: "https://github.com/o/site/issues/101",
          pr: "https://github.com/o/site/pull/102",
          atualizado: "2026-11-11T14:30:31Z",
        },
      ],
    },
  ],
  aguardando_dono: [
    {
      alias: "vp",
      repo: "o/site",
      n: 101,
      titulo: "Admin da fábrica",
      estacao: "porteiro",
      aguarda: "ok do dono no PR",
      url: "https://github.com/o/site/issues/101",
      pr: "https://github.com/o/site/pull/102",
    },
  ],
  semana: { porteiro: 4, volta: 2 },
  eventos: [
    {
      ts: "2026-11-11T05:01:38Z",
      tipo: "porteiro",
      repo: "o/site",
      n: 101,
      veredito: "aguarda-dono",
    },
    {
      ts: "2026-11-11T06:00:00Z",
      tipo: "merge",
      repo: "o/site",
      n: 7,
      titulo: "Corrige X",
    },
  ],
  erros: [{ repo: "o/outro", erro: "HTTP 502" }],
});

describe("/admin/fabrica — status.json no formato real", () => {
  it("mostra #n, aguarda, links, eventos com texto, erros e a idade", async () => {
    comUsuario("root@y.com");
    fetchMock.mockResolvedValue({ ok: true, json: async () => statusReal() });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).toContain("Fábrica (dev-flow)");
    // A idade parte de Date.now() na fixture; sob carga o relógio anda.
    expect(html).toMatch(/atualizado há \d+ min/);
    expect(html).toContain("#101");
    expect(html).toContain("ok do dono no PR");
    expect(html).toContain('href="https://github.com/o/site/issues/101"');
    expect(html).toContain('href="https://github.com/o/site/pull/102"');
    // Link para fora do admin abre em aba nova, sem dar acesso ao opener.
    const externos =
      html.match(/<a [^>]*href="https:\/\/github\.com[^>]*>/g) ?? [];
    expect(externos.length).toBeGreaterThan(0);
    for (const a of externos) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
    expect(html).toContain("porteiro (aguarda-dono)");
    expect(html).toContain("merge: Corrige X");
    expect(html).toContain("o/outro: HTTP 502");
    // agrupado pelo apelido
    expect(html).toMatch(/<th[^>]*>vp/);
  });

  it("link que não é https não vira href", async () => {
    comUsuario("root@y.com");
    const st = statusReal();
    st.aguardando_dono[0].pr = "javascript:alert(1)";
    fetchMock.mockResolvedValue({ ok: true, json: async () => st });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).not.toContain("javascript:");
  });
});

describe("/admin/fabrica — layout v2", () => {
  const statusV2 = () => ({
    ...statusReal(),
    semana: { "no-ar": 6, voltas: 2, porteiro: 4, reverts: 1 },
    historico: {
      chamou: [0, 1, 0, 2, 1, 0, 3],
      "no-ar": [0, 1, 0, 2, 1, 0, 2],
      voltas: [0, 0, 1, 0, 0, 0, 1],
    },
    tempo_medio_horas: 28,
    gargalo: { estacao: "porteiro", qtd: 4 },
    repos: [
      {
        ...statusReal().repos[0],
        resumo: {
          ativos: 7,
          entregues: 3,
          voltas: 1,
          ultimo_deploy: new Date().toISOString(),
          saude: "ok",
        },
      },
    ],
  });

  it("mostra KPIs, espera você, kanban, repo, tempo médio e gargalo", async () => {
    comUsuario("root@y.com");
    fetchMock.mockResolvedValue({ ok: true, json: async () => statusV2() });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).toContain("ESPERA VOCÊ");
    for (const rotulo of [
      "EM ANDAMENTO",
      "ENTREGUES",
      "VOLTAS",
      "PORTEIRO SEGUROU",
      "REVERTS",
    ]) {
      expect(html).toContain(rotulo);
    }
    expect(html).toContain("Kanban");
    expect(html).toContain("Repos × estações");
    expect(html).toContain("font-mono-teste");
    expect(html).toContain("fabrica@dev-flow");
    expect(html).toContain("● online");
    expect(html).toContain("1 dia e 4 h");
    expect(html).toContain("pedido → no ar (média)");
    expect(html).toContain("Porteiro · 4 itens");
    expect(html).toContain("hoje ");
    expect(html.indexOf("ESPERA VOCÊ")).toBeLessThan(
      html.indexOf("EM ANDAMENTO"),
    );
    for (const coluna of [
      "Ativos",
      "Entregues/sem",
      "Último deploy",
      "Saúde",
    ]) {
      expect(html).toContain(coluna);
    }
    expect(html).toMatch(/<th[^>]*>vp/);
    const externos = html.match(/<a [^>]*href="https:\/\/[^>]*>/g) ?? [];
    expect(externos.length).toBeGreaterThan(0);
    for (const a of externos) {
      expect(a).toContain('target="_blank"');
      expect(a).toContain('rel="noopener noreferrer"');
    }
  });

  it("status v1 (sem campos v2) renderiza sem erro", async () => {
    comUsuario("root@y.com");
    fetchMock.mockResolvedValue({ ok: true, json: async () => statusReal() });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).toContain("sem dado");
    expect(html).toContain("nada andando");
  });
});
