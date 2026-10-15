import { diaSaoPaulo, diasEntre } from "../dia";
import type { Db } from "../gravador";
import type { Rede, TipoPost } from "../types";
import {
  curvaPorIdade,
  diaZero,
  viewsNoDia,
  type PontoIdade,
  type PontoViews,
} from "./idade";
import { REDES } from "./painel";

// Ranking e página da peça do /admin/redes. Toda comparação entre posts usa
// views na mesma idade (D+1, D+7, D+30); o total acumulado aparece só como
// contexto e nunca é a ordem padrão.

export const TIPOS: TipoPost[] = [
  "longo",
  "short",
  "reel",
  "carrossel",
  "imagem",
];
export const ORDENS = [
  "d1",
  "d7",
  "d30",
  "total",
  "likes",
  "saves",
  "ctr",
  "retencao",
  "publicado",
] as const;
export type Ordem = (typeof ORDENS)[number];
export type Direcao = "asc" | "desc";

export interface Filtros {
  rede: Rede | null;
  tipo: TipoPost | null;
  formato: string | null;
  pauta: string | null;
  template: string | null;
  /** `AAAA-MM-DD` de Brasília, inclusive. */
  de: string | null;
  ate: string | null;
  ordem: Ordem;
  dir: Direcao;
}

type Instante = Date | string;

export interface PostPecaLinha {
  id: string;
  rede: Rede;
  external_id: string;
  url: string | null;
  titulo: string | null;
  tipo: TipoPost | null;
  published_at: Instante | null;
  peca_slug: string | null;
  pauta: string | null;
  formato: string | null;
  hook: string | null;
  template: string | null;
  testa: string | null;
}

export interface MetricaLinha {
  post_id: string;
  dia: string;
  views: number | null;
  likes: number | null;
  saves: number | null;
  ctr: number | null;
  avg_view_pct: number | null;
}

export interface LinhaRanking {
  id: string;
  rede: Rede;
  external_id: string;
  url: string | null;
  titulo: string | null;
  tipo: TipoPost | null;
  /** ISO 8601. */
  publicadoEm: string | null;
  dia0: string | null;
  idade: number | null;
  peca_slug: string | null;
  pauta: string | null;
  formato: string | null;
  template: string | null;
  d1: number | null;
  d7: number | null;
  d30: number | null;
  total: number | null;
  likes: number | null;
  saves: number | null;
  ctr: number | null;
  retencao: number | null;
}

export interface OpcoesFiltro {
  formatos: string[];
  pautas: string[];
  templates: string[];
}

export interface Ranking {
  hoje: string;
  linhas: LinhaRanking[];
  opcoes: OpcoesFiltro;
}

export interface CurvaPost {
  id: string;
  rede: Rede;
  titulo: string | null;
  /** Post de outra peça da mesma pauta. */
  derivado: boolean;
  pontos: PontoIdade[];
}

