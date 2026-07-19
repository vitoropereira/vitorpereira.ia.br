/**
 * Gravação/leitura de analytics de syndication (tabelas vitor_*).
 * Usa runSql (Management API) — local/CLI apenas.
 */
import { runSql, sqlLiteral, type AdminConfig } from "./supabase-admin.ts";

export interface SyndicationRecord {
  postPermalink: string;
  canonicalUrl: string;
  target: string;
  externalUrl: string;
  externalSlug: string;
  format: string;
  status: string;
  title: string;
  summaryCharCount: number;
  tags: string[];
}

export interface SyndicationRow {
  id: string;
  post_permalink: string;
  external_url: string | null;
  external_slug: string | null;
  format: string;
  title: string;
  posted_at: string;
  tabcoins: number | null;
  comments_count: number | null;
  clicks: number;
}

type Deps = { fetch?: typeof fetch; config?: AdminConfig };

/** Insere (ou atualiza, por post_permalink+target) uma linha de syndication. Devolve o id. */
export async function recordSyndication(rec: SyndicationRecord, deps: Deps = {}): Promise<string> {
  const sql = `
    insert into public.vitor_syndications
      (post_permalink, canonical_url, target, external_url, external_slug,
       format, status, title, summary_char_count, tags)
    values
      (${sqlLiteral(rec.postPermalink)}, ${sqlLiteral(rec.canonicalUrl)}, ${sqlLiteral(rec.target)},
       ${sqlLiteral(rec.externalUrl)}, ${sqlLiteral(rec.externalSlug)}, ${sqlLiteral(rec.format)},
       ${sqlLiteral(rec.status)}, ${sqlLiteral(rec.title)}, ${sqlLiteral(rec.summaryCharCount)},
       ${sqlLiteral(rec.tags)})
    on conflict (post_permalink, target) do update set
      external_url = excluded.external_url,
      external_slug = excluded.external_slug,
      format = excluded.format,
      status = excluded.status,
      title = excluded.title,
      summary_char_count = excluded.summary_char_count,
      tags = excluded.tags
    returning id;`;
  const rows = await runSql<{ id: string }>(sql, deps);
  return rows[0].id;
}

/** Insere um snapshot de métricas (tabcoins/comentários) para uma syndication. */
export async function snapshotMetrics(
  syndicationId: string,
  tabcoins: number | null,
  commentsCount: number | null,
  deps: Deps = {},
): Promise<void> {
  const sql = `
    insert into public.vitor_syndication_metrics (syndication_id, tabcoins, comments_count)
    values (${sqlLiteral(syndicationId)}, ${sqlLiteral(tabcoins)}, ${sqlLiteral(commentsCount)});`;
  await runSql(sql, deps);
}

/**
 * Lê as syndications com a última métrica e a contagem de cliques (LEFT JOINs).
 * Uma linha por syndication.
 */
export async function getSyndicationsWithStats(deps: Deps = {}): Promise<SyndicationRow[]> {
  const sql = `
    select s.id, s.post_permalink, s.external_url, s.external_slug, s.format, s.title, s.posted_at,
           m.tabcoins, m.comments_count,
           coalesce(c.clicks, 0)::int as clicks
    from public.vitor_syndications s
    left join lateral (
      select tabcoins, comments_count
      from public.vitor_syndication_metrics
      where syndication_id = s.id
      order by captured_at desc
      limit 1
    ) m on true
    left join (
      select syndication_id, count(*) as clicks
      from public.vitor_syndication_clicks
      group by syndication_id
    ) c on c.syndication_id = s.id
    order by s.posted_at desc;`;
  return runSql<SyndicationRow>(sql, deps);
}
