import Link from "next/link";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { ListaCasamentos } from "@/features/social-metrics/components/ListaCasamentos";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import { criarLeitor } from "@/features/social-metrics/content-os/leitor";
import { JANELA_DIAS } from "@/features/social-metrics/content-os/casamentos";
import {
  carregarCasamentosPainel,
  type CasamentosPainel,
} from "@/features/social-metrics/queries/casamentos";
import { getReaderDb } from "@/features/social-metrics/queries/readerDb";
import type { Fetch } from "@/features/social-metrics/types";

export const dynamic = "force-dynamic";

export default async function CasamentosPage() {
  await requireAdmin("redes");

  // Token fine-grained, só leitura do content-os. Sem ele a tela avisa em vez
  // de quebrar; o leitor só faz GET.
  const token = process.env.CONTENT_OS_READ_TOKEN;
  const leitor = token
    ? criarLeitor({ fetch: fetch as unknown as Fetch, token })
    : null;

  let painel: CasamentosPainel | null = null;
  let erro: string | null = null;
  try {
    painel = await carregarCasamentosPainel({ db: getReaderDb(), leitor });
  } catch (e) {
    console.error("[admin/redes/casamentos] falha ao ler os posts", e);
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
        <h1 className="text-2xl font-semibold">Casamentos</h1>
        <p className="text-muted-foreground text-sm">
          Posts coletados que nenhuma peça reivindicou, com as peças livres da
          mesma rede criadas até {JANELA_DIAS} dias antes da publicação. Para
          confirmar, cole o id no frontmatter da peça no content-os; o próximo
          sync liga os dois.
        </p>
      </header>

      {erro && <Aviso>{erro}</Aviso>}
      {painel?.erro && <Aviso>{painel.erro}</Aviso>}
      {painel?.avisos.map((a) => (
        <Aviso key={a}>{a}</Aviso>
      ))}
      {painel && !painel.erro && painel.postsSemPeca === 0 && (
        <p className="text-muted-foreground text-sm">
          Todo post coletado já tem peça.
        </p>
      )}
      {painel && !painel.erro && painel.postsSemPeca > 0 && (
        <>
          <p className="text-sm">
            {painel.postsSemPeca} post(s) sem peça; {painel.sugestoes.length}{" "}
            com candidata.
          </p>
          <ListaCasamentos sugestoes={painel.sugestoes} />
        </>
      )}
    </div>
  );
}
