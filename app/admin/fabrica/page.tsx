import Link from "next/link";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import { JetBrains_Mono } from "next/font/google";
import { EsperandoVoce } from "@/features/fabrica/components/EsperandoVoce";
import { Estacoes } from "@/features/fabrica/components/Estacoes";
import { Eventos } from "@/features/fabrica/components/Eventos";
import { Kpis } from "@/features/fabrica/components/Kpis";
import { Rodape } from "@/features/fabrica/components/Rodape";
import { TabelaRepos } from "@/features/fabrica/components/TabelaRepos";
import { carregarStatus } from "@/features/fabrica/status";

// Fonte mono só neste painel; o resto do admin segue a fonte do site.
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap" });

// Estado da fábrica de agora, lido a cada request.
export const dynamic = "force-dynamic";

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function FabricaPage() {
  // Antes de qualquer busca: sem sessão ou sem a seção, o GitHub não é chamado.
  await requireAdmin("fabrica");

  const r = await carregarStatus(new Date());

  return (
    <div
      data-largura="ampla"
      className={`${mono.className} flex flex-col gap-8`}
    >
      <header className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl font-semibold">Fábrica (dev-flow)</h1>
        {!r.erro && r.minutosDesde !== null && (
          <p className="text-muted-foreground text-sm">
            atualizado há {r.minutosDesde} min
          </p>
        )}
      </header>

      {r.erro === "sem-token" && (
        <Aviso>
          Token do GitHub não configurado (FACTORY_GITHUB_TOKEN, só leitura).
        </Aviso>
      )}
      {r.erro === "indisponivel" && (
        <Aviso>Não foi possível ler o status da fábrica agora.</Aviso>
      )}
      {!r.erro && (
        <>
          {r.velho && (
            <Aviso>
              {r.minutosDesde === null
                ? "O status não informa quando foi gerado."
                : `O status foi gerado há ${r.minutosDesde} min; a fábrica pode estar parada.`}
            </Aviso>
          )}
          {r.status.erros.length > 0 && (
            <Aviso>
              A fábrica não conseguiu ler: {r.status.erros.join("; ")}
            </Aviso>
          )}
          <Kpis status={r.status} />
          <Secao titulo="ESPERA VOCÊ">
            <EsperandoVoce itens={r.status.aguardando_dono} />
          </Secao>
          <Secao titulo="Estações">
            <Estacoes estacoes={r.status.estacoes} repos={r.status.repos} />
          </Secao>
          <Secao titulo="Repos">
            <TabelaRepos repos={r.status.repos} />
          </Secao>
          <Secao titulo="Eventos">
            <Eventos eventos={r.status.eventos} />
          </Secao>
          <Rodape status={r.status} minutosDesde={r.minutosDesde} />
        </>
      )}
    </div>
  );
}
