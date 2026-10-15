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
}));

vi.mock("@/features/social-metrics/queries/readerDb", () => ({
  getReaderDb: () => ({ query }),
}));

// Se a rota carregar o gravador, qualquer uso quebra o teste.
vi.mock("@/features/social-metrics/gravador", () => ({
  criarGravador: () => {
    throw new Error("a rota não pode usar o gravador");
  },
}));

import PecasPage from "./page";

const { assertSomenteLeitura } = await vi.importActual<
  typeof import("@/features/social-metrics/queries/readerDb")
>("@/features/social-metrics/queries/readerDb");

const comUsuario = (email: string) =>
  getUser.mockResolvedValue({ data: { user: { email } }, error: null });

const pagina = (sp: Record<string, string> = {}) =>
  PecasPage({ searchParams: Promise.resolve(sp) });

beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas,root@y.com:*");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-14T15:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  getUser.mockReset();
  query.mockReset();
  query.mockImplementation(async () => ({ rows: [] }));
});

describe("/admin/redes/pecas — resistência", () => {
  it("sem sessão redireciona para o login e não consulta o banco", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(pagina()).rejects.toThrow("REDIRECT:/admin/login");
    expect(query).not.toHaveBeenCalled();
  });

  it("sem a seção redes dá 403 e não consulta o banco", async () => {
    vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas");
    comUsuario("x@y.com");
    await expect(pagina()).rejects.toThrow("FORBIDDEN");
    expect(query).not.toHaveBeenCalled();
  });

  it("com * renderiza o ranking por D+7, só com SELECT", async () => {
    comUsuario("root@y.com");
    query.mockImplementation(async (sql: string, params?: unknown[]) => {
      if (sql.includes("vitor_social_post_metrics")) {
        const ids = params?.[0] as string[];
        return { rows: METRICAS.filter((m) => ids.includes(m.post_id)) };
      }
      if (sql.includes("distinct")) return { rows: [] };
      return { rows: POSTS };
    });
    const html = renderToStaticMarkup(await pagina({ rede: "drop" }));
    expect(html).toContain("Peças por idade");
    // B (D+7 maior) antes de A (total maior).
    expect(html.indexOf("Post B novo")).toBeLessThan(
      html.indexOf("Post A antigo"),
    );
    expect(html).toContain('method="get"');

    expect(query).toHaveBeenCalled();
    for (const [sql] of query.mock.calls) {
      expect(() => assertSomenteLeitura(sql)).not.toThrow();
      expect(sql).not.toMatch(/insert|update|delete|upsert/i);
    }
  });

  it("erro de conexão vira aviso na tela, sem vazar a mensagem do driver", async () => {
    comUsuario("root@y.com");
    query.mockRejectedValue(new Error("falhou em db.host"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToStaticMarkup(await pagina());
    expect(html).toContain("Não foi possível ler as métricas");
    expect(html).not.toContain("db.host");
  });
});
