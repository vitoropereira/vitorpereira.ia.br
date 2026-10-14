import { diaSaoPaulo, somarDias, ultimosDias } from "../dia";
import type { Db } from "../gravador";
import type { Rede, TipoPost } from "../types";
import { inicioSemana, semanaDe, ultimasSemanas } from "./semana";

// Camada de consulta do /admin/redes. As funções puras recebem as linhas já
// lidas e devolvem só o que a tela desenha; `carregarPainel` é o único ponto
// que fala com o banco, pelo `Db` injetado (papel social_reader).

export const REDES: Rede[] = ["youtube", "instagram"];
export const DIAS_SEGUIDORES = 90;
/** Semana atual + as 8 anteriores. */
export const SEMANAS_CADENCIA = 9;
export const HORAS_SEM_SUCESSO = 36;

export type TipoMeta = TipoPost | "estatico";
type Job = "collect" | "backfill" | "sync_pecas" | "refresh_token";
type Instante = Date | string;

export interface PostLinha {
  rede: Rede;
  tipo: TipoPost | null;
  published_at: Instante | null;
}

export interface ContaLinha {
  rede: Rede;
  dia: string;
  seguidores: number | null;
  views_dia: number | null;
  alcance_dia: number | null;
}

export interface MetaLinha {
  rede: Rede;
  tipo: TipoMeta;
  por_semana: number;
  vigente_desde: string;
}

export interface RunLinha {
  /** `sync_pecas` não tem rede. */
  rede: Rede | null;
  job: Job;
  started_at: Instante;
  finished_at: Instante | null;
  ok: boolean | null;
  erro: string | null;
}

export interface CelulaCadencia {
  semana: string;
  feitos: number;
  meta: number | null;
}

export interface LinhaCadencia {
  rede: Rede;
  tipo: TipoMeta;
  semanas: CelulaCadencia[];
}

export interface PontoSeguidores {
  dia: string;
  youtube: number | null;
  instagram: number | null;
}

export interface PontoSemanal {
  semana: string;
  views_youtube: number | null;
  alcance_youtube: number | null;
  views_instagram: number | null;
  alcance_instagram: number | null;
}

export interface ItemSaude {
  rede: Rede | null;
  job: Job;
  /** ISO do último run (finished_at, senão started_at). */
  ultimoEm: string;
  ok: boolean | null;
  erro: string | null;
  ultimoSucessoEm: string | null;
  aviso: string | null;
}

export interface Saude {
  itens: ItemSaude[];
  /** Aviso geral: só quando não há run nenhum. */
  aviso: string | null;
}

export interface Painel {
  vazio: boolean;
  hoje: string;
  semanas: string[];
  seguidores: PontoSeguidores[];
  semanal: PontoSemanal[];
  cadencia: LinhaCadencia[];
  saude: Saude;
}

const ESTATICOS: TipoPost[] = ["imagem", "carrossel"];
const ORDEM_TIPO: TipoMeta[] = [
  "longo",
  "short",
  "reel",
  "estatico",
  "carrossel",
  "imagem",
];
const ORDEM_JOB: Job[] = ["collect", "backfill", "sync_pecas", "refresh_token"];

const ms = (t: Instante) => new Date(t).getTime();
const iso = (t: Instante) => new Date(t).toISOString();

/** Meta da semana: a de maior `vigente_desde` que já valia na segunda. */
export function metaVigente(
  metas: MetaLinha[],
  rede: Rede,
  tipo: TipoMeta,
  semana: string,
): number | null {
  let melhor: MetaLinha | null = null;
  for (const m of metas) {
    if (m.rede !== rede || m.tipo !== tipo || m.vigente_desde > semana)
      continue;
    if (!melhor || m.vigente_desde > melhor.vigente_desde) melhor = m;
  }
  return melhor ? Number(melhor.por_semana) : null;
}

