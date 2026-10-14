import pg from "pg";
import type { Db } from "../gravador";

// Conexão do painel, com o papel `social_reader` (só SELECT, barrado no
// banco). A checagem de SQL abaixo é a segunda trava: um bug que tente
// escrever por aqui falha antes de sair do processo. Este módulo só pode ser
// importado no servidor; o env-scope.test.ts confere que nenhum arquivo
// "use client" o alcança.

const ESCRITA =
  /\b(insert|update|delete|merge|truncate|alter|drop|create|grant|revoke|copy|call|do|vacuum|lock|set|reset)\b/i;

export function assertSomenteLeitura(sql: string): void {
  const texto = sql.trim();
  // `;` fora: nada de segunda instrução escondida atrás de um SELECT.
  if (
    !/^(select|with)\b/i.test(texto) ||
    texto.includes(";") ||
    ESCRITA.test(texto)
  ) {
    throw new Error(
      `readerDb é somente leitura: só aceita um único SELECT/WITH.\n${texto}`,
    );
  }
}

export function criarReaderDb(env: Record<string, string | undefined>): Db {
  const url = env.SOCIAL_READER_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Defina SOCIAL_READER_DATABASE_URL (papel social_reader) para ler o painel de redes.",
    );
  }
  // Mesma regra do coletor (db.ts): com o PEM da CA do Supabase o certificado
  // é verificado; sem ele, a conexão é cifrada mas não verificada.
  const ca = env.SOCIAL_READER_DATABASE_CA;
  let pool: pg.Pool | null = null;
  return {
    async query<T>(text: string, params?: unknown[]) {
      assertSomenteLeitura(text);
      pool ??= new pg.Pool({
        connectionString: url,
        ssl: ca
          ? { ca, rejectUnauthorized: true }
          : { rejectUnauthorized: false },
        max: 2,
      });
      const r = await pool.query(text, params);
      return { rows: r.rows as T[] };
    },
  };
}

// Um pool por processo: cada request do painel reaproveita as conexões em vez
// de abrir novas a cada render.
let singleton: Db | null = null;

export function getReaderDb(): Db {
  singleton ??= criarReaderDb(process.env);
  return singleton;
}
