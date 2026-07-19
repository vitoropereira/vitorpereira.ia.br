/**
 * Lógica pura + gravação do log de clique first-party (funil TabNews → site).
 * Usada pela rota `app/api/track` (server-side). A gravação usa service_role
 * (bypassa RLS), gated na env — no-op silencioso se não configurado.
 */
export const SITE_ORIGIN = "https://vitorpereira.ia.br";

/**
 * Anti open-redirect: só aceita destinos no NOSSO domínio. Monta a URL final com
 * UTM (pra o GA também enxergar). Devolve null se o destino for inválido/externo.
 */
export function resolveTrackRedirect(to: string, format: string | null): string | null {
  let dest: URL;
  try {
    dest = new URL(to);
  } catch {
    return null;
  }
  if (dest.origin !== SITE_ORIGIN) return null;
  dest.searchParams.set("utm_source", "tabnews");
  dest.searchParams.set("utm_medium", "syndication");
  if (format) dest.searchParams.set("utm_content", format);
  return dest.toString();
}

export function permalinkFromCanonical(to: string): string {
  try {
    return new URL(to).pathname;
  } catch {
    return "";
  }
}

export function deviceFromUA(ua: string): "mobile" | "desktop" {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "desktop";
}

// Link-unfurlers e crawlers disparam o /api/track ao desdobrar o link — não são
// cliques humanos. Filtrados para não inflar a métrica primária (cliques).
const BOT_UA =
  /bot|crawl|spider|facebookexternalhit|whatsapp|slackbot|twitterbot|discordbot|telegrambot|linkedinbot|embedly|preview|curl|wget|python-requests|headless|monitor/i;

/** UA vazio ou de bot/unfurler → não conta como clique. */
export function isLikelyBot(ua: string): boolean {
  return ua.trim() === "" || BOT_UA.test(ua);
}

/** Hash não-reversível do UA (privacidade — não guardamos UA cru). */
export function hashUA(ua: string): string {
  let h = 0;
  for (let i = 0; i < ua.length; i++) h = (Math.imul(31, h) + ua.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export interface ClickPayload {
  post_permalink: string;
  format: string | null;
  referrer: string | null;
  country: string | null;
  device: string;
  ua_hash: string;
}

export function buildClickPayload(
  to: string,
  format: string | null,
  headers: { userAgent: string; referrer: string | null; country: string | null },
): ClickPayload {
  return {
    post_permalink: permalinkFromCanonical(to),
    format,
    referrer: headers.referrer,
    country: headers.country,
    device: deviceFromUA(headers.userAgent),
    ua_hash: hashUA(headers.userAgent),
  };
}

type LogDeps = { fetch?: typeof fetch; env?: NodeJS.ProcessEnv };

/**
 * Grava o clique via REST do Supabase com service_role (server-side apenas).
 * Gated: sem NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, é no-op.
 * Devolve true se gravou, false se pulou/ignorado. Nunca lança (o redirect manda).
 */
export async function logClick(payload: ClickPayload, deps: LogDeps = {}): Promise<boolean> {
  const env = deps.env ?? process.env;
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return false;
  const f = deps.fetch ?? fetch;
  try {
    const res = await f(`${url}/rest/v1/vitor_syndication_clicks`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}
