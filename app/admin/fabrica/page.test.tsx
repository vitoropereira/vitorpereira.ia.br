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
    // Tipo do evento colorido à parte; o resto da linha vem depois.
    expect(html).toMatch(/>porteiro<\/span> \(aguarda-dono\)/);
    expect(html).toMatch(/>merge<\/span> Corrige X/);
    // Hora legível, não o ISO cru.
    expect(html).not.toContain(">2026-11-11T05:01:38Z<");
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
  // Campos v2 copiados do JSON de exemplo da issue #105, sobre o status real.
  const statusV2 = () => ({
    ...statusReal(),
    versao: 2,
    semana: { porteiro: 7, chamou: 5, volta: 2, "no-ar": 1 },
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
        ...statusReal().repos[0],
        resumo: {
          ativos: 1,
          entregues: 1,
          voltas: 2,
          ultimo_deploy: new Date().toISOString(),
          saude: "atencao",
        },
      },
    ],
  });

  // Valor do KPI logo depois do rótulo.
  const kpi = (html: string, rotulo: string) =>
    html.match(new RegExp(`>${rotulo}</span><span[^>]*>(\\d+)<`))?.[1];

  it("mostra KPIs, espera você, kanban, repo, tempo médio e gargalo", async () => {
    comUsuario("root@y.com");
    fetchMock.mockResolvedValue({ ok: true, json: async () => statusV2() });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).toContain("ESPERA VOCÊ · 1");
    expect(html).toContain(">Abrir<");
    expect(kpi(html, "EM ANDAMENTO")).toBe("1");
    expect(kpi(html, "ESPERA VOCÊ")).toBe("1");
    expect(kpi(html, "ENTREGUES")).toBe("1");
    expect(kpi(html, "VOLTAS")).toBe("2");
    expect(kpi(html, "PORTEIRO SEGUROU")).toBe("7");
    // Tipo ausente no histórico é zero, não erro.
    expect(kpi(html, "REVERTS")).toBe("0");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Kanban");
    expect(html).toContain("Repos × estações");
    expect(html).toContain("font-mono-teste");
    expect(html).toContain("fabrica@dev-flow");
    expect(html).toContain("● online");
    expect(html).toContain("1 dia e 10 h");
    expect(html).toContain("pedido → no ar (média)");
    expect(html).toContain("Porteiro · 1 item");
    expect(html).toContain("hoje ");
    expect(html).toContain("atencao");
    // Paleta do mock C.
    expect(html).toContain("#05070c");
    expect(html).toContain("#0b0f17");
    expect(html).not.toMatch(/\brounded/);
    expect(html.indexOf("ESPERA VOCÊ · 1")).toBeLessThan(
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
    expect(kpi(html, "VOLTAS")).toBe("0");
  });

  it("sem item esperando o dono a faixa some e sem erro o bloco de erros some", async () => {
    comUsuario("root@y.com");
    const st = { ...statusV2(), aguardando_dono: [], erros: [] };
    fetchMock.mockResolvedValue({ ok: true, json: async () => st });
    const html = renderToStaticMarkup(await FabricaPage());
    expect(html).not.toContain("ESPERA VOCÊ ·");
    expect(kpi(html, "ESPERA VOCÊ")).toBe("0");
    expect(html).not.toMatch(/erros ·/);
  });
});
