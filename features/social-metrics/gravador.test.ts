import { describe, expect, it } from "vitest";
import { criarFakeDb } from "./fakeDb";
import { criarGravador } from "./gravador";
import type { ContaDiaria, MetricaDiaria, PostNormalizado } from "./types";

const POST: PostNormalizado = {
  rede: "youtube",
  external_id: "novoAAAAAA1",
  url: "https://www.youtube.com/watch?v=novoAAAAAA1",
  published_at: "2026-10-01T15:00:00Z",
  titulo: "Vídeo",
  tipo: "short",
};

function metrica(over: Partial<MetricaDiaria> = {}): MetricaDiaria {
  return {
    external_id: "novoAAAAAA1",
    dia: "2026-10-13",
    views: 10,
    likes: 2,
    comments: 1,
    shares: null,
    saves: null,
    reach: null,
    impressions: 100,
    subs_gained: 0,
    ctr: 3.1,
    avg_view_pct: 40,
    watch_time_min: 20,
    extra: { trafego: { YT_SEARCH: 10 } },
    ...over,
  };
}

const CONTA: ContaDiaria = {
  rede: "youtube",
  dia: "2026-10-14",
  seguidores: 321,
  views_dia: 50,
  alcance_dia: null,
  extra: { subs_gained: 1 },
};

describe("criarGravador", () => {
  it("upsert repetido não duplica linha e atualiza os valores", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);

    for (const views of [10, 15]) {
      const ids = await g.upsertPosts([POST]);
      await g.upsertMetricas(ids, [metrica({ views })]);
      await g.upsertConta([{ ...CONTA, views_dia: views }]);
    }

    expect(db.tabelas.get("vitor_social_posts")).toHaveLength(1);
    const ms = db.tabelas.get("vitor_social_post_metrics")!;
    expect(ms).toHaveLength(1);
    expect(ms[0].views).toBe(15);
    const cs = db.tabelas.get("vitor_social_account_daily")!;
    expect(cs).toHaveLength(1);
    expect(cs[0].views_dia).toBe(15);
  });

  it("liga a métrica ao id devolvido pelo upsert do post", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const ids = await g.upsertPosts([POST]);
    await g.upsertMetricas(ids, [metrica()]);
    const post = db.tabelas.get("vitor_social_posts")![0];
    expect(db.tabelas.get("vitor_social_post_metrics")![0].post_id).toBe(
      post.id,
    );
  });

  it("null de 'não coletado agora' preserva o valor gravado", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const ids = await g.upsertPosts([POST]);
    await g.upsertMetricas(ids, [metrica()]);
    await g.upsertConta([CONTA]);

    // Reprocessamento do dia no dia seguinte: sem likes/comments/seguidores,
    // com impressões recusadas e views do Analytics corrigidas.
    await g.upsertMetricas(ids, [
      metrica({
        views: 12,
        likes: null,
        comments: null,
        impressions: null,
        ctr: null,
        extra: { trafego: { YT_SEARCH: 12 } },
      }),
    ]);
    await g.upsertConta([{ ...CONTA, seguidores: null, views_dia: 55 }]);

    const m = db.tabelas.get("vitor_social_post_metrics")![0];
    expect(m).toMatchObject({
      views: 12,
      likes: 2,
      comments: 1,
      impressions: 100,
      ctr: 3.1,
      extra: { trafego: { YT_SEARCH: 12 } },
    });
    const c = db.tabelas.get("vitor_social_account_daily")![0];
    expect(c).toMatchObject({ seguidores: 321, views_dia: 55 });
  });

  it("métrica do Analytics: o valor novo vence, mesmo null", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const ids = await g.upsertPosts([POST]);
    await g.upsertMetricas(ids, [metrica()]);
    await g.upsertMetricas(ids, [metrica({ avg_view_pct: null })]);
    expect(db.tabelas.get("vitor_social_post_metrics")![0].avg_view_pct).toBe(
      null,
    );
  });

  it("abre e fecha o run", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const id = await g.iniciarRun("youtube", "collect");
    await g.finalizarRun(id, { ok: false, erro: "boom", linhas: 3 });
    const run = db.tabelas.get("vitor_social_collect_runs")![0];
    expect(run).toMatchObject({
      rede: "youtube",
      job: "collect",
      ok: false,
      erro: "boom",
      linhas: 3,
    });
    expect(run.finished_at).toBeInstanceOf(Date);
  });

  it("trava as chaves do ON CONFLICT", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const ids = await g.upsertPosts([POST]);
    await g.upsertMetricas(ids, [metrica()]);
    await g.upsertConta([CONTA]);
    const textos = db.queries.map((q) => q.text);
    expect(textos[0]).toContain("on conflict (rede, external_id) do update");
    expect(textos[1]).toContain("on conflict (post_id, dia) do update");
    expect(textos[2]).toContain("on conflict (rede, dia) do update");
  });

  it("nunca emite delete nem truncate, e tudo vai por parâmetro", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const id = await g.iniciarRun("youtube", "collect");
    const ids = await g.upsertPosts([{ ...POST, titulo: "x'); drop table" }]);
    await g.upsertMetricas(ids, [metrica()]);
    await g.upsertConta([CONTA]);
    await g.finalizarRun(id, { ok: true, erro: null, linhas: 2 });

    for (const { text } of db.queries) {
      expect(text).not.toMatch(/\b(delete|truncate)\b/i);
      expect(text).not.toContain("drop table");
      expect(text).not.toContain("novoAAAAAA1");
    }
  });

  it("métrica sem post gravado é erro, não linha órfã", async () => {
    const g = criarGravador(criarFakeDb());
    await expect(g.upsertMetricas(new Map(), [metrica()])).rejects.toThrow(
      /novoAAAAAA1/,
    );
  });
});
