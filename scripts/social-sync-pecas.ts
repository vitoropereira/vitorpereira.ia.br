/**
 * social:sync-pecas — liga os posts coletados às peças do content-os e grava as
 * metas de cadência. Só lê o content-os (GET na API do GitHub); escreve no
 * Supabase pelo papel `social_collector`. Roda depois das coletas no Actions
 * (.github/workflows/social-metrics.yml) e localmente.
 *
 *   pnpm social:sync-pecas
 */
import { criarDb } from "../features/social-metrics/db.ts";
import { criarLeitor } from "../features/social-metrics/content-os/leitor.ts";
import { executarSyncPecas } from "../features/social-metrics/content-os/sync.ts";
import { descreverErro } from "../features/social-metrics/executar.ts";
import { criarGravador } from "../features/social-metrics/gravador.ts";
import type { Fetch } from "../features/social-metrics/types.ts";

async function main(): Promise<number> {
  const token = process.env.CONTENT_OS_READ_TOKEN;
  const db = criarDb(process.env);
  const gravador = criarGravador(db);

  try {
    if (!token) {
      // Falha antes do run abrir: registra mesmo assim, para o painel ver que
      // o job parou.
      const erro = "CONTENT_OS_READ_TOKEN ausente";
      try {
        const id = await gravador.iniciarRun(null, "sync_pecas");
        await gravador.finalizarRun(id, { ok: false, erro, linhas: 0 });
      } catch (e) {
        console.error(`⚠ não gravou o run: ${descreverErro(e)}`);
      }
      console.error(`✖ ${erro}`);
      return 1;
    }

    const leitor = criarLeitor({
      fetch: globalThis.fetch as unknown as Fetch,
      token,
    });
    const r = await executarSyncPecas({ leitor, gravador });
    const marca = r.ok ? "✔" : "✖";
    console.log(
      `${marca} sync_pecas: ${r.linhas} linhas${r.erro ? ` — ${r.erro}` : ""}`,
    );
    return r.ok ? 0 : 1;
  } finally {
    await db.fechar();
  }
}

main().then(
  (code) => process.exit(code),
  (e: unknown) => {
    console.error(`\n✖ ${descreverErro(e)}\n`);
    process.exit(1);
  },
);
