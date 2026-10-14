/**
 * social:collect — coleta diária das métricas das redes e grava no Supabase
 * pelo papel `social_collector`. Roda no GitHub Actions
 * (.github/workflows/social-metrics.yml) e localmente.
 *
 *   pnpm social:collect [--rede youtube|all] [--job collect|backfill]
 *   pnpm social:backfill [--rede youtube|all]
 */
import { parseArgs } from "node:util";
import { criarDb } from "../features/social-metrics/db.ts";
import { diaSaoPaulo } from "../features/social-metrics/dia.ts";
import {
  codigoDeSaida,
  descreverErro,
  executarColeta,
} from "../features/social-metrics/executar.ts";
import { criarGravador } from "../features/social-metrics/gravador.ts";
import type {
  Fetch,
  Job,
  Rede,
  ResultadoRun,
  SocialAdapter,
} from "../features/social-metrics/types.ts";
import { criarAdapterYouTube } from "../features/social-metrics/youtube/adapter.ts";
import {
  credenciaisDoAmbiente,
  obterAccessToken,
} from "../features/social-metrics/youtube/auth.ts";

const AJUDA = `uso: pnpm social:collect [--rede youtube|all] [--job collect|backfill]`;

// Rede nova entra aqui e no workflow; o resto do pipeline é comum.
const ADAPTERS: Partial<
  Record<Rede, (fetch: Fetch, dia: string) => Promise<SocialAdapter>>
> = {
  // O `dia` vem de quem chama: um relógio só por run, senão um run que vira a
  // meia-noite coleta posts num dia e conta noutro.
  youtube: async (fetch, dia) => {
    const accessToken = await obterAccessToken(
      fetch,
      credenciaisDoAmbiente(process.env),
    );
    return criarAdapterYouTube({ fetch, accessToken, hoje: dia });
  },
};

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: {
      rede: { type: "string", default: "all" },
      job: { type: "string", default: "collect" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(AJUDA);
    return 0;
  }

  const job = values.job as Job;
  if (job !== "collect" && job !== "backfill") {
    console.error(`✖ --job inválido: ${values.job}\n${AJUDA}`);
    return 1;
  }
  const redes: Rede[] =
    values.rede === "all"
      ? (Object.keys(ADAPTERS) as Rede[])
      : [values.rede as Rede];
  if (redes.some((r) => !ADAPTERS[r])) {
    console.error(`✖ --rede inválida: ${values.rede}\n${AJUDA}`);
    return 1;
  }

  const db = criarDb(process.env);
  const gravador = criarGravador(db);
  const dia = diaSaoPaulo(new Date());
  const fetch = globalThis.fetch as unknown as Fetch;
  const resultados: ResultadoRun[] = [];

  try {
    // Cada rede isolada: a falha de uma não impede a coleta da outra.
    for (const rede of redes) {
      let r: ResultadoRun;
      try {
        const adapter = await ADAPTERS[rede]!(fetch, dia);
        r = await executarColeta({ rede, job, adapter, gravador, dia });
      } catch (e) {
        // Falha antes do run abrir (credencial, token): registra mesmo assim,
        // para o painel ver que o job parou.
        const erro = descreverErro(e);
        try {
          const id = await gravador.iniciarRun(rede, job);
          await gravador.finalizarRun(id, { ok: false, erro, linhas: 0 });
        } catch (e2) {
          console.error(`⚠ ${rede}: não gravou o run: ${descreverErro(e2)}`);
        }
        r = { rede, job, ok: false, erro, linhas: 0 };
      }
      resultados.push(r);
      const marca = r.ok ? "✔" : "✖";
      console.log(
        `${marca} ${rede} ${job} ${dia}: ${r.linhas} linhas${r.erro ? ` — ${r.erro}` : ""}`,
      );
    }
  } finally {
    await db.fechar();
  }
  return codigoDeSaida(resultados);
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(`\n✖ ${descreverErro(e)}\n`);
    process.exit(1);
  },
);
