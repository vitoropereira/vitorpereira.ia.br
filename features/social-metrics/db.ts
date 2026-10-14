import pg from "pg";
import type { Db } from "./gravador.ts";

/**
 * Único ponto que conhece o driver. A URL é a do papel `social_collector`
 * (sem DELETE): sem ela o coletor aborta, em vez de cair num default que
 * poderia ser um papel com mais poder.
 */
export function criarDb(
  env: Record<string, string | undefined>,
): Db & { fechar(): Promise<void> } {
  const url = env.SOCIAL_COLLECTOR_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Defina SOCIAL_COLLECTOR_DATABASE_URL (papel social_collector) para gravar as métricas.",
    );
  }
  // O Supabase exige TLS, mas assina o certificado com a CA própria, que o
  // Node não conhece. Com o PEM da CA (Dashboard → Database → SSL) o
  // certificado é verificado; sem ele, a conexão é cifrada mas não verificada.
  const ca = env.SOCIAL_COLLECTOR_DATABASE_CA;
  const pool = new pg.Pool({
    connectionString: url,
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    max: 2,
  });
  return {
    async query<T>(text: string, params?: unknown[]) {
      const r = await pool.query(text, params);
      return { rows: r.rows as T[] };
    },
    fechar: () => pool.end(),
  };
}
