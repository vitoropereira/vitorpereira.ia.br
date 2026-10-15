import Link from "next/link";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { EstadoVazio } from "@/features/social-metrics/components/EstadoVazio";
import { PainelRedes } from "@/features/social-metrics/components/PainelRedes";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import {
  carregarPainel,
  type Painel,
} from "@/features/social-metrics/queries/painel";
import { getReaderDb } from "@/features/social-metrics/queries/readerDb";

// Número de hoje, lido a cada request: nada de cache estático com dado velho.
export const dynamic = "force-dynamic";

export default async function RedesPage() {
  // Antes de qualquer consulta: sem sessão ou sem a seção, nada é lido.
  await requireAdmin("redes");

  let painel: Painel | null = null;
  let erro: string | null = null;
  try {
    painel = await carregarPainel(getReaderDb(), new Date());
  } catch (e) {
    // Banco fora do ar ou env ausente vira aviso na tela, não 500. A mensagem
    // do driver não vai pro HTML: pode citar host e usuário.
    console.error("[admin/redes] falha ao ler o painel", e);
    erro =
      "Não foi possível ler as métricas agora. Confira a conexão do papel social_reader.";
  }

  return (
    <div data-largura="ampla" className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl font-semibold">Redes sociais</h1>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/admin/redes/pecas"
            className="underline underline-offset-4"
          >
            Peças por idade
          </Link>
          <Link
            href="/admin/redes/casamentos"
            className="underline underline-offset-4"
          >
            Casamentos
          </Link>
        </nav>
      </header>

      {erro && <Aviso>{erro}</Aviso>}
      {painel?.vazio && <EstadoVazio />}
      {painel && !painel.vazio && <PainelRedes painel={painel} />}
    </div>
  );
}
