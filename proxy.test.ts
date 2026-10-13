// @vitest-environment node
// NextRequest precisa dos globals de fetch do Node, não do jsdom.
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

function req(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

describe("proxy", () => {
  it("/ sem cookie e Accept-Language en → 307 para /en e seta cookie", () => {
    const res = proxy(req("/", { "accept-language": "en-US,en;q=0.9" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en");
    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("en");
  });

  it("/ sem cookie e Accept-Language pt → não redireciona e seta cookie pt", () => {
    const res = proxy(req("/", { "accept-language": "pt-BR,pt;q=0.9" }));
    expect(res.headers.get("location")).toBeNull();
    expect(res.cookies.get("NEXT_LOCALE")?.value).toBe("pt");
  });

  it("/ com cookie en → 307 para /en", () => {
    const res = proxy(req("/", { cookie: "NEXT_LOCALE=en" }));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/en");
  });

  it("/posts com cookie pt → sem redirect e com x-pathname", () => {
    const res = proxy(req("/posts", { cookie: "NEXT_LOCALE=pt" }));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-pathname")).toBe("/posts");
  });

  it("/en/posts → sem redirect e com x-pathname", () => {
    const res = proxy(req("/en/posts"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-pathname")).toBe("/en/posts");
  });

  it.each([
    "/sitemap.xml",
    "/rss.xml",
    "/favicon.ico",
    "/_next/static/x.js",
    "/api/track",
  ])("%s → passa direto, sem redirect nem x-pathname", (path) => {
    const res = proxy(req(path));
    expect(res.headers.get("location")).toBeNull();
    expect(res.headers.get("x-pathname")).toBeNull();
  });

  it("matcher preservado", () => {
    expect(config.matcher).toEqual(["/((?!_next|api|.*\\..*).*)"]);
  });
});
