import { describe, expect, it } from "vitest";
import type { Db } from "../gravador";
import {
  AGORA,
  CONTAS,
  METAS,
  POSTS,
  horasAtras,
  run,
} from "./fixtures/painel";
import {
  cadencia,
  carregarPainel,
  metaVigente,
  saudeColeta,
  seriesSeguidores,
  viewsAlcanceSemanais,
} from "./painel";

describe("metaVigente", () => {
  it("semana iniciada em 2026-10-05 usa a meta de 09-01", () => {
    expect(metaVigente(METAS, "youtube", "longo", "2026-10-05")).toBe(1);
  });

  it("semana de 10-12 usa a meta de 10-06", () => {
    expect(metaVigente(METAS, "youtube", "longo", "2026-10-12")).toBe(2);
  });

  it("vigente_desde igual ao início da semana vale", () => {
    expect(metaVigente(METAS, "youtube", "short", "2026-10-12")).toBe(3);
  });

  it("semana anterior a toda meta dá null", () => {
    expect(metaVigente(METAS, "youtube", "longo", "2026-08-24")).toBeNull();
    expect(metaVigente(METAS, "youtube", "short", "2026-10-05")).toBeNull();
  });
});

describe("cadencia", () => {
  const semanas = ["2026-10-05", "2026-10-12"];
  const linhas = cadencia(POSTS, METAS, semanas);
  const linha = (rede: string, tipo: string) =>
    linhas.find((l) => l.rede === rede && l.tipo === tipo);

  it("estatico = imagem + carrossel (2 imagens e 1 carrossel → 3)", () => {
    expect(linha("instagram", "estatico")?.semanas).toEqual([
      { semana: "2026-10-05", feitos: 0, meta: 4 },
      { semana: "2026-10-12", feitos: 3, meta: 4 },
    ]);
  });

  it("imagem e carrossel não aparecem soltos quando há meta de estatico", () => {
    expect(linha("instagram", "imagem")).toBeUndefined();
    expect(linha("instagram", "carrossel")).toBeUndefined();
  });

  it("tipo publicado sem meta aparece com meta null", () => {
    expect(linha("instagram", "reel")?.semanas).toEqual([
      { semana: "2026-10-05", feitos: 0, meta: null },
      { semana: "2026-10-12", feitos: 1, meta: null },
    ]);
  });

  it("agrupa pela semana de Brasília e ignora published_at null", () => {
    expect(linha("youtube", "longo")?.semanas).toEqual([
      { semana: "2026-10-05", feitos: 1, meta: 1 },
      { semana: "2026-10-12", feitos: 1, meta: 2 },
    ]);
    expect(linha("youtube", "short")?.semanas).toEqual([
      { semana: "2026-10-05", feitos: 0, meta: null },
      { semana: "2026-10-12", feitos: 0, meta: 3 },
    ]);
  });

  it("sem meta de estatico, imagem e carrossel contam cada um no seu tipo", () => {
    const so = cadencia(POSTS, [], ["2026-10-12"]);
    const f = (tipo: string) =>
      so.find((l) => l.rede === "instagram" && l.tipo === tipo)?.semanas[0]
        .feitos;
    expect(f("imagem")).toBe(2);
    expect(f("carrossel")).toBe(1);
    expect(so.find((l) => l.tipo === "estatico")).toBeUndefined();
  });

  it("ordena YouTube antes de Instagram", () => {
    expect(linhas.map((l) => `${l.rede}:${l.tipo}`)).toEqual([
      "youtube:longo",
      "youtube:short",
      "instagram:reel",
      "instagram:estatico",
    ]);
  });
});

describe("seriesSeguidores", () => {
  it("cobre 90 dias terminando hoje e mantém null como lacuna", () => {
    const s = seriesSeguidores(CONTAS, "2026-10-14");
    expect(s).toHaveLength(90);
    expect(s[0].dia).toBe("2026-07-17");
    expect(s.at(-1)).toEqual({
      dia: "2026-10-14",
      youtube: 1010,
      instagram: null,
      youtube_calc: null,
      instagram_calc: null,
    });
    expect(s.at(-4)).toEqual({
      dia: "2026-10-11",
      youtube: null,
      instagram: 500,
      youtube_calc: null,
      instagram_calc: null,
    });
  });

  it("dia com real usa só o real; sem real, o reconstruído", () => {
    const s = seriesSeguidores(CONTAS, "2026-10-14");
    // Real e calc no mesmo dia: o calc não aparece.
    expect(s.at(-3)).toMatchObject({
      dia: "2026-10-12",
      youtube: 1000,
      youtube_calc: null,
    });
    // Sem real, com calc.
    expect(s.at(-2)).toMatchObject({
      dia: "2026-10-13",
      youtube: null,
      youtube_calc: 1005,
    });
    // Sem linha nenhuma: os dois null.
    expect(s.at(-5)).toMatchObject({
      dia: "2026-10-10",
      youtube: null,
      youtube_calc: null,
    });
  });
});

describe("viewsAlcanceSemanais", () => {
  it("soma por semana e rede; semana só com null fica null", () => {
    const s = viewsAlcanceSemanais(CONTAS, ["2026-10-05", "2026-10-12"]);
    expect(s).toEqual([
      {
        semana: "2026-10-05",
        views_youtube: null,
        alcance_youtube: null,
        views_instagram: 30,
        alcance_instagram: 20,
      },
      {
        semana: "2026-10-12",
        views_youtube: 150,
        alcance_youtube: null,
        views_instagram: null,
        alcance_instagram: null,
      },
    ]);
  });
});

