import { describe, it, expect, vi } from "vitest";
import { sqlLiteral, runSql, getAdminConfig } from "./supabase-admin.ts";

describe("sqlLiteral", () => {
  it("escapa aspas simples (anti-quebra de INSERT)", () => {
    expect(sqlLiteral("O 'contrato' da tool")).toBe("'O ''contrato'' da tool'");
  });
  it("números, booleanos, null", () => {
    expect(sqlLiteral(42)).toBe("42");
    expect(sqlLiteral(true)).toBe("true");
    expect(sqlLiteral(null)).toBe("null");
    expect(sqlLiteral(undefined)).toBe("null");
    expect(sqlLiteral(Number.NaN)).toBe("null");
  });
  it("arrays viram array[...]::text[] com itens escapados", () => {
    expect(sqlLiteral(["agentes", "seguranca"])).toBe("array['agentes','seguranca']::text[]");
    expect(sqlLiteral([])).toBe("array[]::text[]");
    expect(sqlLiteral(["a'b"])).toBe("array['a''b']::text[]");
  });
});

describe("getAdminConfig", () => {
  it("lê token e ref do env", () => {
    expect(getAdminConfig({ SUPABASE_TOKEN: "t", SUPABASE_PROJECT_REF: "r" } as never)).toEqual({
      token: "t",
      ref: "r",
    });
  });
  it("estoura se faltar", () => {
    expect(() => getAdminConfig({ SUPABASE_TOKEN: "t" } as never)).toThrow(/obrigatórios/);
  });
});

describe("runSql", () => {
  it("POSTa no endpoint do ref com o token e devolve as linhas", async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([{ n: 1 }]), { status: 200 }),
    );
    const rows = await runSql("select 1 as n", { fetch, config: { token: "tok", ref: "abc" } });
    expect(rows).toEqual([{ n: 1 }]);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://api.supabase.com/v1/projects/abc/database/query");
    expect(init.headers.Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body).query).toBe("select 1 as n");
  });
  it("erro HTTP vira exceção", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("nope", { status: 400 }));
    await expect(
      runSql("bad", { fetch, config: { token: "t", ref: "r" } }),
    ).rejects.toThrow(/falhou \(400\)/);
  });
});
