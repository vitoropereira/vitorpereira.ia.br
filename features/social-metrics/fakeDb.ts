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

  function avaliar(
    expr: string,
    nova: Linha,
    antiga: Linha,
    params: unknown[] = [],
  ): unknown {
    // jsonb: `col || $n::jsonb` (merge) e `col - 'chave'` (tira a chave).
    let m = expr.match(/^(\w+) \|\| \$(\d+)::jsonb$/);
    if (m) {
      return {
        ...(antiga[m[1]] as object),
        ...JSON.parse(String(params[Number(m[2]) - 1])),
      };
    }
    m = expr.match(/^(\w+) - '(\w+)'$/);
    if (m) {
      const copia = { ...(antiga[m[1]] as Record<string, unknown>) };
      delete copia[m[2]];
      return copia;
    }
    m = expr.match(/^excluded\.(\w+)$/);
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

    if (/^\s*(delete|truncate)\b/i.test(text)) {
      throw new Error(
        `fakeDb: o papel social_collector não tem DELETE:\n${text}`,
      );
    }

    const sel = text.match(
      /^select (.+?) from public\.(\w+)\s+where (\w+) is null$/s,
    );
    if (sel) {
      const cols = sel[1].split(",").map((c) => c.trim());
      const rows = tabela(sel[2])
        .filter((l) => (l[sel[3]] ?? null) === null)
        .map((l) => Object.fromEntries(cols.map((c) => [c, l[c] ?? null])));
      return { rows: rows as T[] };
    }

    // select col[::tipo] [as alias], ... from t where a = $n
    const selW = text.match(
      /^select (.+?) from public\.(\w+)\s+where (\w+) = \$(\d+)$/s,
    );
    if (selW) {
      const cols = selW[1].split(",").map((c) => {
        const m = c.trim().match(/^(\w+)(?:::\w+)?(?: as (\w+))?$/);
        if (!m) throw new Error(`fakeDb: coluna não suportada: ${c}`);
        return [m[1], m[2] ?? m[1]] as const;
      });
      const v = params[Number(selW[4]) - 1];
      const rows = tabela(selW[2])
        .filter((l) => l[selW[3]] === v)
        .map((l) =>
          Object.fromEntries(cols.map(([c, alias]) => [alias, l[c] ?? null])),
        );
      return { rows: rows as T[] };
    }

    // update ... where a = $n and b = $m [returning cols]
    const updW = text.match(
      /^update public\.(\w+)\s+set (.+?)\s+where (\w+ = \$\d+(?: and \w+ = \$\d+)*)(?:\s+returning (.+))?$/s,
    );
    if (updW) {
      const [, nome, sets, conds, retTxt] = updW;
      const filtros = conds.split(/ and /).map((c) => {
        const m = c.match(/^(\w+) = \$(\d+)$/)!;
        return [m[1], params[Number(m[2]) - 1]] as const;
      });
      const alvos = tabela(nome).filter((l) =>
        filtros.every(([col, v]) => l[col] === v),
      );
      for (const alvo of alvos) {
        for (const a of sets.split(/,\s*/)) {
          const [col, expr] = a.split(/\s*=\s*/);
          const p = expr.match(/^\$(\d+)$/);
          alvo[col] = p
            ? params[Number(p[1]) - 1]
            : avaliar(expr, {}, alvo, params);
        }
      }
      const ret = retTxt?.split(",").map((c) => c.trim()) ?? [];
      const rows = alvos.map((l) =>
        Object.fromEntries(ret.map((c) => [c, l[c]])),
      );
      return { rows: rows as T[] };
    }

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
