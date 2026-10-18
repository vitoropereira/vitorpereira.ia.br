import { describe, expect, it, vi } from "vitest";
import {
  codigoDeSaida,
  descreverErro,
  executarColeta,
  INICIO_BACKFILL,
} from "./executar";
import { criarFakeDb } from "./fakeDb";
import { criarGravador } from "./gravador";
import type { ColetaPosts, Fetch, SocialAdapter } from "./types";
import { criarAdapterYouTube } from "./youtube/adapter";

const DIA = "2026-10-14";

function adapterFixo(
  over: Partial<ColetaPosts> = {},
): SocialAdapter & { coletarPosts: ReturnType<typeof vi.fn> } {
  return {
    rede: "youtube",
    coletarConta: vi.fn(async (dia: string) => ({
      contas: [
        {
          rede: "youtube" as const,
          dia,
          seguidores: 10,
          views_dia: 5,
          alcance_dia: null,
          extra: {},
        },
      ],
      avisos: [],
    })),
    coletarPosts: vi.fn(async () => ({
      posts: [
        {
          rede: "youtube" as const,
          external_id: "v1",
          url: null,
          published_at: null,
          titulo: null,
          tipo: null,
        },
      ],
      metricas: [
        {
          external_id: "v1",
          dia: DIA,
          views: 1,
          likes: null,
          comments: null,
          shares: null,
          saves: null,
          reach: null,
          impressions: null,
          subs_gained: null,
          ctr: null,
          avg_view_pct: null,
          watch_time_min: null,
          extra: {},
        },
      ],
      avisos: [],
      ...over,
    })),
  };
}

const runs = (db: ReturnType<typeof criarFakeDb>) =>
  db.tabelas.get("vitor_social_collect_runs") ?? [];

