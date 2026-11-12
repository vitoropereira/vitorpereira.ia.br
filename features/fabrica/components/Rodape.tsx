import { formatarTempoMedio } from "../formato";
import type { StatusFabrica } from "../status";

export function Rodape({ status }: { status: StatusFabrica }) {
  const { gargalo } = status;
  const nome = gargalo
    ? (status.estacoes.find((e) => e.id === gargalo.estacao)?.nome ??
      gargalo.estacao)
    : "";
  return (
    <footer className="text-muted-foreground grid gap-2 text-xs sm:grid-cols-2">
      <p>
        gargalo:{" "}
        {gargalo
          ? `${nome} · ${gargalo.qtd} ${gargalo.qtd === 1 ? "item" : "itens"}`
          : "nada andando"}
      </p>
      <p>
        pedido → no ar (média): {formatarTempoMedio(status.tempoMedioHoras)}
      </p>
    </footer>
  );
}
