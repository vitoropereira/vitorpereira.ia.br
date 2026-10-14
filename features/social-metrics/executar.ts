import { DIAS_REPROCESSADOS, somarDias } from "./dia.ts";
import type { Gravador } from "./gravador.ts";
import type { Job, Rede, ResultadoRun, SocialAdapter } from "./types.ts";

// Anterior a qualquer post das duas redes: o adapter corta pela publicação.
export const INICIO_BACKFILL = "2005-04-23";

const MAX_ERRO = 2000;

/** Mensagem do erro com o código do Postgres (ex.: 42501) quando houver. */
export function descreverErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const code =
    e && typeof e === "object" && "code" in e && typeof e.code === "string"
      ? e.code
      : null;
  const texto = code ? `${code}: ${msg}` : msg;
  return texto.slice(0, MAX_ERRO);
}

/** Exit code da CLI: qualquer rede falha → 1, para o Actions marcar vermelho. */
export function codigoDeSaida(resultados: ResultadoRun[]): number {
  return resultados.every((r) => r.ok) ? 0 : 1;
}

export interface ParametrosColeta {
  rede: Rede;
  job: Job;
  adapter: SocialAdapter;
  gravador: Gravador;
  /** Dia de referência (Brasília). */
  dia: string;
}

/**
 * Abre o run, coleta, grava e fecha o run. Não lança: devolve `ok = false` e
 * quem chama decide o exit code. O run é fechado mesmo quando a coleta cai,
 * senão o painel acha que o job ainda está rodando.
 */
export async function executarColeta(
  p: ParametrosColeta,
): Promise<ResultadoRun> {
  let runId: string;
  try {
    runId = await p.gravador.iniciarRun(p.rede, p.job);
  } catch (e) {
    return {
      rede: p.rede,
      job: p.job,
      ok: false,
      erro: `não abriu o run: ${descreverErro(e)}`,
      linhas: 0,
    };
  }

  let ok = false;
  let erro: string | null = null;
  let linhas = 0;
  try {
    const desde =
      p.job === "backfill"
        ? INICIO_BACKFILL
        : somarDias(p.dia, -(DIAS_REPROCESSADOS - 1));
    const conta = await p.adapter.coletarConta(p.dia);
    const posts = await p.adapter.coletarPosts(desde, p.job);

    const ids = await p.gravador.upsertPosts(posts.posts);
    linhas += ids.size;
    linhas += await p.gravador.upsertMetricas(ids, posts.metricas);
    linhas += await p.gravador.upsertConta(conta.contas);

    const avisos = [...conta.avisos, ...posts.avisos];
    ok = true;
    erro = avisos.length
      ? `aviso: ${avisos.join("; ")}`.slice(0, MAX_ERRO)
      : null;
  } catch (e) {
    ok = false;
    erro = descreverErro(e);
  } finally {
    try {
      await p.gravador.finalizarRun(runId, { ok, erro, linhas });
    } catch (e) {
      ok = false;
      erro = `${erro ?? ""}${erro ? "; " : ""}não fechou o run: ${descreverErro(e)}`;
    }
  }
  return { rede: p.rede, job: p.job, ok, erro, linhas };
}
