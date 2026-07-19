/**
 * crosspost:stats — lê as syndications do Supabase, puxa tabcoins/comentários
 * atuais da API do TabNews (grava um snapshot), e imprime uma tabela no terminal.
 * Cliques (métrica primária) vêm do vitor_syndication_clicks. Sem dashboard.
 */
import { getSyndicationsWithStats, snapshotMetrics } from "../lib/analytics/record.ts";
import { getContentMetrics } from "../lib/tabnews/client.ts";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}
const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Extrai {owner, slug} de uma URL do TabNews. */
function parseTabNews(url: string | null): { owner: string; slug: string } | null {
  if (!url) return null;
  const m = url.match(/tabnews\.com\.br\/([^/]+)\/([^/?#]+)/);
  return m ? { owner: m[1], slug: m[2] } : null;
}

function ageDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n) : s + " ".repeat(n - s.length);
}

async function main(): Promise<void> {
  if (!process.env.SUPABASE_TOKEN || !process.env.SUPABASE_PROJECT_REF) {
    fail("Defina SUPABASE_TOKEN e SUPABASE_PROJECT_REF no .env.development.local.");
  }

  const rows = await getSyndicationsWithStats();
  if (rows.length === 0) {
    console.log("Nenhuma syndication registrada ainda. Publique com `pnpm crosspost <post>`.");
    return;
  }

  // Atualiza métricas do TabNews (best-effort) e monta a tabela.
  const table: { slug: string; format: string; age: number; tabcoins: string; comments: string; clicks: number }[] = [];
  for (const r of rows) {
    const tn = parseTabNews(r.external_url);
    let tabcoins = r.tabcoins;
    let comments = r.comments_count;
    if (tn) {
      try {
        const m = await getContentMetrics(tn.owner, tn.slug);
        tabcoins = m.tabcoins;
        comments = m.comments;
        await snapshotMetrics(r.id, m.tabcoins, m.comments);
      } catch (e) {
        console.warn(`⚠ métricas de ${tn.slug} falharam: ${errMsg(e)}`);
      }
    }
    table.push({
      slug: tn?.slug ?? r.post_permalink,
      format: r.format,
      age: ageDays(r.posted_at),
      tabcoins: tabcoins == null ? "—" : String(tabcoins),
      comments: comments == null ? "—" : String(comments),
      clicks: r.clicks,
    });
  }

  // Impressão.
  console.log("");
  console.log(
    pad("post", 42) + pad("formato", 9) + pad("idade", 7) + pad("tabcoins", 9) + pad("coment.", 9) + "cliques",
  );
  console.log("─".repeat(84));
  for (const t of table) {
    console.log(
      pad(t.slug, 42) + pad(t.format, 9) + pad(`${t.age}d`, 7) + pad(t.tabcoins, 9) + pad(t.comments, 9) + String(t.clicks),
    );
  }
  console.log("");
  console.log("⭐ cliques = métrica primária (first-party). tabcoins/coment. = vaidade/contexto.");
  console.log("   Amostra pequena → aprendizado direcional, não experimento controlado.");
}

main().catch((e: unknown) => fail(errMsg(e)));