export interface PecaDetalhe {
  slug: string;
  pauta: string | null;
  formato: string | null;
  hook: string | null;
  template: string | null;
  testa: string | null;
  hoje: string;
  posts: LinhaRanking[];
  derivados: LinhaRanking[];
  curvas: CurvaPost[];
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TEXTO = 200;

type SearchParams = Record<string, string | string[] | undefined>;

function primeiro(v: string | string[] | undefined): string | null {
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s.slice(0, MAX_TEXTO) : null;
}

function entre<T extends string>(
  v: string | null,
  validos: readonly T[],
): T | null {
  return v !== null && (validos as readonly string[]).includes(v)
    ? (v as T)
    : null;
}

/** Query string → filtros. Valor desconhecido é ignorado, nunca repassado. */
export function parseFiltros(sp: SearchParams): Filtros {
  const data = (k: string) => {
    const v = primeiro(sp[k]);
    return v && DATA.test(v) ? v : null;
  };
  return {
    rede: entre(primeiro(sp.rede), REDES),
    tipo: entre(primeiro(sp.tipo), TIPOS),
    formato: primeiro(sp.formato),
    pauta: primeiro(sp.pauta),
    template: primeiro(sp.template),
    de: data("de"),
    ate: data("ate"),
    ordem: entre(primeiro(sp.ordem), ORDENS) ?? "d7",
    dir: primeiro(sp.dir) === "asc" ? "asc" : "desc",
  };
}

/** Último valor não-null da coluna: cada métrica pode vir de um dia diferente. */
function ultimo(
  serie: MetricaLinha[],
  campo: "likes" | "saves" | "ctr" | "avg_view_pct",
): number | null {
  for (let i = serie.length - 1; i >= 0; i--) {
    const v = serie[i][campo];
    if (v !== null && v !== undefined) return Number(v);
  }
  return null;
}

function serieViews(serie: MetricaLinha[]): PontoViews[] {
  return serie.map((m) => ({ dia: m.dia, views: m.views }));
}

function seriesPorPost(metricas: MetricaLinha[]): Map<string, MetricaLinha[]> {
  const por = new Map<string, MetricaLinha[]>();
  for (const m of metricas)
    por.set(m.post_id, [...(por.get(m.post_id) ?? []), m]);
  for (const s of por.values()) s.sort((a, b) => a.dia.localeCompare(b.dia));
  return por;
}

export function montarLinhas(
  posts: PostPecaLinha[],
  metricas: MetricaLinha[],
  hoje: string,
): LinhaRanking[] {
  const series = seriesPorPost(metricas);
  return posts.map((p) => {
    const serie = series.get(p.id) ?? [];
    const views = serieViews(serie);
    const dia0 = diaZero(p.published_at);
    const total = views.reduce<number | null>(
      (s, v) => (v.views === null ? s : (s ?? 0) + Number(v.views)),
      null,
    );
    return {
      id: p.id,
      rede: p.rede,
      external_id: p.external_id,
      url: p.url,
      titulo: p.titulo,
      tipo: p.tipo,
      publicadoEm: p.published_at
        ? new Date(p.published_at).toISOString()
        : null,
      dia0,
      idade: dia0 ? diasEntre(dia0, hoje) : null,
      peca_slug: p.peca_slug,
      pauta: p.pauta,
      formato: p.formato,
      template: p.template,
      d1: viewsNoDia(p.published_at, views, 1, hoje),
      d7: viewsNoDia(p.published_at, views, 7, hoje),
      d30: viewsNoDia(p.published_at, views, 30, hoje),
      total,
      likes: ultimo(serie, "likes"),
      saves: ultimo(serie, "saves"),
      ctr: ultimo(serie, "ctr"),
      retencao: ultimo(serie, "avg_view_pct"),
    };
  });
}

function chave(l: LinhaRanking, ordem: Ordem): number | string | null {
  return ordem === "publicado" ? l.publicadoEm : l[ordem];
}

/** Null vai sempre para o fim: post sem D+7 não é "o pior" nem "o melhor". */
export function ranking(
  linhas: LinhaRanking[],
  ordem: Ordem,
  dir: Direcao,
): LinhaRanking[] {
  const sinal = dir === "asc" ? 1 : -1;
  return [...linhas].sort((a, b) => {
    const va = chave(a, ordem);
    const vb = chave(b, ordem);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va < vb ? -1 : va > vb ? 1 : 0) * sinal;
  });
}

// `::text` e `::float8`: o pg devolve `date` como Date no fuso do servidor e
// `bigint`/`numeric` como string (mesma regra do painel).
const COLUNAS_POST = `id::text as id, rede, external_id, url, titulo, tipo, published_at, peca_slug, pauta, formato, hook, template, testa`;

const SQL_METRICAS = `select post_id::text as post_id, dia::text as dia, views::float8 as views, likes::float8 as likes, saves::float8 as saves, ctr::float8 as ctr, avg_view_pct::float8 as avg_view_pct
from public.vitor_social_post_metrics
where post_id = any($1::uuid[])
order by dia`;

const SQL_OPCOES = `select distinct formato, pauta, template
from public.vitor_social_posts
where peca_slug is not null`;

const SQL_PECA = `select ${COLUNAS_POST}
from public.vitor_social_posts
where peca_slug = $1
order by published_at`;

const SQL_DERIVADOS = `select ${COLUNAS_POST}
from public.vitor_social_posts
where pauta = $1 and peca_slug is distinct from $2
order by published_at`;

