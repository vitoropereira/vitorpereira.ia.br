/**
 * Cliente da Supabase Management API para uso LOCAL/CLI (analytics de syndication).
 * Roda SQL cru no projeto pessoal do Vitor via o management token, escopo travado
 * em SUPABASE_PROJECT_REF. Bypassa RLS (é admin) — por isso é local apenas, nunca
 * server/Vercel. A escrita de cliques em runtime usa service_role, não isto.
 */
const MANAGEMENT_API = "https://api.supabase.com/v1/projects";

export interface AdminConfig {
  token: string;
  ref: string;
}

export function getAdminConfig(env: NodeJS.ProcessEnv = process.env): AdminConfig {
  const token = env.SUPABASE_TOKEN?.trim();
  const ref = env.SUPABASE_PROJECT_REF?.trim();
  if (!token || !ref) {
    throw new Error(
      "SUPABASE_TOKEN e SUPABASE_PROJECT_REF são obrigatórios no .env.development.local.",
    );
  }
  return { token, ref };
}

type Deps = { fetch?: typeof fetch; config?: AdminConfig };

/** Executa SQL cru e devolve as linhas. */
export async function runSql<T = Record<string, unknown>>(
  sql: string,
  deps: Deps = {},
): Promise<T[]> {
  const { token, ref } = deps.config ?? getAdminConfig();
  const f = deps.fetch ?? fetch;
  const res = await f(`${MANAGEMENT_API}/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    throw new Error(`Supabase query falhou (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as T[];
}

/**
 * Serializa um valor JS para literal SQL seguro (aspas simples escapadas).
 * Os inputs aqui são dados controlados (post + resposta do TabNews), mas escapamos
 * de qualquer jeito — um título com apóstrofo quebraria o INSERT.
 */
export function sqlLiteral(v: string | number | boolean | null | undefined | string[]): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v)) {
    return v.length === 0
      ? "array[]::text[]"
      : `array[${v.map((x) => sqlLiteral(x)).join(",")}]::text[]`;
  }
  return `'${v.replace(/'/g, "''")}'`;
}
