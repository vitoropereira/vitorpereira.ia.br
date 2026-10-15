import { describe, expect, it, vi } from "vitest";
import { AGORA, METRICAS, POSTS } from "./fixtures/pecas";
import {
  carregarPeca,
  carregarPecas,
  montarLinhas,
  parseFiltros,
  ranking,
  type LinhaRanking,
} from "./pecas";
import { assertSomenteLeitura } from "./readerDb";

const HOJE = "2026-10-14";
const linhas = () => montarLinhas(POSTS, METRICAS, HOJE);
const porId = (ls: LinhaRanking[]) => ls.map((l) => l.id);

describe("montarLinhas", () => {
  it("calcula D+N, total e idade por post", () => {
    const [a, b, c] = linhas();
    expect(a).toMatchObject({ d1: 20, d7: 80, total: 5081 });
    expect(b).toMatchObject({ d1: 400, d7: 1600, total: 1603, idade: 13 });
    expect(c).toMatchObject({ d1: 120, d7: null, d30: null, total: 120 });
    expect(c.idade).toBe(3);
  });

  it("likes, saves, CTR e retenção vêm da última linha não-null de cada coluna", () => {
    const [a, b, c] = linhas();
    expect(a).toMatchObject({ likes: 300, ctr: 4.2, retencao: 38 });
    expect(b).toMatchObject({ likes: 40, saves: 2, ctr: 6.1, retencao: null });
    expect(c).toMatchObject({ likes: null, saves: 12 });
  });

  it("post sem nenhuma métrica fica com tudo null, não zero", () => {
    const [a] = montarLinhas(POSTS.slice(0, 1), [], HOJE);
    expect(a).toMatchObject({ d1: null, d7: null, total: null, likes: null });
  });
});

describe("ranking", () => {
  it("por D+7 o post novo vence o antigo de total maior (nunca pelo acumulado)", () => {
    expect(porId(ranking(linhas(), "d7", "desc")).slice(0, 2)).toEqual([
      "b",
      "a",
    ]);
    // Contraprova: pelo total a ordem se inverte, então o teste acima só passa
    // se a ordenação usar mesmo a coluna D+7.
    expect(porId(ranking(linhas(), "total", "desc")).slice(0, 2)).toEqual([
      "a",
      "b",
    ]);
  });

  it("null vai para o fim, em asc e em desc", () => {
    expect(porId(ranking(linhas(), "d7", "desc"))).toEqual(["b", "a", "c"]);
    expect(porId(ranking(linhas(), "d7", "asc"))).toEqual(["a", "b", "c"]);
  });

  it("ordena pela data de publicação", () => {
    expect(porId(ranking(linhas(), "publicado", "desc"))).toEqual([
      "c",
      "b",
      "a",
    ]);
  });
});

describe("parseFiltros", () => {
  it("sem parâmetro: tudo livre, D+7 desc", () => {
    expect(parseFiltros({})).toEqual({
      rede: null,
      tipo: null,
      formato: null,
      pauta: null,
      template: null,
      de: null,
      ate: null,
      ordem: "d7",
      dir: "desc",
    });
  });

  it("aceita só rede, tipo, ordem e data conhecidos", () => {
    const f = parseFiltros({
      rede: "tiktok",
      tipo: "story",
      ordem: "views; drop table",
      dir: "lado",
      de: "ontem",
      ate: "2026-10-14",
    });
    expect(f).toMatchObject({
      rede: null,
      tipo: null,
      ordem: "d7",
      dir: "desc",
      de: null,
      ate: "2026-10-14",
    });
  });

  it("lê valores válidos e ignora array repetido", () => {
    expect(
      parseFiltros({
        rede: "instagram",
        tipo: "reel",
        formato: ["tutorial", "outro"],
        pauta: "  agentes ",
        ordem: "d30",
        dir: "asc",
      }),
    ).toMatchObject({
      rede: "instagram",
      tipo: "reel",
      formato: "tutorial",
      pauta: "agentes",
      ordem: "d30",
      dir: "asc",
    });
  });
});

function dbFake() {
  const sqls: { sql: string; params?: unknown[] }[] = [];
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    sqls.push({ sql, params });
    if (sql.includes("vitor_social_post_metrics")) {
      const ids = (params?.[0] as string[]) ?? [];
      return { rows: METRICAS.filter((m) => ids.includes(m.post_id)) };
    }
    if (sql.includes("peca_slug = $1")) {
      return { rows: POSTS.filter((p) => p.peca_slug === params?.[0]) };
    }
    if (sql.includes("pauta = $1")) {
      return {
        rows: POSTS.filter(
          (p) => p.pauta === params?.[0] && p.peca_slug !== params?.[1],
        ),
      };
    }
    if (sql.includes("distinct")) return { rows: [] };
    return { rows: POSTS };
  });
  return { db: { query } as never, sqls };
}

describe("carregarPecas / carregarPeca", () => {
  it("filtro vira parâmetro, nunca texto no SQL", async () => {
    const { db, sqls } = dbFake();
    await carregarPecas(
      db,
      parseFiltros({ rede: "youtube", pauta: "x' or 1=1 --" }),
      AGORA,
    );
    const posts = sqls.find(
      (s) =>
        s.sql.includes("from public.vitor_social_posts") && s.params?.length,
    );
    expect(posts?.sql).not.toContain("1=1");
    expect(posts?.params).toEqual(["youtube", "x' or 1=1 --"]);
    for (const s of sqls)
      expect(() => assertSomenteLeitura(s.sql)).not.toThrow();
  });

  it("sem post não consulta métricas", async () => {
    const query = vi.fn<(sql: string) => Promise<{ rows: never[] }>>(
      async () => ({ rows: [] }),
    );
    const r = await carregarPecas({ query } as never, parseFiltros({}), AGORA);
    expect(r.linhas).toEqual([]);
    expect(
      query.mock.calls.some((c) =>
        String(c[0]).includes("vitor_social_post_metrics"),
      ),
    ).toBe(false);
  });

  it("carregarPeca devolve null para slug sem post", async () => {
    const { db } = dbFake();
    expect(await carregarPeca(db, "nao-existe", AGORA)).toBeNull();
  });

  it("carregarPeca traz os posts, a curva por idade e os derivados da pauta", async () => {
    const { db, sqls } = dbFake();
    const peca = await carregarPeca(db, "2026-10-01-post-b", AGORA);
    expect(peca?.pauta).toBe("agentes");
    expect(peca?.posts.map((p) => p.id)).toEqual(["b"]);
    expect(peca?.curvas[0].pontos).toHaveLength(14);
    expect(peca?.derivados.map((d) => d.id)).toEqual(["a"]);
    for (const s of sqls)
      expect(() => assertSomenteLeitura(s.sql)).not.toThrow();
  });
});
