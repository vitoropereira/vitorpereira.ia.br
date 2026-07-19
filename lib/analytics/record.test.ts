import { describe, it, expect, vi } from "vitest";
import { recordSyndication, snapshotMetrics, getSyndicationsWithStats } from "./record.ts";

const config = { token: "t", ref: "r" };
function fetchReturning(body: unknown) {
  return vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}
const rec = {
  postPermalink: "/2026/05/31/ancora",
  canonicalUrl: "https://vitorpereira.ia.br/2026/05/31/ancora",
  target: "tabnews",
  externalUrl: "https://www.tabnews.com.br/vitorpereirasaas/ancora",
  externalSlug: "ancora",
  format: "summary",
  status: "published",
  title: "Título com 'aspas'",
  summaryCharCount: 1234,
  tags: ["agentes", "ia-aplicada"],
};

describe("recordSyndication", () => {
  it("faz upsert e devolve o id; escapa o título", async () => {
    const fetch = fetchReturning([{ id: "abc-123" }]);
    const id = await recordSyndication(rec, { fetch, config });
    expect(id).toBe("abc-123");
    const sql = JSON.parse(fetch.mock.calls[0][1].body).query;
    expect(sql).toContain("insert into public.vitor_syndications");
    expect(sql).toContain("on conflict (post_permalink, target) do update");
    expect(sql).toContain("'Título com ''aspas'''"); // apóstrofo escapado
    expect(sql).toContain("array['agentes','ia-aplicada']::text[]");
  });
});

describe("snapshotMetrics", () => {
  it("insere snapshot com tabcoins/comentários", async () => {
    const fetch = fetchReturning([]);
    await snapshotMetrics("syn-1", 7, 3, { fetch, config });
    const sql = JSON.parse(fetch.mock.calls[0][1].body).query;
    expect(sql).toContain("insert into public.vitor_syndication_metrics");
    expect(sql).toContain("'syn-1'");
    expect(sql).toContain("7");
    expect(sql).toContain("3");
  });
  it("aceita métricas nulas", async () => {
    const fetch = fetchReturning([]);
    await snapshotMetrics("syn-1", null, null, { fetch, config });
    const sql = JSON.parse(fetch.mock.calls[0][1].body).query;
    expect(sql).toContain("'syn-1', null, null");
  });
});

describe("getSyndicationsWithStats", () => {
  it("devolve as linhas do join", async () => {
    const rows = [{ id: "1", post_permalink: "/x", format: "summary", clicks: 5, tabcoins: 2 }];
    const fetch = fetchReturning(rows);
    const out = await getSyndicationsWithStats({ fetch, config });
    expect(out).toEqual(rows);
    const sql = JSON.parse(fetch.mock.calls[0][1].body).query;
    expect(sql).toContain("from public.vitor_syndications s");
    expect(sql).toContain("vitor_syndication_clicks");
  });
});
