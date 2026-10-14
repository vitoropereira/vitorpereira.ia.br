import { describe, expect, it } from "vitest";
import { criarFakeDb } from "../fakeDb";
import { criarGravador, type PostSemPeca } from "../gravador";
import type { Peca } from "../types";
import { carregarSugestoes, sugerirCasamentos } from "./casamentos";

function peca(over: Partial<Peca> = {}): Peca {
  return {
    slug: "2026-10-01-a",
    plataforma: "youtube",
    formato: null,
    pauta: null,
    hook: null,
    template: null,
    testa: null,
    created: "2026-10-01",
    publicado: null,
    youtube_id: null,
    instagram_id: null,
    ...over,
  };
}

function post(
  publishedAt: string,
  over: Partial<PostSemPeca> = {},
): PostSemPeca {
  return {
    rede: "youtube",
    external_id: "vid00000001",
    titulo: null,
    published_at: publishedAt,
    ...over,
  };
}

describe("sugerirCasamentos", () => {
  it("considera a janela de 0 a 14 dias a partir do created", () => {
    const p = peca();
    const dentro = (iso: string) => sugerirCasamentos([post(iso)], [p]).length;
    expect(dentro("2026-10-01T15:00:00Z")).toBe(1); // 0 dia
    expect(dentro("2026-10-15T15:00:00Z")).toBe(1); // 14 dias: entra
    expect(dentro("2026-10-16T15:00:00Z")).toBe(0); // 15 dias: fora
    expect(dentro("2026-09-30T15:00:00Z")).toBe(0); // -1 dia: fora
  });

  it("calcula o dia do post em Brasília, não em UTC", () => {
    // 02:00 UTC de 02/10 ainda é 01/10 em Brasília: distância 0, não 1.
    const r = sugerirCasamentos([post("2026-10-02T02:00:00Z")], [peca()]);
    expect(r[0].candidatas[0].dias).toBe(0);
  });

  it("plataforma diferente da rede do post fica de fora (linkedin nunca casa)", () => {
    const pecas = [
      peca({ slug: "ig", plataforma: "instagram" }),
      peca({ slug: "li", plataforma: "linkedin" }),
    ];
    expect(sugerirCasamentos([post("2026-10-03T15:00:00Z")], pecas)).toEqual(
      [],
    );
  });

  it("ignora peça já publicada ou com id", () => {
    const pecas = [
      peca({ slug: "pub", publicado: "2026-10-02" }),
      peca({ slug: "yt", youtube_id: "x" }),
      peca({ slug: "ig", instagram_id: "y" }),
      peca({ slug: "sem-created", created: null }),
    ];
    expect(sugerirCasamentos([post("2026-10-03T15:00:00Z")], pecas)).toEqual(
      [],
    );
  });

  it("ordena as candidatas pela menor distância", () => {
    const pecas = [
      peca({ slug: "longe", created: "2026-10-01" }),
      peca({ slug: "perto", created: "2026-10-08" }),
    ];
    const [s] = sugerirCasamentos([post("2026-10-10T15:00:00Z")], pecas);
    expect(s.candidatas.map((c) => [c.peca.slug, c.dias])).toEqual([
      ["perto", 2],
      ["longe", 9],
    ]);
  });
});

describe("carregarSugestoes", () => {
  it("lê peças e posts sem peça e não grava nada", async () => {
    const db = criarFakeDb();
    const gravador = criarGravador(db);
    await gravador.upsertPosts([
      {
        rede: "youtube",
        external_id: "vid00000001",
        url: null,
        published_at: "2026-10-03T15:00:00Z",
        titulo: null,
        tipo: null,
      },
    ]);
    db.queries.length = 0;
    const leitor = {
      async listarPecas() {
        return { caminhos: ["content/producao/2026-10/a.md"], aviso: null };
      },
      async lerArquivo() {
        return "---\nplataforma: youtube\ncreated: 2026-10-01\n---\n";
      },
    };
    const r = await carregarSugestoes({ leitor, gravador });
    expect(r).toHaveLength(1);
    expect(r[0].candidatas[0].peca.slug).toBe("a");
    expect(db.queries.every((q) => /^\s*select/i.test(q.text))).toBe(true);
  });
});
