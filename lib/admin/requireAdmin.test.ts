// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));

// redirect e forbidden do Next interrompem a renderização lançando; aqui
// lançam sentinelas para o teste saber qual dos dois foi chamado.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  forbidden: vi.fn(() => {
    throw new Error("FORBIDDEN");
  }),
}));

import { requireAdmin, requireAdminApi } from "./requireAdmin";

const semUsuario = () =>
  getUser.mockResolvedValue({ data: { user: null }, error: null });
const comUsuario = (email: string) =>
  getUser.mockResolvedValue({ data: { user: { email } }, error: null });

beforeEach(() => {
  vi.stubEnv("ADMIN_ACCESS", "x@y.com:financas,root@y.com:*");
});

afterEach(() => {
  vi.unstubAllEnvs();
  getUser.mockReset();
});

describe("requireAdmin — o que precisa barrar", () => {
  it("sem sessão: requireAdmin() manda para o login", async () => {
    semUsuario();
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("sem sessão: requireAdmin('redes') manda para o login", async () => {
    semUsuario();
    await expect(requireAdmin("redes")).rejects.toThrow(
      "REDIRECT:/admin/login",
    );
  });

  it("erro do Auth conta como sem sessão", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("jwt expired"),
    });
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("Auth que lança (sem env, rede) conta como sem sessão", async () => {
    getUser.mockRejectedValue(new Error("fetch failed"));
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
    const res = await requireAdminApi();
    expect((res as Response).status).toBe(401);
  });

  it("e-mail fora do ADMIN_ACCESS: 403", async () => {
    comUsuario("intruso@y.com");
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
    await expect(requireAdmin("redes")).rejects.toThrow("FORBIDDEN");
  });

  it("e-mail só com financas: 403 em redes", async () => {
    comUsuario("x@y.com");
    await expect(requireAdmin("redes")).rejects.toThrow("FORBIDDEN");
  });

  it("ADMIN_ACCESS ausente nega todo mundo", async () => {
    vi.stubEnv("ADMIN_ACCESS", "");
    comUsuario("root@y.com");
    await expect(requireAdmin()).rejects.toThrow("FORBIDDEN");
  });
});

describe("requireAdmin — caso feliz", () => {
  it("sem seção, basta estar na lista", async () => {
    comUsuario("X@y.com");
    await expect(requireAdmin()).resolves.toEqual({
      email: "x@y.com",
      sections: [],
    });
  });

  it("* entra em redes e vê o catálogo inteiro", async () => {
    comUsuario("root@y.com");
    await expect(requireAdmin("redes")).resolves.toEqual({
      email: "root@y.com",
      sections: ["redes"],
    });
  });
});

describe("requireAdminApi", () => {
  it("sem sessão devolve 401", async () => {
    semUsuario();
    const res = await requireAdminApi("redes");
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).status).toBe(401);
  });

  it("e-mail fora da lista devolve 403", async () => {
    comUsuario("intruso@y.com");
    expect(((await requireAdminApi()) as Response).status).toBe(403);
  });

  it("seção alheia devolve 403", async () => {
    comUsuario("x@y.com");
    expect(((await requireAdminApi("redes")) as Response).status).toBe(403);
  });

  it("permitido devolve o admin", async () => {
    comUsuario("root@y.com");
    await expect(requireAdminApi("redes")).resolves.toEqual({
      email: "root@y.com",
      sections: ["redes"],
    });
  });
});
