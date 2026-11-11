import Link from "next/link";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { Aviso } from "@/features/social-metrics/components/SaudeColeta";
import { EsperandoVoce } from "@/features/fabrica/components/EsperandoVoce";
import { ItensPorRepo } from "@/features/fabrica/components/ItensPorRepo";
import { LinhaEstacoes } from "@/features/fabrica/components/LinhaEstacoes";
import { Semana } from "@/features/fabrica/components/Semana";
import { carregarStatus } from "@/features/fabrica/status";

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
    <div data-largura="ampla" className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="text-muted-foreground text-sm underline underline-offset-4"
        >
          ← Admin
        </Link>
        <h1 className="text-2xl font-semibold">Fábrica</h1>
      </header>

      {r.erro === "sem-token" && (
        <Aviso>
          Defina FACTORY_GITHUB_TOKEN no ambiente para ler o status da fábrica.
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
          <Secao titulo="Estações">
            <LinhaEstacoes itens={r.status.itens} />
          </Secao>
          <Secao titulo="Esperando você">
            <EsperandoVoce itens={r.status.aguardando_dono} />
          </Secao>
          <Secao titulo="Itens por repo">
            <ItensPorRepo itens={r.status.itens} />
          </Secao>
          <Secao titulo="Semana">
            <Semana semana={r.status.semana} eventos={r.status.eventos} />
          </Secao>
        </>
      )}
    </div>
  );
}
