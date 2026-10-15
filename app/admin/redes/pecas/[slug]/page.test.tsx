// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  METRICAS,
  POSTS,
} from "@/features/social-metrics/queries/fixtures/pecas";

const { getUser, query } = vi.hoisted(() => ({
  getUser: vi.fn(),
  query: vi.fn<
    (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>
  >(async () => ({ rows: [] })),
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
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("@/features/social-metrics/queries/readerDb", () => ({
  getReaderDb: () => ({ query }),
}));

vi.mock("@/features/social-metrics/gravador", () => ({
  criarGravador: () => {
    throw new Error("a rota não pode usar o gravador");
  },
}));

import PecaPage from "./page";

const { assertSomenteLeitura } = await vi.importActual<
  typeof import("@/features/social-metrics/queries/readerDb")
>("@/features/social-metrics/queries/readerDb");

const comUsuario = (email: string) =>
  getUser.mockResolvedValue({ data: { user: { email } }, error: null });

const pagina = (slug: string) =>
  PecaPage({ params: Promise.resolve({ slug }) });

function bancoComFixture() {
  query.mockImplementation(async (sql: string, params?: unknown[]) => {
    if (sql.includes("vitor_social_post_metrics")) {
      const ids = params?.[0] as string[];
      return { rows: METRICAS.filter((m) => ids.includes(m.post_id)) };
    }
    if (sql.includes("peca_slug = $1")) {
      return { rows: POSTS.filter((p) => p.peca_slug === params?.[0]) };
    }
    if (sql.includes("pauta = $1")) {
      return {
        rows: POSTS.filter(
          (p) => p.pauta === params?.[0] && p.peca_slug !== params?.[1],
        ),
      };
    }
    return { rows: [] };
  });
}

beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas,root@y.com:*");
});

afterEach(() => {
  vi.unstubAllEnvs();
  getUser.mockReset();
  query.mockReset();
  query.mockImplementation(async () => ({ rows: [] }));
});

describe("/admin/redes/pecas/[slug] — resistência", () => {
  it("sem sessão redireciona para o login e não consulta o banco", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(pagina("x")).rejects.toThrow("REDIRECT:/admin/login");
    expect(query).not.toHaveBeenCalled();
  });

  it("sem a seção redes dá 403 e não consulta o banco", async () => {
    vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas");
    comUsuario("x@y.com");
    await expect(pagina("x")).rejects.toThrow("FORBIDDEN");
    expect(query).not.toHaveBeenCalled();
  });

  it("slug sem post dá notFound", async () => {
    comUsuario("root@y.com");
    bancoComFixture();
    await expect(pagina("nao-existe")).rejects.toThrow("NOT_FOUND");
  });

  it("com * renderiza a peça e os derivados, só com SELECT", async () => {
    comUsuario("root@y.com");
    bancoComFixture();
    const html = renderToStaticMarkup(await pagina("2026-10-01-post-b"));
    expect(html).toContain("2026-10-01-post-b");
    expect(html).toContain("Views por idade");
    expect(html).toContain("Mesma pauta");
    expect(html).toContain("Post A antigo");

    for (const [sql] of query.mock.calls) {
      expect(() => assertSomenteLeitura(sql)).not.toThrow();
      expect(sql).not.toMatch(/insert|update|delete|upsert/i);
    }
  });

  it("erro de banco vira aviso, não 404 nem 500", async () => {
    comUsuario("root@y.com");
    query.mockRejectedValue(new Error("falhou em db.host"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToStaticMarkup(await pagina("x"));
    expect(html).toContain("Não foi possível ler as métricas");
    expect(html).not.toContain("db.host");
  });
});
