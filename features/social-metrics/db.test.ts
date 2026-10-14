import { describe, expect, it } from "vitest";
import { criarDb } from "./db";

describe("criarDb", () => {
  it("sem SOCIAL_COLLECTOR_DATABASE_URL lança, sem cair num default", () => {
    expect(() =>
      criarDb({ DATABASE_URL: "postgres://outro@localhost/db" }),
    ).toThrow(/SOCIAL_COLLECTOR_DATABASE_URL/);
  });

  it("com a URL monta o pool sem conectar", async () => {
    const db = criarDb({
      SOCIAL_COLLECTOR_DATABASE_URL:
        "postgres://social_collector@127.0.0.1:1/x",
    });
    expect(typeof db.query).toBe("function");
    await db.fechar();
  });
});
