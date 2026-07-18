import { describe, it, expect, vi } from "vitest";
import { createSession, createContent, RateLimitError, AuthError } from "./client.ts";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("createSession", () => {
  it("manda email/senha e devolve token", async () => {
    const fetch = vi.fn().mockResolvedValue(json(201, { token: "t".repeat(96), expires_at: "2026-08-17T00:00:00Z" }));
    const s = await createSession({ email: "a@b.com", password: "secret123" }, { fetch });
    expect(s.token).toHaveLength(96);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "a@b.com", password: "secret123" });
  });
  it("403 vira AuthError", async () => {
    const fetch = vi.fn().mockResolvedValue(json(403, { message: "não ativada" }));
    await expect(createSession({ email: "a@b.com", password: "secret123" }, { fetch })).rejects.toBeInstanceOf(AuthError);
  });
});

describe("createContent", () => {
  const session = { token: "t".repeat(96), expiresAt: "z" };
  it("envia status published + Cookie; monta a URL pública", async () => {
    const fetch = vi.fn().mockResolvedValue(json(201, { owner_username: "vitorpereirasaas", slug: "meu-post" }));
    const r = await createContent(session, { title: "T", body: "B", status: "published", sourceUrl: "https://vitorpereira.ia.br/x" }, { fetch });
    expect(r.url).toBe("https://www.tabnews.com.br/vitorpereirasaas/meu-post");
    expect(fetch.mock.calls[0][1].headers.Cookie).toBe(`session_id=${session.token}`);
    expect(JSON.parse(fetch.mock.calls[0][1].body).status).toBe("published");
  });
  it("429 vira RateLimitError", async () => {
    const fetch = vi.fn().mockResolvedValue(json(429, { message: "muitas requisições" }));
    await expect(createContent(session, { title: "T", body: "B", status: "published", sourceUrl: "https://x" }, { fetch })).rejects.toBeInstanceOf(RateLimitError);
  });
});