/** WHERE só com placeholders: o texto do filtro nunca entra no SQL. */
function sqlPosts(f: Filtros): { sql: string; params: unknown[] } {
  const params: unknown[] = [];
  const conds: string[] = [];
  const add = (cond: (n: number) => string, v: unknown) => {
    params.push(v);
    conds.push(cond(params.length));
  };
  if (f.rede) add((n) => `rede = $${n}`, f.rede);
  if (f.tipo) add((n) => `tipo = $${n}`, f.tipo);
  if (f.formato) add((n) => `formato = $${n}`, f.formato);
  if (f.pauta) add((n) => `pauta = $${n}`, f.pauta);
  if (f.template) add((n) => `template = $${n}`, f.template);
  // Corte pelo dia de Brasília, igual ao D0 do cálculo.
  if (f.de)
    add(
      (n) =>
        `(published_at at time zone 'America/Sao_Paulo')::date >= $${n}::date`,
      f.de,
    );
  if (f.ate)
    add(
      (n) =>
        `(published_at at time zone 'America/Sao_Paulo')::date <= $${n}::date`,
      f.ate,
    );
  const where = conds.length ? `\nwhere ${conds.join(" and ")}` : "";
  return {
    sql: `select ${COLUNAS_POST}\nfrom public.vitor_social_posts${where}`,
    params,
  };
}

async function metricasDe(db: Db, ids: string[]): Promise<MetricaLinha[]> {
  if (ids.length === 0) return [];
  const { rows } = await db.query<MetricaLinha>(SQL_METRICAS, [ids]);
  return rows;
}

const distintos = (vs: (string | null)[]) =>
  [...new Set(vs.filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

export async function carregarPecas(
  db: Db,
  filtros: Filtros,
  agora: Date,
): Promise<Ranking> {
  const hoje = diaSaoPaulo(agora);
  const { sql, params } = sqlPosts(filtros);
  const [posts, opcoes] = await Promise.all([
    db.query<PostPecaLinha>(sql, params),
    db.query<Pick<PostPecaLinha, "formato" | "pauta" | "template">>(SQL_OPCOES),
  ]);
  const metricas = await metricasDe(
    db,
    posts.rows.map((p) => p.id),
  );
  return {
    hoje,
    linhas: ranking(
      montarLinhas(posts.rows, metricas, hoje),
      filtros.ordem,
      filtros.dir,
    ),
    opcoes: {
      formatos: distintos(opcoes.rows.map((o) => o.formato)),
      pautas: distintos(opcoes.rows.map((o) => o.pauta)),
      templates: distintos(opcoes.rows.map((o) => o.template)),
    },
  };
}

/** `null` quando nenhum post coletado aponta para a peça. */
export async function carregarPeca(
  db: Db,
  slug: string,
  agora: Date,
): Promise<PecaDetalhe | null> {
  const hoje = diaSaoPaulo(agora);
  const { rows: posts } = await db.query<PostPecaLinha>(SQL_PECA, [slug]);
  if (posts.length === 0) return null;

  // Os campos editoriais vêm do sync e são iguais em todos os posts da peça.
  const ref = posts[0];
  const { rows: derivados } = ref.pauta
    ? await db.query<PostPecaLinha>(SQL_DERIVADOS, [ref.pauta, slug])
    : { rows: [] as PostPecaLinha[] };

  const todos = [...posts, ...derivados];
  const metricas = await metricasDe(
    db,
    todos.map((p) => p.id),
  );
  const series = seriesPorPost(metricas);
  const proprios = new Set(posts.map((p) => p.id));

  const curvas: CurvaPost[] = [];
  for (const p of todos) {
    const dia0 = diaZero(p.published_at);
    if (!dia0) continue;
    curvas.push({
      id: p.id,
      rede: p.rede,
      titulo: p.titulo,
      derivado: !proprios.has(p.id),
      pontos: curvaPorIdade(serieViews(series.get(p.id) ?? []), dia0, hoje),
    });
  }

  return {
    slug,
    pauta: ref.pauta,
    formato: ref.formato,
    hook: ref.hook,
    template: ref.template,
    testa: ref.testa,
    hoje,
    posts: montarLinhas(posts, metricas, hoje),
    derivados: montarLinhas(derivados, metricas, hoje),
    curvas,
  };
}
