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
    expect(html).toContain("atualizado há 4 min");
    expect(html).toContain("#101");
    expect(html).toContain("ok do dono no PR");
    expect(html).toContain('href="https://github.com/o/site/issues/101"');
    expect(html).toContain('href="https://github.com/o/site/pull/102"');
    expect(html).toContain("porteiro (aguarda-dono)");
    expect(html).toContain("merge: Corrige X");
    expect(html).toContain("o/outro: HTTP 502");
    // agrupado pelo apelido
    expect(html).toMatch(/<h3[^>]*>vp/);
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
