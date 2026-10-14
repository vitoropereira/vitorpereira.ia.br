// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const { poolQuery, Pool } = vi.hoisted(() => {
  const poolQuery = vi.fn(async () => ({ rows: [{ a: 1 }] }));
  const Pool = vi.fn(function (this: { query: typeof poolQuery }) {
    this.query = poolQuery;
  });
  return { poolQuery, Pool };
});
vi.mock("pg", () => ({ default: { Pool } }));

import { assertSomenteLeitura, criarReaderDb } from "./readerDb";

afterEach(() => {
  poolQuery.mockClear();
  Pool.mockClear();
});

describe("criarReaderDb", () => {
  it("sem SOCIAL_READER_DATABASE_URL lança mensagem clara", () => {
    expect(() => criarReaderDb({})).toThrow(/SOCIAL_READER_DATABASE_URL/);
    expect(Pool).not.toHaveBeenCalled();
  });

  it("não abre conexão antes da primeira consulta", () => {
    criarReaderDb({ SOCIAL_READER_DATABASE_URL: "postgres://r@h/db" });
    expect(Pool).not.toHaveBeenCalled();
  });

  it("SELECT e WITH chegam ao driver", async () => {
    const db = criarReaderDb({
      SOCIAL_READER_DATABASE_URL: "postgres://r@h/db",
    });
    await expect(db.query("select 1")).resolves.toEqual({ rows: [{ a: 1 }] });
    await db.query("  WITH x as (select 1) select * from x");
    expect(poolQuery).toHaveBeenCalledTimes(2);
    expect(Pool).toHaveBeenCalledTimes(1);
  });

  it.each([
    "insert into public.vitor_social_goals (rede) values ('youtube')",
    "update public.vitor_social_goals set por_semana = 9",
    "delete from public.vitor_social_posts",
    "select 1; delete from public.vitor_social_posts",
    "with d as (delete from public.vitor_social_posts returning *) select * from d",
    "truncate public.vitor_social_posts",
  ])("escrita não autorizada falha antes do driver: %s", async (sql) => {
    const db = criarReaderDb({
      SOCIAL_READER_DATABASE_URL: "postgres://r@h/db",
    });
    await expect(db.query(sql)).rejects.toThrow(/somente leitura/);
    expect(poolQuery).not.toHaveBeenCalled();
  });
});

describe("assertSomenteLeitura", () => {
  it("coluna com nome parecido com comando não é barrada", () => {
    expect(() =>
      assertSomenteLeitura("select updated_at, created_at from t"),
    ).not.toThrow();
  });
});
