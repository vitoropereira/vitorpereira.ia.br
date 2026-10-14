import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { criarFakeDb } from "../fakeDb";
import { criarGravador } from "../gravador";
import type { PostNormalizado } from "../types";
import type { LeitorContentOs } from "./leitor";
import { executarSyncPecas } from "./sync";

const fixture = (nome: string) =>
  readFileSync(join(import.meta.dirname, "fixtures", nome), "utf8");

const DIR = "content/producao/2026-10";

function leitorFake(
  arquivos: Record<string, string>,
  opcoes: { metas?: string; falha?: Error } = {},
): LeitorContentOs {
  return {
    async listarPecas() {
      if (opcoes.falha) throw opcoes.falha;
      return {
        caminhos: Object.keys(arquivos).map((n) => `${DIR}/${n}`),
        aviso: null,
      };
    },
    async lerArquivo(caminho) {
      if (caminho === "content/metricas/metas.yml") return opcoes.metas ?? null;
      return arquivos[caminho.slice(DIR.length + 1)] ?? null;
    },
  };
}

function post(
  rede: PostNormalizado["rede"],
  external_id: string,
): PostNormalizado {
  return {
    rede,
    external_id,
    url: null,
    published_at: "2026-10-14T15:00:00Z",
    titulo: "t",
    tipo: "longo",
  };
}

async function preparar() {
  const db = criarFakeDb();
  const gravador = criarGravador(db);
  await gravador.upsertPosts([
    post("youtube", "novoAAAAAA1"),
    post("youtube", "outroAAAAA22"),
    post("instagram", "igMedia0001"),
  ]);
  db.queries.length = 0;
  return { db, gravador };
}

const posts = (db: ReturnType<typeof criarFakeDb>) =>
  db.tabelas.get("vitor_social_posts")!;

describe("executarSyncPecas", () => {
  it("peça com youtube_id atualiza só o post (youtube, id) e fecha o run", async () => {
    const { db, gravador } = await preparar();
    const r = await executarSyncPecas({
      gravador,
      leitor: leitorFake({
        "2026-10-11-video-longo.md": fixture("2026-10-11-video-longo.md"),
      }),
    });
    expect(r).toMatchObject({ ok: true, erro: null, linhas: 2 });
    const [yt, outro, ig] = posts(db);
    expect(yt).toMatchObject({
      peca_slug: "2026-10-11-video-longo",
      pauta: "Automação para quem atende por WhatsApp",
      formato: "talking-head",
      template: "T1",
      testa: "gancho",
    });
    expect(outro.peca_slug).toBeUndefined();
    // instagram_id da mesma peça atualiza o post do Instagram.
    expect(ig.peca_slug).toBe("2026-10-11-video-longo");
    expect(db.tabelas.get("vitor_social_collect_runs")![0]).toMatchObject({
      rede: null,
      job: "sync_pecas",
      ok: true,
      linhas: 2,
    });
  });

  it("peça sem post coletado não cria nada", async () => {
    const { db, gravador } = await preparar();
    const r = await executarSyncPecas({
      gravador,
      leitor: leitorFake({
        "2026-10-12-sem-post.md": fixture("2026-10-12-sem-post.md"),
      }),
    });
    expect(r).toMatchObject({ ok: true, linhas: 0 });
    expect(posts(db)).toHaveLength(3);
    expect(
      db.queries.some((q) =>
        /insert into public\.vitor_social_posts/.test(q.text),
      ),
    ).toBe(false);
  });

  it("YAML quebrado vira aviso e as outras peças seguem", async () => {
    const { db, gravador } = await preparar();
    const r = await executarSyncPecas({
      gravador,
      leitor: leitorFake({
        "2026-10-13-yaml-quebrado.md": fixture("2026-10-13-yaml-quebrado.md"),
        "2026-10-11-video-longo.md": fixture("2026-10-11-video-longo.md"),
      }),
    });
    expect(r.ok).toBe(true);
    expect(r.erro).toMatch(/^aviso: .*2026-10-13-yaml-quebrado/);
    expect(posts(db)[0].peca_slug).toBe("2026-10-11-video-longo");
  });

  it("id repetido em duas peças não é aplicado e vira aviso", async () => {
    const { db, gravador } = await preparar();
    const igual = fixture("2026-10-12-sem-post.md").replace(
      "naoColetado",
      "novoAAAAAA1",
    );
    const r = await executarSyncPecas({
      gravador,
      leitor: leitorFake({ "a.md": igual, "b.md": igual }),
    });
    expect(r.ok).toBe(true);
    expect(r.erro).toMatch(/repetido/);
    expect(posts(db)[0].peca_slug).toBeUndefined();
  });

  it("grava as metas e repetir o sync não duplica", async () => {
    const { db, gravador } = await preparar();
    const leitor = leitorFake({}, { metas: fixture("metas.yml") });
    const r = await executarSyncPecas({ gravador, leitor });
    await executarSyncPecas({ gravador, leitor });
    expect(r).toMatchObject({ ok: true, linhas: 2 });
    expect(db.tabelas.get("vitor_social_goals")).toHaveLength(2);
  });

  it("metas.yml ausente não emite query de meta", async () => {
    const { db, gravador } = await preparar();
    const r = await executarSyncPecas({ gravador, leitor: leitorFake({}) });
    expect(r).toMatchObject({ ok: true, erro: null });
    expect(db.queries.some((q) => q.text.includes("vitor_social_goals"))).toBe(
      false,
    );
  });

  it("metas.yml inválido é rejeitado, com aviso, sem derrubar o job", async () => {
    const { db, gravador } = await preparar();
    const r = await executarSyncPecas({
      gravador,
      leitor: leitorFake({}, { metas: fixture("metas-invalido.yml") }),
    });
    expect(r.ok).toBe(true);
    expect(r.erro).toMatch(/^aviso: metas\.yml/);
    expect(db.tabelas.get("vitor_social_goals") ?? []).toHaveLength(0);
  });

  it("falha de rede no leitor dá ok = false e o run fechado", async () => {
    const { db, gravador } = await preparar();
    const r = await executarSyncPecas({
      gravador,
      leitor: leitorFake({}, { falha: new Error("GitHub 502 ao listar") }),
    });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/502/);
    const run = db.tabelas.get("vitor_social_collect_runs")![0];
    expect(run).toMatchObject({ ok: false, job: "sync_pecas" });
    expect(run.finished_at).toBeInstanceOf(Date);
  });

  it("falha ao abrir o run não lança", async () => {
    const gravador = criarGravador(
      criarFakeDb({ erroEm: () => new Error("sem conexão") }),
    );
    const r = await executarSyncPecas({ gravador, leitor: leitorFake({}) });
    expect(r).toMatchObject({ ok: false });
    expect(r.erro).toMatch(/não abriu o run/);
  });
});
