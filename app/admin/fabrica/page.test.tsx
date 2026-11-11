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
          { titulo: "Aprovar plano X", repo: "a/b", estacao: "plano-ok" },
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
