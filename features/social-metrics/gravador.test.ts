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

  it("grava run sem rede para o job sync_pecas", async () => {
    const db = criarFakeDb();
    const g = criarGravador(db);
    const id = await g.iniciarRun(null, "sync_pecas");
    await g.finalizarRun(id, { ok: true, erro: null, linhas: 1 });
    expect(db.tabelas.get("vitor_social_collect_runs")![0]).toMatchObject({
      rede: null,
      job: "sync_pecas",
      ok: true,
      linhas: 1,
    });
  });

  describe("recalcularSeguidores", () => {
    const dia = (
      d: string,
      extra: Record<string, unknown>,
      seguidores: number | null = null,
      views_dia: number | null = 7,
    ): ContaDiaria => ({
      rede: "youtube",
      dia: d,
      seguidores,
      views_dia,
      alcance_dia: null,
      extra,
    });

    async function semear() {
      const db = criarFakeDb();
      const g = criarGravador(db);
      await g.upsertConta([
        dia("2026-10-09", { subs_gained: 2, subs_lost: 0 }),
        dia("2026-10-10", { subs_gained: 1, subs_lost: 1 }),
        dia("2026-10-11", { subs_gained: 3, subs_lost: 0 }),
        dia("2026-10-14", {}, 100),
        // Outra rede não entra na série do YouTube.
        { ...dia("2026-10-11", {}, 5), rede: "instagram" },
      ]);
      return { db, g };
    }

    const linhaDe = (db: ReturnType<typeof criarFakeDb>, d: string) =>
      db.tabelas
        .get("vitor_social_account_daily")!
        .find((l) => l.rede === "youtube" && l.dia === d)!;

    it("grava extra.seguidores_calc nos dias reconstruídos", async () => {
      const { db, g } = await semear();
      expect(await g.recalcularSeguidores("youtube")).toBe(3);

      expect(linhaDe(db, "2026-10-11").extra).toEqual({
        subs_gained: 3,
        subs_lost: 0,
        seguidores_calc: 100,
      });
      expect(linhaDe(db, "2026-10-10").extra).toMatchObject({
        seguidores_calc: 97,
      });
      expect(linhaDe(db, "2026-10-09").extra).toMatchObject({
        seguidores_calc: 97,
      });
      // Dia da âncora: depois do último Analytics, sem calc.
      expect(linhaDe(db, "2026-10-14").extra).toEqual({});
    });

    it("não toca em seguidores nem em views_dia", async () => {
      const { db, g } = await semear();
      const antes = structuredClone(
        db.tabelas.get("vitor_social_account_daily")!,
      );
      db.queries.length = 0;
      await g.recalcularSeguidores("youtube");

      const depois = db.tabelas.get("vitor_social_account_daily")!;
      expect(depois.map((l) => [l.seguidores, l.views_dia])).toEqual(
        antes.map((l) => [l.seguidores, l.views_dia]),
      );
      // A coluna real nunca recebe valor calculado: nenhum `set seguidores`.
      const updates = db.queries.filter((q) => /^\s*update/i.test(q.text));
      expect(updates.length).toBeGreaterThan(0);
      for (const { text } of updates) {
        expect(text).toMatch(/set extra = /);
        expect(text).not.toMatch(/\bseguidores\s*=/);
        expect(text).not.toMatch(/views_dia/);
      }
    });

    it("tira a chave dos dias que saíram da série", async () => {
      const { db, g } = await semear();
      await g.recalcularSeguidores("youtube");
      // O dia 10 perde o Analytics e fica com o calc velho: a série para no 11.
      linhaDe(db, "2026-10-10").extra = {
        seguidores_calc: 97,
      };
      await g.recalcularSeguidores("youtube");

      expect(linhaDe(db, "2026-10-11").extra).toMatchObject({
        seguidores_calc: 100,
      });
      expect(linhaDe(db, "2026-10-10").extra).toEqual({});
      expect(linhaDe(db, "2026-10-09").extra).toEqual({
        subs_gained: 2,
        subs_lost: 0,
      });
    });

    it("segunda passada sem mudança não emite update", async () => {
      const { db, g } = await semear();
      await g.recalcularSeguidores("youtube");
      db.queries.length = 0;
      expect(await g.recalcularSeguidores("youtube")).toBe(0);
      expect(db.queries.every((q) => /^\s*select/i.test(q.text))).toBe(true);
    });
  });

  describe("sync de peças", () => {
    const CAMPOS = {
      peca_slug: "2026-10-11-meu-video",
      pauta: "pauta",
      formato: "talking-head",
      hook: "um hook",
      template: "T1",
      testa: "gancho",
    };

    it("atualiza só o post (rede, external_id) e devolve true", async () => {
      const db = criarFakeDb();
      const g = criarGravador(db);
      await g.upsertPosts([
        POST,
        { ...POST, external_id: "outroAAAAA22" },
        { ...POST, rede: "instagram" },
      ]);
      expect(
        await g.atualizarPecaDoPost("youtube", "novoAAAAAA1", CAMPOS),
      ).toBe(true);
      const posts = db.tabelas.get("vitor_social_posts")!;
      expect(posts[0]).toMatchObject(CAMPOS);
      expect(posts[1].peca_slug).toBeUndefined();
      expect(posts[2].peca_slug).toBeUndefined();
    });

    it("post não coletado: devolve false e não insere", async () => {
      const db = criarFakeDb();
      const g = criarGravador(db);
      expect(
        await g.atualizarPecaDoPost("youtube", "naoExiste01", CAMPOS),
      ).toBe(false);
      expect(db.tabelas.get("vitor_social_posts") ?? []).toHaveLength(0);
      expect(db.queries.every((q) => !/insert/i.test(q.text))).toBe(true);
    });

    it("upsertMeta atualiza por_semana na mesma chave", async () => {
      const db = criarFakeDb();
      const g = criarGravador(db);
      const m = {
        rede: "youtube" as const,
        tipo: "short" as const,
        por_semana: 3,
        vigente_desde: "2026-10-01",
      };
      await g.upsertMeta(m);
      await g.upsertMeta({ ...m, por_semana: 5 });
      const gs = db.tabelas.get("vitor_social_goals")!;
      expect(gs).toHaveLength(1);
      expect(gs[0].por_semana).toBe(5);
      expect(db.queries[0].text).toContain(
        "on conflict (rede, tipo, vigente_desde) do update",
      );
    });

    it("listarPostsSemPeca devolve só posts com peca_slug nulo", async () => {
      const db = criarFakeDb();
      const g = criarGravador(db);
      await g.upsertPosts([POST, { ...POST, external_id: "outroAAAAA22" }]);
      await g.atualizarPecaDoPost("youtube", "novoAAAAAA1", CAMPOS);
      const sem = await g.listarPostsSemPeca();
      expect(sem.map((p) => p.external_id)).toEqual(["outroAAAAA22"]);
    });

    it("não há operação de DELETE e o fake recusa o SQL", async () => {
      const g = criarGravador(criarFakeDb());
      expect(Object.keys(g).some((k) => /delet|remov|apag/i.test(k))).toBe(
        false,
      );
      await expect(criarFakeDb().query("delete from public.x")).rejects.toThrow(
        /DELETE/,
      );
    });
  });
});
