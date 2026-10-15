import { describe, expect, it, vi } from "vitest";
import type { LeitorContentOs } from "../content-os/leitor";
import { carregarCasamentosPainel } from "./casamentos";
import { assertSomenteLeitura } from "./readerDb";

const peca = (slug: string, campos: string) =>
  `---\nplataforma: ${campos}\n---\ncorpo`;

function leitorFake(arquivos: Record<string, string>): LeitorContentOs {
  return {
    listarPecas: vi.fn(async () => ({
      caminhos: Object.keys(arquivos),
      aviso: null,
    })),
    lerArquivo: vi.fn(async (c: string) => arquivos[c] ?? null),
  };
}

function dbFake(rows: unknown[]) {
  const sqls: string[] = [];
  return {
    sqls,
    db: {
      query: vi.fn(async (sql: string) => {
        sqls.push(sql);
        return { rows };
      }),
    } as never,
  };
}

const POST_YT = {
  rede: "youtube",
  external_id: "dQw4w9WgXcQ",
  titulo: "Vídeo sem peça",
  published_at: new Date("2026-10-10T02:30:00Z"),
};

describe("carregarCasamentosPainel", () => {
  it("junta posts sem peça e peças livres, com caminho e campo prontos", async () => {
    const { db, sqls } = dbFake([POST_YT]);
    const leitor = leitorFake({
      "content/producao/2026-10/2026-10-05-agentes.md": peca(
        "x",
        "youtube\nformato: tutorial\ncreated: 2026-10-05",
      ),
      "content/producao/2026-10/2026-10-08-outra.md": peca(
        "y",
        "instagram\ncreated: 2026-10-08",
      ),
    });
    const r = await carregarCasamentosPainel({ db, leitor });
    expect(r.erro).toBeNull();
    expect(r.sugestoes).toHaveLength(1);
    const [s] = r.sugestoes;
    expect(s.post.external_id).toBe("dQw4w9WgXcQ");
    expect(s.post.published_at).toBe("2026-10-10T02:30:00.000Z");
    expect(s.candidatas).toEqual([
      expect.objectContaining({
        slug: "2026-10-05-agentes",
        // 23h30 do dia 9 em Brasília: 4 dias depois do created.
        dias: 4,
        caminho: "content/producao/2026-10/2026-10-05-agentes.md",
        campo: "youtube_id: dQw4w9WgXcQ",
      }),
    ]);
    for (const sql of sqls)
      expect(() => assertSomenteLeitura(sql)).not.toThrow();
  });

  it("post do Instagram sugere o campo instagram_id", async () => {
    const { db } = dbFake([
      { ...POST_YT, rede: "instagram", external_id: "1790001" },
    ]);
    const leitor = leitorFake({
      "content/producao/2026-10/2026-10-08-reel.md": peca(
        "y",
        "instagram\ncreated: 2026-10-08",
      ),
    });
    const r = await carregarCasamentosPainel({ db, leitor });
    expect(r.sugestoes[0].candidatas[0].campo).toBe("instagram_id: 1790001");
  });

  it("sem token: aviso na tela e nenhuma chamada ao GitHub", async () => {
    const { db } = dbFake([POST_YT]);
    const r = await carregarCasamentosPainel({ db, leitor: null });
    expect(r.erro).toMatch(/CONTENT_OS_READ_TOKEN/);
    expect(r.sugestoes).toEqual([]);
    expect(r.postsSemPeca).toBe(1);
  });

  it("falha do GitHub vira aviso sem vazar detalhe", async () => {
    const { db } = dbFake([POST_YT]);
    const leitor: LeitorContentOs = {
      listarPecas: vi.fn(async () => {
        throw new Error("GitHub 401 token ghp_segredo");
      }),
      lerArquivo: vi.fn(),
    };
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await carregarCasamentosPainel({ db, leitor });
    expect(r.erro).toMatch(/content-os/);
    expect(r.erro).not.toContain("ghp_");
    expect(r.sugestoes).toEqual([]);
  });

  it("sem post sem peça nem chama o GitHub", async () => {
    const { db } = dbFake([]);
    const leitor = leitorFake({});
    const r = await carregarCasamentosPainel({ db, leitor });
    expect(leitor.listarPecas).not.toHaveBeenCalled();
    expect(r).toMatchObject({ sugestoes: [], erro: null, postsSemPeca: 0 });
  });
});
