// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/features/social-metrics/gravador", () => ({
  criarGravador: () => {
    throw new Error("a rota não pode usar o gravador");
  },
}));

import CasamentosPage from "./page";

const { assertSomenteLeitura } = await vi.importActual<
  typeof import("@/features/social-metrics/queries/readerDb")
>("@/features/social-metrics/queries/readerDb");

const ARVORE = {
  tree: [
    { type: "blob", path: "content/producao/2026-10/2026-10-05-agentes.md" },
  ],
};
const PECA =
  "---\nplataforma: youtube\ncreated: 2026-10-05\npauta: agentes\n---\n";

type Resposta = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
};
const fetchFake = vi.fn<
  (url: string, init?: { method?: string }) => Promise<Resposta>
>(async (url) => ({
  ok: true,
  status: 200,
  json: async () => ARVORE,
  text: async () => (url.includes("/contents/") ? PECA : ""),
}));

const comUsuario = (email: string) =>
  getUser.mockResolvedValue({ data: { user: { email } }, error: null });

beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas,root@y.com:*");
  vi.stubEnv("CONTENT_OS_READ_TOKEN", "token-de-teste");
  vi.stubGlobal("fetch", fetchFake);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  getUser.mockReset();
  fetchFake.mockClear();
  query.mockReset();
  query.mockImplementation(async () => ({ rows: [] }));
});

const postSemPeca = () =>
  query.mockImplementation(async () => ({
    rows: [
      {
        rede: "youtube",
        external_id: "dQw4w9WgXcQ",
        titulo: "Vídeo sem peça",
        published_at: new Date("2026-10-09T15:00:00Z"),
      },
    ],
  }));

describe("/admin/redes/casamentos — resistência", () => {
  it("sem sessão redireciona e não lê banco nem GitHub", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(CasamentosPage()).rejects.toThrow("REDIRECT:/admin/login");
    expect(query).not.toHaveBeenCalled();
    expect(fetchFake).not.toHaveBeenCalled();
  });

  it("sem a seção redes dá 403 e não lê banco nem GitHub", async () => {
    vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas");
    comUsuario("x@y.com");
    await expect(CasamentosPage()).rejects.toThrow("FORBIDDEN");
    expect(query).not.toHaveBeenCalled();
    expect(fetchFake).not.toHaveBeenCalled();
  });

  it("com * sugere a peça e mostra onde colar o id, só com SELECT e GET", async () => {
    comUsuario("root@y.com");
    postSemPeca();
    const html = renderToStaticMarkup(await CasamentosPage());
    expect(html).toContain("Casamentos");
    expect(html).toContain("2026-10-05-agentes");
    expect(html).toContain("content/producao/2026-10/2026-10-05-agentes.md");
    expect(html).toContain("youtube_id: dQw4w9WgXcQ");
    expect(html).not.toContain("token-de-teste");

    for (const [sql] of query.mock.calls) {
      expect(() => assertSomenteLeitura(sql)).not.toThrow();
      expect(sql).not.toMatch(/insert|update|delete|upsert/i);
    }
    expect(fetchFake).toHaveBeenCalled();
    for (const [, init] of fetchFake.mock.calls) {
      expect(init?.method).toBe("GET");
    }
  });

  it("sem token mostra aviso e não chama o GitHub", async () => {
    vi.stubEnv("CONTENT_OS_READ_TOKEN", "");
    comUsuario("root@y.com");
    postSemPeca();
    const html = renderToStaticMarkup(await CasamentosPage());
    expect(html).toContain("CONTENT_OS_READ_TOKEN");
    expect(fetchFake).not.toHaveBeenCalled();
  });

  it("GitHub fora do ar vira aviso, não 500", async () => {
    comUsuario("root@y.com");
    postSemPeca();
    fetchFake.mockImplementationOnce(async () => ({
      ok: false,
      status: 503,
      json: async () => ({}),
      text: async () => "",
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const html = renderToStaticMarkup(await CasamentosPage());
    expect(html).toContain("Não foi possível ler as peças do content-os");
  });
});
