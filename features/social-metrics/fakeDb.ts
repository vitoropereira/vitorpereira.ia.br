import type { Db } from "./gravador.ts";

// Fake de Postgres só para teste: interpreta o `insert ... on conflict ... do
// update set` que o gravador emite, respeitando a chave única e cada
// atribuição do `set`. Atribuição fora do repertório abaixo faz o teste
// quebrar, em vez de passar com uma semântica inventada.

type Linha = Record<string, unknown>;

export interface FakeDb extends Db {
  tabelas: Map<string, Linha[]>;
  queries: { text: string; params: unknown[] }[];
}

export function criarFakeDb(
  opcoes: { erroEm?: (text: string) => Error | undefined } = {},
): FakeDb {
  const tabelas = new Map<string, Linha[]>();
  const queries: { text: string; params: unknown[] }[] = [];
  let seq = 0;

  const tabela = (nome: string) => {
    let t = tabelas.get(nome);
    if (!t) {
      t = [];
      tabelas.set(nome, t);
    }
    return t;
  };

  function avaliar(expr: string, nova: Linha, antiga: Linha): unknown {
    let m = expr.match(/^excluded\.(\w+)$/);
    if (m) return nova[m[1]];
    m = expr.match(/^coalesce\(excluded\.(\w+), \w+\.(\w+)\)$/);
    if (m) return nova[m[1]] ?? antiga[m[2]];
    m = expr.match(/^\w+\.(\w+) \|\| excluded\.(\w+)$/);
    if (m) {
      return {
        ...(antiga[m[1]] as object),
        ...(nova[m[2]] as object),
      };
    }
    if (expr === "now()") return new Date();
    throw new Error(`fakeDb: atribuição não suportada: ${expr}`);
  }

  async function query<T>(text: string, params: unknown[] = []) {
    queries.push({ text, params });
    const erro = opcoes.erroEm?.(text);
    if (erro) throw erro;

    const upd = text.match(
      /^update public\.(\w+)\s+set (.+?)\s+where id = \$(\d+)$/s,
    );
    if (upd) {
      const [, nome, sets, idx] = upd;
      const alvo = tabela(nome).find((l) => l.id === params[Number(idx) - 1]);
      if (alvo) {
        for (const a of sets.split(/,\s*/)) {
          const [col, expr] = a.split(/\s*=\s*/);
          const p = expr.match(/^\$(\d+)$/);
          alvo[col] = p ? params[Number(p[1]) - 1] : avaliar(expr, {}, alvo);
        }
      }
      return { rows: [] as T[] };
    }

    const ins = text.match(
      /^insert into public\.(\w+)\s*\(([^)]+)\)\s*values \(([^)]+)\)(?:\s*on conflict \(([^)]+)\) do update set\n([\s\S]+?))?(?:\s*returning (.+))?$/,
    );
    if (!ins) throw new Error(`fakeDb: query não suportada:\n${text}`);
    const [, nome, colsTxt, valsTxt, chavesTxt, setsTxt, retTxt] = ins;
    const cols = colsTxt.split(",").map((c) => c.trim());
    const vals = valsTxt.split(",").map((v) => v.trim());

    const nova: Linha = {};
    cols.forEach((c, i) => {
      const p = vals[i].match(/^\$(\d+)$/);
      if (!p) throw new Error(`fakeDb: valor não parametrizado: ${vals[i]}`);
      const v = params[Number(p[1]) - 1];
      nova[c] = c === "extra" && typeof v === "string" ? JSON.parse(v) : v;
    });

    const t = tabela(nome);
    const chaves = chavesTxt?.split(",").map((c) => c.trim()) ?? [];
    const existente = chaves.length
      ? t.find((l) => chaves.every((k) => l[k] === nova[k]))
      : undefined;

    let linha: Linha;
    if (existente) {
      for (const a of setsTxt.split("\n")) {
        const m = a.trim().match(/^(\w+) = (.+?),?$/);
        if (!m) throw new Error(`fakeDb: set ilegível: ${a}`);
        existente[m[1]] = avaliar(m[2], nova, existente);
      }
      linha = existente;
    } else {
      linha = { id: `id-${++seq}`, extra: {}, ...nova };
      t.push(linha);
    }

    const ret = retTxt?.split(",").map((c) => c.trim()) ?? [];
    const rows = ret.length
      ? [Object.fromEntries(ret.map((c) => [c, linha[c]])) as T]
      : [];
    return { rows };
  }

  return { tabelas, queries, query };
}
