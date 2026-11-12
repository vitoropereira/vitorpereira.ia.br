import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import { EsperandoVoce } from "@/features/fabrica/components/EsperandoVoce";
import { Estacoes } from "@/features/fabrica/components/Estacoes";
import { Eventos } from "@/features/fabrica/components/Eventos";
import { Kpis } from "@/features/fabrica/components/Kpis";
import { Painel } from "@/features/fabrica/components/Painel";
import { Rodape } from "@/features/fabrica/components/Rodape";
import { TabelaRepos } from "@/features/fabrica/components/TabelaRepos";
import { CORES } from "@/features/fabrica/cores";
import { carregarStatus } from "@/features/fabrica/status";

// Fonte mono só neste painel; o resto do admin segue a fonte do site.
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap" });

// Estado da fábrica de agora, lido a cada request.
export const dynamic = "force-dynamic";

export default async function FabricaPage() {
  // Antes de qualquer busca: sem sessão ou sem a seção, o GitHub não é chamado.
  await requireAdmin("fabrica");

  const agora = new Date();
  const r = await carregarStatus(agora);

  return (
    <div
      data-largura="ampla"
      className={`${mono.className} flex flex-col gap-4 p-4`}
      style={{ background: CORES.fundo, color: CORES.texto }}
    >
      <header className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="text-xs underline underline-offset-4"
          style={{ color: CORES.rotulo }}
        >
          ← Admin
        </Link>
        <h1 className="sr-only">Fábrica (dev-flow)</h1>
        {!r.erro && (
          <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
            <span>
              <span style={{ color: CORES.forte }}>fabrica@dev-flow </span>
              {r.velho ? (
                <span style={{ color: CORES.espera }}>
                  ● parado
                  {r.minutosDesde !== null && ` há ${r.minutosDesde} min`}
                </span>
              ) : (
                <span style={{ color: CORES.ok }}>● online</span>
              )}
            </span>
            <span className="text-xs" style={{ color: CORES.rotulo }}>
              {r.minutosDesde === null
                ? "atualizado em data desconhecida"
                : `atualizado há ${r.minutosDesde} min`}
            </span>
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
          <EsperandoVoce itens={r.status.aguardando_dono} />
          <Kpis status={r.status} />
          <Estacoes estacoes={r.status.estacoes} repos={r.status.repos} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Painel titulo="Repos">
              <TabelaRepos repos={r.status.repos} agora={agora} />
            </Painel>
            <Painel titulo="Eventos">
              <Eventos eventos={r.status.eventos} agora={agora} />
            </Painel>
          </div>
          <Rodape status={r.status} />
        </>
      )}
    </div>
  );
}