describe("executarColeta", () => {
  it("sucesso abre e fecha o run com ok e linhas", async () => {
    const db = criarFakeDb();
    const adapter = adapterFixo();
    const r = await executarColeta({
      rede: "youtube",
      job: "collect",
      adapter,
      gravador: criarGravador(db),
      dia: DIA,
    });

    expect(r).toEqual({
      rede: "youtube",
      job: "collect",
      ok: true,
      erro: null,
      linhas: 3,
    });
    expect(runs(db)).toHaveLength(1);
    expect(runs(db)[0]).toMatchObject({ ok: true, erro: null, linhas: 3 });
    // Collect reprocessa os últimos 4 dias.
    expect(adapter.coletarPosts).toHaveBeenCalledWith("2026-10-11", "collect");
  });

  it("erro de rede grava o run com ok = false", async () => {
    const db = criarFakeDb();
    const fetch = vi.fn<Fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    const r = await executarColeta({
      rede: "youtube",
      job: "collect",
      adapter: criarAdapterYouTube({ fetch, accessToken: "tok", hoje: DIA }),
      gravador: criarGravador(db),
      dia: DIA,
    });

    expect(r.ok).toBe(false);
    expect(r.erro).toContain("fetch failed");
    expect(runs(db)[0]).toMatchObject({ ok: false, linhas: 0 });
    expect(runs(db)[0].erro).toContain("fetch failed");
    expect(runs(db)[0].finished_at).toBeInstanceOf(Date);
    expect(codigoDeSaida([r])).toBe(1);
  });

  it("aviso de impressão mantém ok = true e vai para erro", async () => {
    const db = criarFakeDb();
    const r = await executarColeta({
      rede: "youtube",
      job: "collect",
      adapter: adapterFixo({
        avisos: [
          "alcance indisponível (Reporting API): YouTube Reporting HTTP 403",
        ],
      }),
      gravador: criarGravador(db),
      dia: DIA,
    });
    expect(r.ok).toBe(true);
    expect(r.erro).toMatch(/^aviso: alcance indisponível/);
    expect(runs(db)[0]).toMatchObject({ ok: true });
  });

  it("escrita não autorizada (42501) falha o run e a CLI", async () => {
    const negado = Object.assign(
      new Error("permission denied for table vitor_social_posts"),
      { code: "42501" },
    );
    const db = criarFakeDb({
      erroEm: (text) =>
        text.startsWith("insert into public.vitor_social_posts")
          ? negado
          : undefined,
    });
    const r = await executarColeta({
      rede: "youtube",
      job: "collect",
      adapter: adapterFixo(),
      gravador: criarGravador(db),
      dia: DIA,
    });

    expect(r.ok).toBe(false);
    expect(r.erro).toContain("42501");
    expect(runs(db)[0]).toMatchObject({ ok: false });
    expect(runs(db)[0].erro).toContain("42501");
    expect(codigoDeSaida([r])).not.toBe(0);
  });

  it("run que nem abre devolve ok = false sem lançar", async () => {
    const db = criarFakeDb({
      erroEm: () => new Error("connection refused"),
    });
    const r = await executarColeta({
      rede: "youtube",
      job: "collect",
      adapter: adapterFixo(),
      gravador: criarGravador(db),
      dia: DIA,
    });
    expect(r.ok).toBe(false);
    expect(r.erro).toContain("connection refused");
  });

  it("backfill pede tudo desde o início e marca o job", async () => {
    const db = criarFakeDb();
    const adapter = adapterFixo();
    await executarColeta({
      rede: "youtube",
      job: "backfill",
      adapter,
      gravador: criarGravador(db),
      dia: DIA,
    });
    expect(adapter.coletarPosts).toHaveBeenCalledWith(
      INICIO_BACKFILL,
      "backfill",
    );
    expect(runs(db)[0].job).toBe("backfill");
    expect(adapter.coletarConta).toHaveBeenCalledWith(DIA, "backfill");
  });

  it.each(["collect", "backfill"] as const)(
    "%s recalcula a série de seguidores depois de gravar a conta",
    async (job) => {
      const db = criarFakeDb();
      const adapter = adapterFixo();
      await executarColeta({
        rede: "youtube",
        job,
        adapter,
        gravador: criarGravador(db),
        dia: DIA,
      });
      expect(adapter.coletarConta).toHaveBeenCalledWith(DIA, job);

      const textos = db.queries.map((q) => q.text);
      const conta = textos.findIndex((t) =>
        t.startsWith("insert into public.vitor_social_account_daily"),
      );
      const serie = textos.findIndex((t) =>
        /^select .* from public\.vitor_social_account_daily/s.test(t),
      );
      expect(conta).toBeGreaterThanOrEqual(0);
      expect(serie).toBeGreaterThan(conta);
      expect(db.queries[serie].params).toEqual(["youtube"]);
    },
  );

  it("falha no recálculo de seguidores fecha o run com ok = false", async () => {
    const db = criarFakeDb({
      erroEm: (text) =>
        /^select .* from public\.vitor_social_account_daily/s.test(text)
          ? new Error("statement timeout")
          : undefined,
    });
    const r = await executarColeta({
      rede: "youtube",
      job: "collect",
      adapter: adapterFixo(),
      gravador: criarGravador(db),
      dia: DIA,
    });
    expect(r.ok).toBe(false);
    expect(r.erro).toContain("statement timeout");
    expect(runs(db)[0]).toMatchObject({ ok: false });
  });
});

describe("codigoDeSaida", () => {
  it("só sai com 0 se todas as redes deram certo", () => {
    const base = { rede: "youtube" as const, job: "collect" as const };
    expect(codigoDeSaida([{ ...base, ok: true, erro: null, linhas: 1 }])).toBe(
      0,
    );
    expect(
      codigoDeSaida([
        { ...base, ok: true, erro: null, linhas: 1 },
        { ...base, rede: "instagram", ok: false, erro: "x", linhas: 0 },
      ]),
    ).toBe(1);
  });
});

describe("descreverErro", () => {
  it("prefixa o código do Postgres quando existe", () => {
    expect(
      descreverErro(Object.assign(new Error("m"), { code: "23505" })),
    ).toBe("23505: m");
    expect(descreverErro("texto")).toBe("texto");
  });
});
