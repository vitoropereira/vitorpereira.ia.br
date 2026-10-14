import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// O CI não tem banco: este teste só trava o TEXTO do SQL. A prova real de que
// as permissões resistem é supabase/tests/0002_vitor_social_resistencia.sql,
// rodado pelo Vitor depois de aplicar a migration.

const root = path.resolve(__dirname, "..");

function lerSql(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}

// Tira comentário de linha para que um "-- vitor_syndication" explicativo não
// conte como uso real, e normaliza caixa e espaço para os matches.
function normalizar(sql: string) {
  return sql
    .split("\n")
    .map((linha) => linha.replace(/--.*$/, ""))
    .join("\n")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const TABELAS = [
  "vitor_social_posts",
  "vitor_social_post_metrics",
  "vitor_social_account_daily",
  "vitor_social_goals",
  "vitor_social_collect_runs",
];

const bruto = lerSql("migrations/0002_vitor_social.sql");
const sql = normalizar(bruto);
const resistencia = normalizar(
  lerSql("tests/0002_vitor_social_resistencia.sql"),
);

describe("migration 0002_vitor_social", () => {
  it.each(TABELAS)("cria %s com if not exists", (t) => {
    expect(sql).toContain(`create table if not exists public.${t} (`);
  });

  it.each(TABELAS)("habilita RLS em %s", (t) => {
    expect(sql).toContain(`alter table public.${t} enable row level security;`);
  });

  it.each(TABELAS)("revoga anon e authenticated em %s", (t) => {
    expect(sql).toContain(
      `revoke all on public.${t} from anon, authenticated;`,
    );
  });

  it("não cria tabela nem índice sem if not exists", () => {
    expect(sql).not.toMatch(/create table (?!if not exists)/);
    expect(sql).not.toMatch(/create index (?!if not exists)/);
  });

  it("cria os três índices pedidos", () => {
    expect(sql).toMatch(
      /on public\.vitor_social_posts \(rede, published_at desc\)/,
    );
    expect(sql).toMatch(/on public\.vitor_social_posts \(peca_slug\)/);
    expect(sql).toMatch(/on public\.vitor_social_post_metrics \(dia\)/);
  });

  it("nenhum grant libera delete, all ou outra tabela", () => {
    const grants = sql.match(/grant [^;]*;/g) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) {
      expect(g).not.toMatch(/\bdelete\b/);
      expect(g).not.toMatch(/\ball\b/);
      expect(g).not.toContain("vitor_syndication");
      expect(g).toMatch(/to social_(collector|reader)/);
      // Todo grant de tabela tem de nomear só tabelas vitor_social_*.
      const alvo = g.match(/ on (?!schema)(.*) to /);
      if (alvo) {
        for (const nome of alvo[1].split(",")) {
          expect(nome.trim()).toMatch(/^public\.vitor_social_[a-z_]+$/);
        }
      }
    }
  });

  it("social_reader só recebe select", () => {
    const doReader = (sql.match(/grant [^;]*to social_reader;/g) ?? []).filter(
      (g) => !g.includes("on schema"),
    );
    expect(doReader.length).toBeGreaterThan(0);
    for (const g of doReader) expect(g).toMatch(/^grant select on /);
  });

  it("social_collector recebe select, insert, update nas cinco", () => {
    for (const t of TABELAS) {
      expect(sql).toMatch(
        new RegExp(
          `grant select, insert, update on [^;]*public\\.${t}\\b[^;]*to social_collector;`,
        ),
      );
    }
  });

  it("não tem senha nem bypassrls", () => {
    expect(sql).not.toContain("password");
    expect(sql).not.toContain("bypassrls");
  });

  it("só cita vitor_syndication em comentário", () => {
    expect(sql).not.toContain("vitor_syndication");
  });

  it("create role só dentro de do que confere pg_roles", () => {
    const roles = sql.match(/create role [a-z_]+/g) ?? [];
    expect(roles).toEqual([
      "create role social_collector",
      "create role social_reader",
    ]);
    for (const papel of ["social_collector", "social_reader"]) {
      expect(sql).toMatch(
        new RegExp(
          `do \\$\\$ begin if not exists \\(select 1 from pg_roles where rolname = '${papel}'\\) then create role ${papel} `,
        ),
      );
    }
  });

  it("policies ficam dentro de do que confere pg_policies", () => {
    const policies = sql.match(/create policy [a-z_]+/g) ?? [];
    expect(policies).toHaveLength(TABELAS.length * 2);
    const checagens = sql.match(/from pg_policies/g) ?? [];
    expect(checagens).toHaveLength(policies.length);
  });
});

describe("teste de resistência 0002", () => {
  it("abre com begin e termina com rollback", () => {
    expect(resistencia.trim().startsWith("begin;")).toBe(true);
    expect(resistencia.trim().endsWith("rollback;")).toBe(true);
  });

  it("todo handler de insufficient_privilege vem depois de um raise exception", () => {
    const blocos = resistencia.match(/do \$\$[\s\S]*?\$\$;/g) ?? [];
    const negativos = blocos.filter((b) =>
      b.includes("when insufficient_privilege"),
    );
    expect(negativos.length).toBeGreaterThan(0);
    for (const b of negativos) {
      const antes = b.slice(
        0,
        b.indexOf("exception when insufficient_privilege"),
      );
      expect(antes).toContain("raise exception");
    }
  });

  it.each([
    ["social_reader", /insert into public\.vitor_social_posts/],
    ["social_collector", /select [^;]*from public\.vitor_syndication_clicks/],
    ["social_collector", /delete from public\.vitor_social_posts/],
    ["authenticated", /select [^;]*from public\.vitor_social_posts/],
  ])("cobre o caso negativo de %s", (papel, op) => {
    const trechos = resistencia.split(/set local role /).slice(1);
    const casa = trechos.some(
      (t) =>
        t.startsWith(`${papel};`) &&
        op.test(t) &&
        t.includes("when insufficient_privilege"),
    );
    expect(casa).toBe(true);
  });

  it.each(TABELAS)("cobre anon fazendo select em %s", (t) => {
    const trechos = resistencia.split(/set local role /).slice(1);
    const casa = trechos.some(
      (tr) =>
        tr.startsWith("anon;") &&
        new RegExp(`from public\\.${t}\\b`).test(tr) &&
        tr.includes("when insufficient_privilege"),
    );
    expect(casa).toBe(true);
  });

  it("cobre o upsert do collector em post_metrics", () => {
    expect(resistencia).toMatch(
      /insert into public\.vitor_social_post_metrics[^;]*on conflict \(post_id, dia\) do update/,
    );
  });
});
