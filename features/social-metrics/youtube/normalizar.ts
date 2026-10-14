import type { MetricaDiaria, PostNormalizado, TipoPost } from "../types.ts";

// Teto de Short do YouTube desde out/2024: até 3 minutos, inclusive.
export const LIMITE_SHORT_SEGUNDOS = 180;

/** `PT1H2M3S`, `PT3M`, `P0D`, `P1DT2H` → segundos. Formato inválido → null. */
export function parseDuracaoISO8601(iso: string): number | null {
  const m = iso.match(
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
  );
  if (!m) return null;
  const [, d, h, min, s] = m;
  return (
    Number(d ?? 0) * 86_400 +
    Number(h ?? 0) * 3_600 +
    Number(min ?? 0) * 60 +
    Math.round(Number(s ?? 0))
  );
}

export function tipoPorDuracao(segundos: number | null): TipoPost | null {
  if (segundos == null) return null;
  return segundos <= LIMITE_SHORT_SEGUNDOS ? "short" : "longo";
}

/**
 * A Data API manda contador como string e omite o campo quando o dono oculta
 * (likes ocultos, por exemplo). Ausente vira null; "0" é zero de verdade.
 */
export function numOuNull(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export interface VideoApi {
  id: string;
  snippet?: { title?: string; publishedAt?: string };
  contentDetails?: { duration?: string };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

export function postDoVideo(v: VideoApi): PostNormalizado {
  const duracao = v.contentDetails?.duration;
  return {
    rede: "youtube",
    external_id: v.id,
    url: `https://www.youtube.com/watch?v=${v.id}`,
    published_at: v.snippet?.publishedAt ?? null,
    titulo: v.snippet?.title ?? null,
    tipo: tipoPorDuracao(duracao ? parseDuracaoISO8601(duracao) : null),
  };
}

export interface RelatorioApi {
  columnHeaders?: { name: string }[];
  rows?: unknown[][];
}

/**
 * Converte o relatório do Analytics em objetos por nome de coluna. A ordem das
 * colunas segue o pedido, mas depender da posição quebra em silêncio quando
 * alguém reordena a lista de métricas.
 */
export function linhasPorNome(r: RelatorioApi): Record<string, unknown>[] {
  const nomes = (r.columnHeaders ?? []).map((c) => c.name);
  return (r.rows ?? []).map((row) =>
    Object.fromEntries(nomes.map((n, i) => [n, row[i]])),
  );
}

export function metricaVazia(external_id: string, dia: string): MetricaDiaria {
  return {
    external_id,
    dia,
    views: null,
    likes: null,
    comments: null,
    shares: null,
    saves: null,
    reach: null,
    impressions: null,
    subs_gained: null,
    ctr: null,
    avg_view_pct: null,
    watch_time_min: null,
    extra: {},
  };
}

/** Linha do Analytics (`day` + métricas base e, se vier, impressões). */
export function aplicarLinhaAnalytics(
  m: MetricaDiaria,
  linha: Record<string, unknown>,
): MetricaDiaria {
  const pega = (col: string, atual: number | null) =>
    col in linha ? numOuNull(linha[col]) : atual;
  return {
    ...m,
    views: pega("views", m.views),
    watch_time_min: pega("estimatedMinutesWatched", m.watch_time_min),
    avg_view_pct: pega("averageViewPercentage", m.avg_view_pct),
    subs_gained: pega("subscribersGained", m.subs_gained),
    impressions: pega("videoThumbnailImpressions", m.impressions),
    ctr: pega("videoThumbnailImpressionsClickRate", m.ctr),
  };
}
