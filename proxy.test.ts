// @vitest-environment node
// NextRequest precisa dos globals de fetch do Node, não do jsdom.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { updateSession } = vi.hoisted(() => ({
  updateSession: vi.fn(async (_req: NextRequest, requestHeaders: Headers) =>
    NextResponse.next({ request: { headers: requestHeaders } }),
  ),
}));
vi.mock("@/lib/supabase/proxy", () => ({ updateSession }));

import { config, proxy } from "./proxy";

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("/ sem cookie e Accept-Language en → 307 para /en e seta cookie", async () => {
    const res = await proxy(req("/", { "accept-language": "en-US,en;q=0.9" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en");
    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("/ sem cookie e Accept-Language pt → não redireciona e seta cookie pt", async () => {
    const res = await proxy(req("/", { "accept-language": "pt-BR,pt;q=0.9" }));
    expect(res.headers.get("location")).toBeNull();
    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("pt");
  });

  it("/ com cookie en → 307 para /en", async () => {
    const res = await proxy(req("/", { cookie: "NEXT_LOCALE=en" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en");
  });

  // O Next codifica `next({ request: { headers } })` como
  // `x-middleware-request-<nome>` na response; é isso que o `headers()` de
  // i18n/request.ts enxerga. Header na response não chega lá.
  const reqHeader = (res: Response, name: string) =>
    res.headers.get(`x-middleware-request-${name}`);

  it("/posts com cookie pt → sem redirect e x-pathname na request", async () => {
    const res = await proxy(req("/posts", { cookie: "NEXT_LOCALE=pt" }));
    expect(res.headers.get("location")).toBeNull();
    expect(reqHeader(res, "x-pathname")).toBe("/posts");
    expect(res.headers.get("x-pathname")).toBeNull();
  });

  it("/en/posts → sem redirect e x-pathname na request", async () => {
    const res = await proxy(req("/en/posts"));
    expect(res.headers.get("location")).toBeNull();
    expect(reqHeader(res, "x-pathname")).toBe("/en/posts");
    expect(res.headers.get("x-pathname")).toBeNull();
  });

  it("/en exato → x-pathname na request", async () => {
    expect(reqHeader(await proxy(req("/en")), "x-pathname")).toBe("/en");
  });

  it("/sobre → x-pathname na request", async () => {
    expect(reqHeader(await proxy(req("/sobre")), "x-pathname")).toBe("/sobre");
  });

  it("/ com cookie pt → x-pathname na request", async () => {
    const res = await proxy(req("/", { cookie: "NEXT_LOCALE=pt" }));
    expect(reqHeader(res, "x-pathname")).toBe("/");
  });

  it("/ sem cookie e pt → x-pathname na request e cookie pt gravado", async () => {
    const res = await proxy(req("/", { "accept-language": "pt-BR,pt;q=0.9" }));
    expect(reqHeader(res, "x-pathname")).toBe("/");
    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("pt");
  });

  it.each([
    "/sitemap.xml",
    "/rss.xml",
    "/favicon.ico",
    "/_next/static/x.js",
    "/api/track",
  ])("%s → passa direto, sem redirect nem x-pathname", async (path) => {
    const res = await proxy(req(path));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-pathname")).toBeNull();
    expect(reqHeader(res, "x-pathname")).toBeNull();
  });

  // /admin fica fora do i18n: nem redirect para /en nem cookie de locale,
  // mesmo com o browser pedindo inglês na primeira visita.
  it.each(["/admin", "/admin/login", "/admin/redes"])(
    "%s sem cookie e Accept-Language en → fora do i18n",
    async (path) => {
      updateSession.mockClear();
      const res = await proxy(req(path, { "accept-language": "en-US,en" }));
      expect(res.headers.get("location")).toBeNull();
      expect(res.cookies.get("NEXT_LOCALE")).toBeUndefined();
      expect(reqHeader(res, "x-pathname")).toBe(path);
      expect(updateSession).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["/administracao", "/en/admin"])(
    "%s não é /admin e segue o fluxo normal",
    async (path) => {
      updateSession.mockClear();
      const res = await proxy(req(path));
      expect(reqHeader(res, "x-pathname")).toBe(path);
      expect(updateSession).not.toHaveBeenCalled();
    },
  );

  it("matcher preservado", () => {
    expect(config.matcher).toEqual(["/((?!_next|api|.*\\..*).*)"]);
  });
});