describe("saudeColeta", () => {
  const item = (runs: Parameters<typeof saudeColeta>[0]) =>
    saudeColeta(runs, AGORA).itens[0];

  it("sucesso há 35h59 → sem aviso", () => {
    const t = horasAtras(35 + 59 / 60);
    expect(
      item([
        run({ rede: "youtube", job: "collect", finished_at: t, started_at: t }),
      ]).aviso,
    ).toBeNull();
  });

  it("sucesso há 36h01 → aviso", () => {
    const t = horasAtras(36 + 1 / 60);
    expect(
      item([
        run({ rede: "youtube", job: "collect", finished_at: t, started_at: t }),
      ]).aviso,
    ).toMatch(/36 h/);
  });

  it("último run falhou mesmo com sucesso há 1 h → aviso", () => {
    const i = item([
      run({ rede: "youtube", job: "collect", finished_at: horasAtras(1) }),
      run({
        rede: "youtube",
        job: "collect",
        started_at: horasAtras(0.5),
        finished_at: horasAtras(0.4),
        ok: false,
        erro: "quota",
      }),
    ]);
    expect(i.ok).toBe(false);
    expect(i.aviso).toMatch(/falhou/);
    expect(i.aviso).toContain("quota");
  });

  it("ordena por finished_at com fallback em started_at", () => {
    const i = item([
      run({
        rede: "youtube",
        job: "collect",
        started_at: horasAtras(0.2),
        finished_at: null,
        ok: null,
      }),
      run({
        rede: "youtube",
        job: "collect",
        finished_at: horasAtras(2),
        ok: false,
        erro: "x",
      }),
      run({ rede: "youtube", job: "collect", finished_at: horasAtras(3) }),
    ]);
    // O run em andamento (sem finished_at) é o mais recente: não conta falha.
    expect(i.ok).toBeNull();
    expect(i.aviso).toBeNull();
  });

  it("job esporádico antigo e ok não avisa; falho avisa", () => {
    const antigo = horasAtras(24 * 20);
    const s = saudeColeta(
      [
        run({
          rede: "youtube",
          job: "backfill",
          finished_at: antigo,
          started_at: antigo,
        }),
        run({ rede: null, job: "sync_pecas", ok: false, erro: "parse" }),
      ],
      AGORA,
    );
    expect(s.itens.find((i) => i.job === "backfill")?.aviso).toBeNull();
    expect(s.itens.find((i) => i.job === "sync_pecas")?.aviso).toMatch(
      /falhou/,
    );
  });

  it("sem nenhum run → aviso de coleta que ainda não rodou", () => {
    const s = saudeColeta([], AGORA);
    expect(s.itens).toEqual([]);
    expect(s.aviso).toMatch(/ainda não rodou/);
  });
});

describe("carregarPainel", () => {
  function dbFalso(rows: Record<string, unknown[]> = {}) {
    const queries: { text: string; params: unknown[] }[] = [];
    const db: Db = {
      async query<T>(text: string, params: unknown[] = []) {
        queries.push({ text, params });
        const tabela = text.match(/public\.(\w+)/)?.[1] ?? "";
        return { rows: (rows[tabela] ?? []) as T[] };
      },
    };
    return { db, queries };
  }

  it("só emite SELECT, com filtro de data parametrizado", async () => {
    const { db, queries } = dbFalso();
    await carregarPainel(db, AGORA);
    expect(queries.length).toBeGreaterThan(0);
    for (const q of queries) {
      expect(q.text.trim()).toMatch(/^select\b/i);
      expect(q.text).not.toContain(";");
      expect(q.text).not.toMatch(/'\d{4}-\d{2}-\d{2}/);
    }
    const posts = queries.find((q) => q.text.includes("vitor_social_posts"));
    expect(posts?.text).toMatch(/published_at >= \$1/);
    expect(posts?.params).toHaveLength(1);
    const contas = queries.find((q) =>
      q.text.includes("vitor_social_account_daily"),
    );
    expect(contas?.text).toMatch(/dia >= \$1/);
    expect(contas?.text).toContain(
      "(extra->>'seguidores_calc')::float8 as seguidores_calc",
    );
    expect(contas?.params).toEqual(["2026-07-17"]);
  });

  it("tudo vazio → { vazio: true } sem lançar", async () => {
    const { db } = dbFalso();
    const p = await carregarPainel(db, AGORA);
    expect(p.vazio).toBe(true);
    expect(p.semanas).toHaveLength(9);
    expect(p.semanas.at(-1)).toBe("2026-10-12");
  });

  it("com dados monta os quatro blocos", async () => {
    const { db } = dbFalso({
      vitor_social_posts: POSTS,
      vitor_social_account_daily: CONTAS,
      vitor_social_goals: METAS,
      vitor_social_collect_runs: [run({ rede: "youtube", job: "collect" })],
    });
    const p = await carregarPainel(db, AGORA);
    expect(p.vazio).toBe(false);
    expect(p.hoje).toBe("2026-10-14");
    expect(p.seguidores).toHaveLength(90);
    expect(p.semanal).toHaveLength(9);
    expect(
      p.cadencia.find((l) => l.tipo === "estatico")?.semanas.at(-1)?.feitos,
    ).toBe(3);
    expect(p.saude.itens[0].aviso).toBeNull();
  });
});