export function cadencia(
  posts: PostLinha[],
  metas: MetaLinha[],
  semanas: string[],
): LinhaCadencia[] {
  const comMeta = new Set(metas.map((m) => `${m.rede}:${m.tipo}`));
  // Com meta de `estatico`, imagem e carrossel somam nela; um tipo estático
  // com meta própria continua com a própria linha.
  const linhaDe = (rede: Rede, tipo: TipoPost): TipoMeta =>
    ESTATICOS.includes(tipo) &&
    !comMeta.has(`${rede}:${tipo}`) &&
    comMeta.has(`${rede}:estatico`)
      ? "estatico"
      : tipo;

  const contagem = new Map<string, number>();
  const chaves = new Set(comMeta);
  for (const p of posts) {
    if (!p.published_at || !p.tipo) continue;
    const tipo = linhaDe(p.rede, p.tipo);
    chaves.add(`${p.rede}:${tipo}`);
    const k = `${p.rede}:${tipo}:${semanaDe(p.published_at)}`;
    contagem.set(k, (contagem.get(k) ?? 0) + 1);
  }

  return [...chaves]
    .map((k) => {
      const [rede, tipo] = k.split(":") as [Rede, TipoMeta];
      return {
        rede,
        tipo,
        semanas: semanas.map((semana) => ({
          semana,
          feitos: contagem.get(`${k}:${semana}`) ?? 0,
          meta: metaVigente(metas, rede, tipo, semana),
        })),
      };
    })
    .sort(
      (a, b) =>
        REDES.indexOf(a.rede) - REDES.indexOf(b.rede) ||
        ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo),
    );
}

/** Dia sem linha ou com `seguidores` null fica null: lacuna, não zero. */
export function seriesSeguidores(
  contas: ContaLinha[],
  hoje: string,
): PontoSeguidores[] {
  const por = new Map(contas.map((c) => [`${c.rede}:${c.dia}`, c.seguidores]));
  return ultimosDias(hoje, DIAS_SEGUIDORES).map((dia) => ({
    dia,
    youtube: por.get(`youtube:${dia}`) ?? null,
    instagram: por.get(`instagram:${dia}`) ?? null,
  }));
}

export function viewsAlcanceSemanais(
  contas: ContaLinha[],
  semanas: string[],
): PontoSemanal[] {
  const pontos = new Map<string, PontoSemanal>(
    semanas.map((semana) => [
      semana,
      {
        semana,
        views_youtube: null,
        alcance_youtube: null,
        views_instagram: null,
        alcance_instagram: null,
      },
    ]),
  );
  // Soma só o que veio; null + null continua null para a semana sem dado não
  // virar um zero falso no gráfico.
  const somar = (a: number | null, b: number | null) =>
    b === null ? a : (a ?? 0) + Number(b);
  for (const c of contas) {
    // `dia` já é a data de Brasília: não passa por conversão de fuso.
    const ponto = pontos.get(inicioSemana(c.dia));
    if (!ponto) continue;
    const views = `views_${c.rede}` as const;
    const alcance = `alcance_${c.rede}` as const;
    ponto[views] = somar(ponto[views], c.views_dia);
    ponto[alcance] = somar(ponto[alcance], c.alcance_dia);
  }
  return [...pontos.values()];
}

/**
 * Último run por (rede, job). Avisa quando ele falhou e, no `collect` (que
 * roda todo dia), quando não há sucesso nas últimas 36 h. Os outros jobs são
 * esporádicos: ficar dias sem rodar é normal.
 */
