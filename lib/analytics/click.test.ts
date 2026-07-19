import { describe, it, expect, vi } from "vitest";
import {
  resolveTrackRedirect,
  permalinkFromCanonical,
  deviceFromUA,
  hashUA,
  buildClickPayload,
  logClick,
  isLikelyBot,
} from "./click.ts";

describe("resolveTrackRedirect (anti open-redirect)", () => {
  it("aceita destino no nosso domínio e injeta UTM", () => {
    const out = resolveTrackRedirect("https://vitorpereira.ia.br/2026/05/31/ancora", "summary");
    expect(out).toContain("https://vitorpereira.ia.br/2026/05/31/ancora");
    expect(out).toContain("utm_source=tabnews");
    expect(out).toContain("utm_content=summary");
  });
  it("REJEITA domínio externo (open-redirect)", () => {
    expect(resolveTrackRedirect("https://evil.com/phish", "summary")).toBeNull();
    expect(resolveTrackRedirect("https://vitorpereira.ia.br.evil.com/x", null)).toBeNull();
  });
  it("REJEITA lixo / esquemas não-URL", () => {
    expect(resolveTrackRedirect("javascript:alert(1)", null)).toBeNull();
    expect(resolveTrackRedirect("not a url", null)).toBeNull();
    expect(resolveTrackRedirect("", null)).toBeNull();
  });
  it("sem format não injeta utm_content", () => {
    expect(resolveTrackRedirect("https://vitorpereira.ia.br/x", null)).not.toContain("utm_content");
  });
});

describe("helpers puros", () => {
  it("permalinkFromCanonical extrai o path", () => {
    expect(permalinkFromCanonical("https://vitorpereira.ia.br/2026/05/31/ancora")).toBe("/2026/05/31/ancora");
    expect(permalinkFromCanonical("lixo")).toBe("");
  });
  it("deviceFromUA classifica", () => {
    expect(deviceFromUA("Mozilla/5.0 (iPhone…)")).toBe("mobile");
    expect(deviceFromUA("Mozilla/5.0 (Macintosh…)")).toBe("desktop");
  });
  it("hashUA é determinístico e não guarda o UA cru", () => {
    const ua = "Mozilla/5.0 (Macintosh)";
    expect(hashUA(ua)).toBe(hashUA(ua));
    expect(hashUA(ua)).not.toContain("Mozilla");
  });
  it("isLikelyBot pega unfurlers e crawlers, deixa navegador passar", () => {
    expect(isLikelyBot("")).toBe(true);
    expect(isLikelyBot("WhatsApp/2.23")).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1")).toBe(true);
    expect(isLikelyBot("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isLikelyBot("Twitterbot/1.0")).toBe(true);
    expect(isLikelyBot("curl/8.0")).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 (Macintosh) Safari/605")).toBe(false);
    expect(isLikelyBot("Mozilla/5.0 (iPhone) Mobile/15E148")).toBe(false);
  });
  it("buildClickPayload monta o registro", () => {
    const p = buildClickPayload("https://vitorpereira.ia.br/x", "summary", {
      userAgent: "iPhone",
      referrer: "https://www.tabnews.com.br/",
      country: "BR",
    });
    expect(p).toMatchObject({ post_permalink: "/x", format: "summary", country: "BR", device: "mobile" });
    expect(p.ua_hash).toBeTruthy();
  });
});

describe("logClick (gated na env)", () => {
  const payload = { post_permalink: "/x", format: "summary", referrer: null, country: "BR", device: "desktop", ua_hash: "abc" };
  it("sem env → no-op (não chama fetch), devolve false", async () => {
    const fetch = vi.fn();
    expect(await logClick(payload, { fetch, env: {} as never })).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("com env → POSTa com service_role e devolve true", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    const env = { NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc" } as never;
    expect(await logClick(payload, { fetch, env })).toBe(true);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://p.supabase.co/rest/v1/vitor_syndication_clicks");
    expect(init.headers.apikey).toBe("svc");
    expect(JSON.parse(init.body).post_permalink).toBe("/x");
  });
  it("fetch falha → false, nunca lança", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("down"));
    const env = { NEXT_PUBLIC_SUPABASE_URL: "https://p.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "svc" } as never;
    expect(await logClick(payload, { fetch, env })).toBe(false);
  });
});
