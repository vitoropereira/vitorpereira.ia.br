import { describe, expect, it, vi } from "vitest";
import type { Fetch } from "../types";
import { credenciaisDoAmbiente, obterAccessToken, TOKEN_URL } from "./auth";

const CRED = {
  clientId: "cliente-teste.apps.googleusercontent.com",
  clientSecret: "segredo-de-teste-123",
  refreshToken: "refresh-de-teste-456",
};

function resposta(status: number, json: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => json,
    text: async () => JSON.stringify(json),
  };
}

describe("obterAccessToken", () => {
  it("faz POST com grant_type=refresh_token e devolve o access token", async () => {
    const fetch = vi.fn<Fetch>(async () =>
      resposta(200, { access_token: "tok", expires_in: 3599 }),
    );
    await expect(obterAccessToken(fetch, CRED)).resolves.toBe("tok");

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(TOKEN_URL);
    expect(init?.method).toBe("POST");
    const body = new URLSearchParams(init?.body);
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe(CRED.refreshToken);
    expect(body.get("client_id")).toBe(CRED.clientId);
  });

  it("invalid_grant explica como renovar, sem vazar segredo", async () => {
    const fetch = vi.fn<Fetch>(async () =>
      resposta(400, {
        error: "invalid_grant",
        error_description: "Token has been expired or revoked.",
      }),
    );
    const erro = await obterAccessToken(fetch, CRED).catch((e: Error) => e);
    expect(erro).toBeInstanceOf(Error);
    const msg = (erro as Error).message;
    expect(msg).toContain("pnpm social:auth:youtube");
    expect(msg).not.toContain(CRED.clientSecret);
    expect(msg).not.toContain(CRED.refreshToken);
  });

  it("outro erro traz status e código, sem segredo", async () => {
    const fetch = vi.fn<Fetch>(async () =>
      resposta(401, { error: "invalid_client" }),
    );
    const erro = (await obterAccessToken(fetch, CRED).catch(
      (e: Error) => e,
    )) as Error;
    expect(erro.message).toContain("401");
    expect(erro.message).toContain("invalid_client");
    expect(erro.message).not.toContain(CRED.clientSecret);
    expect(erro.message).not.toContain(CRED.refreshToken);
  });
});

describe("credenciaisDoAmbiente", () => {
  it("lista as variáveis que faltam", () => {
    expect(() => credenciaisDoAmbiente({ YT_CLIENT_ID: "x" })).toThrow(
      /YT_CLIENT_SECRET, YT_REFRESH_TOKEN/,
    );
  });
});
