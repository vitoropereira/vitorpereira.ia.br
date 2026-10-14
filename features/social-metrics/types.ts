// Contrato comum dos coletores de redes sociais. Este grafo roda no
// type-stripping do Node (scripts/social-collect.ts): nada de `enum`,
// `namespace` nem parameter property, e import local com `.ts` explícito.

export type Rede = "youtube" | "instagram";

export type Job = "collect" | "backfill";

export type TipoPost = "longo" | "short" | "reel" | "carrossel" | "imagem";

/** `fetch` injetável: o teste passa um fake, a CLI passa o global. */
export type Fetch = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

/** Linha de `vitor_social_posts`, só com o que o coletor conhece. */
export interface PostNormalizado {
  rede: Rede;
  external_id: string;
  url: string | null;
  published_at: string | null;
  titulo: string | null;
  tipo: TipoPost | null;
}

/**
 * Linha de `vitor_social_post_metrics`. Métrica que a API não devolveu é
 * `null`, nunca 0: zero é dado, null é ausência.
 */
export interface MetricaDiaria {
  external_id: string;
  dia: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  reach: number | null;
  impressions: number | null;
  subs_gained: number | null;
  ctr: number | null;
  avg_view_pct: number | null;
  watch_time_min: number | null;
  extra: Record<string, unknown>;
}

/** Linha de `vitor_social_account_daily`. */
export interface ContaDiaria {
  rede: Rede;
  dia: string;
  seguidores: number | null;
  views_dia: number | null;
  alcance_dia: number | null;
  extra: Record<string, unknown>;
}

export interface ColetaPosts {
  posts: PostNormalizado[];
  metricas: MetricaDiaria[];
  /** Falha parcial que não derruba a coleta (ex.: métrica recusada). */
  avisos: string[];
}

export interface ColetaConta {
  contas: ContaDiaria[];
  avisos: string[];
}

export interface SocialAdapter {
  rede: Rede;
  /** Série da conta nos dias reprocessados até `dia` (inclusive). */
  coletarConta(dia: string): Promise<ColetaConta>;
  /**
   * Posts e série diária por post a partir de `desde` (inclusive). No
   * `backfill` a regra de idade não vale e cada post parte da própria
   * publicação.
   */
  coletarPosts(desde: string, job?: Job): Promise<ColetaPosts>;
}

export interface ResultadoRun {
  rede: Rede;
  job: Job;
  ok: boolean;
  erro: string | null;
  linhas: number;
}
