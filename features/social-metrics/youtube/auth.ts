import type { Fetch } from "../types.ts";

export const TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface CredenciaisYouTube {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

/**
 * Troca o refresh token por um access token de curta duração. A mensagem de
 * erro nunca carrega o corpo do pedido: ele tem o client secret e o refresh
 * token, e o log do Actions é público para quem vê o repo.
 */
export async function obterAccessToken(
  fetch: Fetch,
  cred: CredenciaisYouTube,
): Promise<string> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cred.clientId,
    client_secret: cred.clientSecret,
    refresh_token: cred.refreshToken,
  }).toString();

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
  };

  if (json.error === "invalid_grant") {
    throw new Error(
      "YouTube OAuth: refresh token expirado/revogado; rode pnpm social:auth:youtube e atualize o secret YT_REFRESH_TOKEN.",
    );
  }
  if (!res.ok || !json.access_token) {
    // Só o código de erro do Google, que é um identificador fixo
    // (`invalid_client`, `unauthorized_client`...), entra na mensagem.
    const codigo = typeof json.error === "string" ? json.error : "sem código";
    throw new Error(
      `YouTube OAuth: falha ao renovar token (HTTP ${res.status}, ${codigo}).`,
    );
  }
  return json.access_token;
}

export function credenciaisDoAmbiente(
  env: Record<string, string | undefined>,
): CredenciaisYouTube {
  const faltando = [
    "YT_CLIENT_ID",
    "YT_CLIENT_SECRET",
    "YT_REFRESH_TOKEN",
  ].filter((k) => !env[k]);
  if (faltando.length > 0) {
    throw new Error(`Faltam variáveis do YouTube: ${faltando.join(", ")}.`);
  }
  return {
    clientId: env.YT_CLIENT_ID!,
    clientSecret: env.YT_CLIENT_SECRET!,
    refreshToken: env.YT_REFRESH_TOKEN!,
  };
}
