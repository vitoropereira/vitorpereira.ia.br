/**
 * social:auth:youtube — consentimento OAuth único para o coletor do YouTube.
 * Sobe um servidor de loopback em 127.0.0.1, recebe o `code` do Google e
 * troca pelo refresh token, que sai SÓ no stdout: cadastre no secret
 * YT_REFRESH_TOKEN e feche o terminal. Nada é gravado em disco.
 *
 *   pnpm social:auth:youtube    (precisa de YT_CLIENT_ID e YT_CLIENT_SECRET)
 */
import { createHash, randomBytes } from "node:crypto";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { TOKEN_URL } from "../features/social-metrics/youtube/auth.ts";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const ESCOPOS = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];
const TIMEOUT_MS = 5 * 60_000;

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const base64url = (b: Buffer) => b.toString("base64url");

async function main(): Promise<void> {
  const clientId = process.env.YT_CLIENT_ID;
  const clientSecret = process.env.YT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    fail(
      "Defina YT_CLIENT_ID e YT_CLIENT_SECRET (cliente OAuth tipo Desktop).",
    );
  }

  // `state` barra callback forjado; PKCE barra quem interceptar o `code`.
  const state = base64url(randomBytes(24));
  const verifier = base64url(randomBytes(48));
  const challenge = base64url(createHash("sha256").update(verifier).digest());

  const code = await new Promise<{ code: string; redirectUri: string }>(
    (resolve, reject) => {
      let redirectUri = "";
      const server = createServer((req, res) => {
        const u = new URL(req.url ?? "/", redirectUri);
        if (u.pathname !== "/callback") {
          res.writeHead(404).end();
          return;
        }
        const erro = u.searchParams.get("error");
        const recebido = u.searchParams.get("code");
        if (u.searchParams.get("state") !== state) {
          res.writeHead(400).end("state inválido.");
          return;
        }
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
        res.end("Pronto. Pode fechar esta aba e voltar ao terminal.");
        clearTimeout(timer);
        server.close();
        if (erro || !recebido)
          reject(new Error(`consentimento negado: ${erro}`));
        else resolve({ code: recebido, redirectUri });
      });
      const timer = setTimeout(() => {
        server.close();
        reject(new Error("tempo esgotado esperando o consentimento."));
      }, TIMEOUT_MS);

      server.listen(0, "127.0.0.1", () => {
        const { port } = server.address() as AddressInfo;
        redirectUri = `http://127.0.0.1:${port}/callback`;
        const url = new URL(AUTH_URL);
        url.search = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: ESCOPOS.join(" "),
          // offline + consent: sem os dois o Google não devolve refresh token
          // numa segunda autorização.
          access_type: "offline",
          prompt: "consent",
          state,
          code_challenge: challenge,
          code_challenge_method: "S256",
        }).toString();
        console.log("\nAbra no navegador e autorize com a conta do canal:\n");
        console.log(url.toString());
        console.log("\nAguardando o retorno em", redirectUri, "...");
      });
    },
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code.code,
      redirect_uri: code.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
      code_verifier: verifier,
    }).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as {
    refresh_token?: string;
    error?: string;
  };
  if (!res.ok || !json.refresh_token) {
    fail(
      `o Google não devolveu refresh token (HTTP ${res.status}, ${json.error ?? "sem código"}).`,
    );
  }

  console.log("\nRefresh token (cadastre no secret YT_REFRESH_TOKEN):\n");
  console.log(json.refresh_token);
  console.log(
    "\nSe a tela de consentimento estiver em 'Testing', ele expira em 7 dias.\n",
  );
}

main().catch((e: unknown) => fail(e instanceof Error ? e.message : String(e)));
