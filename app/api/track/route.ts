import { resolveTrackRedirect, buildClickPayload, logClick, SITE_ORIGIN } from "@/lib/analytics/click";

// Redirect de rastreio; sempre por-request (nunca cacheado).
export const dynamic = "force-dynamic";

/**
 * GET /api/track?to=<url canônica no nosso domínio>&f=<formato>
 * Loga o clique first-party (best-effort, gated na env) e redireciona 302 pro
 * destino. Anti open-redirect: só redireciona pra vitorpereira.ia.br.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get("to") ?? "";
  const format = searchParams.get("f");

  const dest = resolveTrackRedirect(to, format);
  if (!dest) {
    // destino inválido/externo → volta pro site com segurança
    return Response.redirect(SITE_ORIGIN, 302);
  }

  const payload = buildClickPayload(to, format, {
    userAgent: request.headers.get("user-agent") ?? "",
    referrer: request.headers.get("referer"),
    country: request.headers.get("x-vercel-ip-country"),
  });
  await logClick(payload); // best-effort, nunca lança, no-op se não configurado

  return Response.redirect(dest, 302);
}
