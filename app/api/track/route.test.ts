import { describe, it, expect } from "vitest";
import { GET } from "./route";

function req(qs: string): Request {
  return new Request(`https://vitorpereira.ia.br/api/track${qs}`);
}

describe("GET /api/track", () => {
  it("destino válido → 302 com UTM (sem env, não loga)", async () => {
    const to = encodeURIComponent("https://vitorpereira.ia.br/2026/05/31/ancora");
    const res = await GET(req(`?to=${to}&f=summary`));
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc).toContain("vitorpereira.ia.br/2026/05/31/ancora");
    expect(loc).toContain("utm_content=summary");
  });

  it("open-redirect externo → volta pro site, NÃO pro destino", async () => {
    const res = await GET(req(`?to=${encodeURIComponent("https://evil.com/phish")}`));
    expect(res.status).toBe(302);
    expect(res.headers.get("location") ?? "").toContain("vitorpereira.ia.br");
    expect(res.headers.get("location") ?? "").not.toContain("evil.com");
  });

  it("sem 'to' → volta pro site", async () => {
    const res = await GET(req(""));
    expect(res.headers.get("location") ?? "").toContain("vitorpereira.ia.br");
  });
});