export function saudeColeta(runs: RunLinha[], agora: Date): Saude {
  if (runs.length === 0) {
    return {
      itens: [],
      aviso:
        "A coleta ainda não rodou: nenhum registro em vitor_social_collect_runs.",
    };
  }

  const grupos = new Map<string, RunLinha[]>();
  for (const r of runs) {
    const k = `${r.rede ?? ""}:${r.job}`;
    grupos.set(k, [...(grupos.get(k) ?? []), r]);
  }

  const limite = agora.getTime() - HORAS_SEM_SUCESSO * 3_600_000;
  const itens = [...grupos.values()].map((rs): ItemSaude => {
    const quando = (r: RunLinha) => ms(r.finished_at ?? r.started_at);
    const ultimo = rs.reduce((a, b) => (quando(b) > quando(a) ? b : a));
    const sucessos = rs
      .filter((r) => r.ok === true && r.finished_at)
      .map((r) => ms(r.finished_at!));
    const ultimoSucesso = sucessos.length ? Math.max(...sucessos) : null;

    let aviso: string | null = null;
    if (ultimo.ok === false) {
      aviso = `O último run falhou${ultimo.erro ? `: ${ultimo.erro}` : "."}`;
    } else if (
      ultimo.job === "collect" &&
      (ultimoSucesso === null || ultimoSucesso < limite)
    ) {
      aviso = `Nenhuma coleta com sucesso nas últimas ${HORAS_SEM_SUCESSO} h.`;
    }

    return {
      rede: ultimo.rede,
      job: ultimo.job,
      ultimoEm: iso(ultimo.finished_at ?? ultimo.started_at),
      ok: ultimo.ok,
      erro: ultimo.erro,
      ultimoSucessoEm:
        ultimoSucesso === null ? null : new Date(ultimoSucesso).toISOString(),
      aviso,
    };
  });

  itens.sort(
    (a, b) =>
      ORDEM_JOB.indexOf(a.job) - ORDEM_JOB.indexOf(b.job) ||
      (a.rede ? REDES.indexOf(a.rede) : 99) -
        (b.rede ? REDES.indexOf(b.rede) : 99),
  );
  return { itens, aviso: null };
}

// `::text` e `::float8` no SELECT: o pg devolve `date` como Date no fuso do
// servidor (que desloca o dia) e `bigint`/`numeric` como string.
const SQL_POSTS = `select rede, tipo, published_at
from public.vitor_social_posts
where published_at >= $1`;

const SQL_CONTAS = `select rede, dia::text as dia, seguidores::float8 as seguidores, views_dia::float8 as views_dia, alcance_dia::float8 as alcance_dia
from public.vitor_social_account_daily
where dia >= $1`;

const SQL_METAS = `select rede, tipo, por_semana::float8 as por_semana, vigente_desde::text as vigente_desde
from public.vitor_social_goals`;

// Último run de cada (rede, job) e o último sucesso de cada um: com as duas
// consultas a saúde não depende de uma janela de tempo, e um job esporádico
// de meses atrás ainda aparece.
const SQL_ULTIMOS_RUNS = `select distinct on (rede, job) rede, job, started_at, finished_at, ok, erro
from public.vitor_social_collect_runs
order by rede, job, coalesce(finished_at, started_at) desc`;

const SQL_ULTIMOS_SUCESSOS = `select rede, job, max(finished_at) as started_at, max(finished_at) as finished_at, true as ok, null as erro
from public.vitor_social_collect_runs
where ok = true and finished_at is not null
group by rede, job`;

export async function carregarPainel(db: Db, agora: Date): Promise<Painel> {
  const hoje = diaSaoPaulo(agora);
  const semanas = ultimasSemanas(hoje, SEMANAS_CADENCIA);
  const desdeDia = [
    ultimosDias(hoje, DIAS_SEGUIDORES)[0],
    semanas[0],
  ].sort()[0];
  // Um dia de folga antes da primeira segunda: o corte exato por semana de
  // Brasília é feito em `cadencia`, não no SQL.
  const desdePost = `${somarDias(semanas[0], -1)}T00:00:00Z`;

  const [posts, contas, metas, ultimos, sucessos] = await Promise.all([
    db.query<PostLinha>(SQL_POSTS, [desdePost]),
    db.query<ContaLinha>(SQL_CONTAS, [desdeDia]),
    db.query<MetaLinha>(SQL_METAS),
    db.query<RunLinha>(SQL_ULTIMOS_RUNS),
    db.query<RunLinha>(SQL_ULTIMOS_SUCESSOS),
  ]);

  const runs = [...ultimos.rows, ...sucessos.rows];
  return {
    vazio:
      posts.rows.length === 0 &&
      contas.rows.length === 0 &&
      metas.rows.length === 0 &&
      runs.length === 0,
    hoje,
    semanas,
    seguidores: seriesSeguidores(contas.rows, hoje),
    semanal: viewsAlcanceSemanais(contas.rows, semanas),
    cadencia: cadencia(posts.rows, metas.rows, semanas),
    saude: saudeColeta(runs, agora),
  };
}
