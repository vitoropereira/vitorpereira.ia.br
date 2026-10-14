// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, query } = vi.hoisted(() => ({
  getUser: vi.fn(),
  query: vi.fn(async () => ({ rows: [] })),
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

vi.mock("@/features/social-metrics/queries/readerDb", () => ({
  getReaderDb: () => ({ query }),
}));

import RedesPage from "./page";

const comUsuario = (email: string) =>
  getUser.mockResolvedValue({ data: { user: { email } }, error: null });

beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas,root@y.com:*");
});

afterEach(() => {
  vi.unstubAllEnvs();
  getUser.mockReset();
  query.mockClear();
});

describe("/admin/redes — resistência", () => {
  it("sem sessão redireciona para o login e não consulta o banco", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(RedesPage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(query).not.toHaveBeenCalled();
  });

  it("sem a seção redes dá 403 e não consulta o banco", async () => {
    vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas");
    comUsuario("x@y.com");
    await expect(RedesPage()).rejects.toThrow("FORBIDDEN");
    expect(query).not.toHaveBeenCalled();
  });

  it("com * renderiza; banco vazio mostra o estado vazio", async () => {
    comUsuario("root@y.com");
    const html = renderToStaticMarkup(await RedesPage());
    expect(query).toHaveBeenCalled();
    expect(html).toContain("Redes sociais");
    expect(html).toContain("A coleta ainda não rodou");
  });

  it("erro de conexão vira aviso na tela, sem vazar a mensagem do driver", async () => {
    comUsuario("root@y.com");
    query.mockRejectedValueOnce(
      new Error(
        "password authentication failed for user social_reader@db.host",
      ),
    );
    vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToStaticMarkup(await RedesPage());
    expect(html).toContain("Não foi possível ler as métricas");
    expect(html).not.toContain("db.host");
  });
});
