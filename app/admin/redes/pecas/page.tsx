import Link from "next/link";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { FiltrosPecas } from "@/features/social-metrics/components/FiltrosPecas";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import { TabelaPecas } from "@/features/social-metrics/components/TabelaPecas";
import {
  carregarPecas,
  parseFiltros,
  type Ranking,
} from "@/features/social-metrics/queries/pecas";
import { getReaderDb } from "@/features/social-metrics/queries/readerDb";

export const dynamic = "force-dynamic";

export default async function PecasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Antes de qualquer consulta: sem sessão ou sem a seção, nada é lido.
  await requireAdmin("redes");

  const filtros = parseFiltros(await searchParams);
  let ranking: Ranking | null = null;
  let erro: string | null = null;
  try {
    ranking = await carregarPecas(getReaderDb(), filtros, new Date());
  } catch (e) {
    // Mesma regra do painel: a mensagem do driver fica no log, não no HTML.
    console.error("[admin/redes/pecas] falha ao ler o ranking", e);
    erro =
      "Não foi possível ler as métricas agora. Confira a conexão do papel social_reader.";
  }

  return (
    <div data-largura="ampla" className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin/redes"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← Redes sociais
        </Link>
        <h1 className="text-2xl font-semibold">Peças por idade</h1>
        <p className="text-muted-foreground text-sm">
          Cada post comparado na mesma idade: views acumuladas até D+1, D+7 e
          D+30 desde a publicação (dia de Brasília). &quot;—&quot; quer dizer
          que o post ainda não chegou nessa idade ou não há dado.
        </p>
      </header>

      {erro && <Aviso>{erro}</Aviso>}
      {ranking && (
        <>
          <FiltrosPecas filtros={filtros} opcoes={ranking.opcoes} />
          {ranking.linhas.length ? (
            <TabelaPecas linhas={ranking.linhas} filtros={filtros} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum post com esses filtros.
            </p>
          )}
        </>
      )}
    </div>
  );
}
