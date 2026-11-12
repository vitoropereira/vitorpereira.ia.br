import { CORES } from "../cores";
import { formatarTempoMedio } from "../formato";
import type { StatusFabrica } from "../status";

function Bloco({
  rotulo,
  cor = CORES.forte,
  children,
}: {
  rotulo: string;
  cor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-1 border p-3"
      style={{ background: CORES.painel, borderColor: CORES.borda }}
    >
      <span
        className="text-[11px] tracking-wider uppercase"
        style={{ color: CORES.rotulo }}
      >
        {rotulo}
      </span>
      <div className="text-sm" style={{ color: cor }}>
        {children}
      </div>
    </div>
  );
}

export function Rodape({ status }: { status: StatusFabrica }) {
  const { gargalo, erros } = status;
  const nome = gargalo
    ? (status.estacoes.find((e) => e.id === gargalo.estacao)?.nome ??
      gargalo.estacao)
    : "";
  return (
    <footer
      className={`grid gap-3 ${erros.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
    >
      <Bloco
        rotulo="gargalo agora"
        cor={gargalo ? CORES.porteiro : CORES.rotulo}
      >
        {gargalo
          ? `${nome} · ${gargalo.qtd} ${gargalo.qtd === 1 ? "item" : "itens"}`
          : "nada andando"}
      </Bloco>
      <Bloco
        rotulo="pedido → no ar (média)"
        cor={status.tempoMedioHoras === null ? CORES.rotulo : CORES.forte}
      >
        {formatarTempoMedio(status.tempoMedioHoras)}
      </Bloco>
      {/* Sem erro o bloco some: um "0 erros" fixo vira ruído. */}
      {erros.length > 0 && (
        <Bloco rotulo={`erros · ${erros.length}`} cor={CORES.revert}>
          <ul role="alert" className="flex flex-col gap-1">
            {erros.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Bloco>
      )}
    </footer>
  );
}
