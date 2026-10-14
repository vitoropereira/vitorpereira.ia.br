import type {
  ContaDiaria,
  Job,
  MetricaDiaria,
  PostNormalizado,
  Rede,
} from "./types.ts";

/** O mínimo do `pg.Pool` que o gravador usa; o teste injeta um fake. */
export interface Db {
  query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}

// Uma linha por atribuição: o fake do teste lê o `set` linha a linha.
//
// `coalesce(excluded.x, tabela.x)` só onde null quer dizer "não coletado
// agora" (contador acumulado que só vale no dia corrente, métrica que a API
// recusou nesta passada). Nas métricas do Analytics o valor novo vence: é a
// correção do número parcial.
const SQL_POST = `insert into public.vitor_social_posts
  (rede, external_id, url, published_at, titulo, tipo)
values ($1, $2, $3, $4, $5, $6)
on conflict (rede, external_id) do update set
  url = coalesce(excluded.url, vitor_social_posts.url),
  published_at = coalesce(excluded.published_at, vitor_social_posts.published_at),
  titulo = coalesce(excluded.titulo, vitor_social_posts.titulo),
  tipo = coalesce(excluded.tipo, vitor_social_posts.tipo)
returning id, external_id`;

const SQL_METRICA = `insert into public.vitor_social_post_metrics
  (post_id, dia, views, likes, comments, shares, saves, reach, impressions, subs_gained, ctr, avg_view_pct, watch_time_min, extra)
values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
on conflict (post_id, dia) do update set
  captured_at = now(),
  views = excluded.views,
  likes = coalesce(excluded.likes, vitor_social_post_metrics.likes),
  comments = coalesce(excluded.comments, vitor_social_post_metrics.comments),
  shares = coalesce(excluded.shares, vitor_social_post_metrics.shares),
  saves = coalesce(excluded.saves, vitor_social_post_metrics.saves),
  reach = coalesce(excluded.reach, vitor_social_post_metrics.reach),
  impressions = coalesce(excluded.impressions, vitor_social_post_metrics.impressions),
  subs_gained = excluded.subs_gained,
  ctr = coalesce(excluded.ctr, vitor_social_post_metrics.ctr),
  avg_view_pct = excluded.avg_view_pct,
  watch_time_min = excluded.watch_time_min,
  extra = vitor_social_post_metrics.extra || excluded.extra`;

const SQL_CONTA = `insert into public.vitor_social_account_daily
  (rede, dia, seguidores, views_dia, alcance_dia, extra)
values ($1, $2, $3, $4, $5, $6)
on conflict (rede, dia) do update set
  seguidores = coalesce(excluded.seguidores, vitor_social_account_daily.seguidores),
  views_dia = excluded.views_dia,
  alcance_dia = coalesce(excluded.alcance_dia, vitor_social_account_daily.alcance_dia),
  extra = vitor_social_account_daily.extra || excluded.extra`;

const SQL_INICIAR_RUN = `insert into public.vitor_social_collect_runs (rede, job)
values ($1, $2)
returning id`;

const SQL_FINALIZAR_RUN = `update public.vitor_social_collect_runs
set finished_at = now(), ok = $2, erro = $3, linhas = $4
where id = $1`;

export interface FimRun {
  ok: boolean;
  erro: string | null;
  linhas: number;
}

export function criarGravador(db: Db) {
  /** Devolve `external_id → id` para ligar as métricas ao post. */
  async function upsertPosts(
    posts: PostNormalizado[],
  ): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    for (const p of posts) {
      const { rows } = await db.query<{ id: string; external_id: string }>(
        SQL_POST,
        [p.rede, p.external_id, p.url, p.published_at, p.titulo, p.tipo],
      );
      for (const r of rows) ids.set(r.external_id, r.id);
    }
    return ids;
  }

  async function upsertMetricas(
    ids: Map<string, string>,
    metricas: MetricaDiaria[],
  ): Promise<number> {
    let n = 0;
    for (const m of metricas) {
      const postId = ids.get(m.external_id);
      if (!postId) {
        throw new Error(`métrica de post não gravado: ${m.external_id}`);
      }
      await db.query(SQL_METRICA, [
        postId,
        m.dia,
        m.views,
        m.likes,
        m.comments,
        m.shares,
        m.saves,
        m.reach,
        m.impressions,
        m.subs_gained,
        m.ctr,
        m.avg_view_pct,
        m.watch_time_min,
        JSON.stringify(m.extra),
      ]);
      n++;
    }
    return n;
  }

  async function upsertConta(contas: ContaDiaria[]): Promise<number> {
    for (const c of contas) {
      await db.query(SQL_CONTA, [
        c.rede,
        c.dia,
        c.seguidores,
        c.views_dia,
        c.alcance_dia,
        JSON.stringify(c.extra),
      ]);
    }
    return contas.length;
  }

  async function iniciarRun(rede: Rede, job: Job): Promise<string> {
    const { rows } = await db.query<{ id: string }>(SQL_INICIAR_RUN, [
      rede,
      job,
    ]);
    return rows[0].id;
  }

  async function finalizarRun(id: string, fim: FimRun): Promise<void> {
    await db.query(SQL_FINALIZAR_RUN, [id, fim.ok, fim.erro, fim.linhas]);
  }

  return { upsertPosts, upsertMetricas, upsertConta, iniciarRun, finalizarRun };
}

export type Gravador = ReturnType<typeof criarGravador>;
