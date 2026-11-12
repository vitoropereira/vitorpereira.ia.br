import { CORES } from "../cores";
import type { StatusFabrica } from "../status";

const soma = (xs: number[] | undefined) =>
  (xs ?? []).reduce((a, b) => a + b, 0);

// 7 barras, uma por dia; a altura é relativa ao maior valor da série.
function Barras({ valores }: { valores: number[] }) {
  const max = Math.max(1, ...valores);
  return (
    <svg
      viewBox="0 0 49 16"
      className="h-4 w-12"
      role="img"
      aria-label={`últimos 7 dias: ${valores.join(", ")}`}
    >
      {valores.map((v, i) => {
        const h = Math.max(1, (v / max) * 16);
        return (
          <rect
            key={i}
            x={i * 7}
            y={16 - h}
            width={5}
            height={h}
            fill={CORES.barra}
          />
        );
      })}
    </svg>
  );
}

function Kpi({
  rotulo,
  valor,
  cor,
  serie,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  serie?: number[];
}) {
  return (
    <div className="border-border flex flex-col gap-1 rounded-md border p-3">
      <span className="text-muted-foreground text-[11px] tracking-wider">
        {rotulo}
      </span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={cor ? { color: cor } : undefined}
      >
        {valor}
      </span>
      {serie && serie.length > 0 && <Barras valores={serie} />}
    </div>
  );
}

export function Kpis({ status }: { status: StatusFabrica }) {
  const { historico, gargalo, tempoMedioHoras } = status;
  const esperam = status.aguardando_dono.length;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi rotulo="EM ANDAMENTO" valor={String(status.itens.length)} />
      <Kpi
        rotulo="AGUARDANDO"
        valor={String(esperam)}
        cor={esperam > 0 ? CORES.espera : undefined}
      />
      <Kpi
        rotulo="MERGES 7D"
        valor={String(soma(historico.merge))}
        cor={CORES.ok}
        serie={historico.merge}
      />
      <Kpi
        rotulo="VOLTAS 7D"
        valor={String(soma(historico.volta))}
        cor={soma(historico.volta) > 0 ? CORES.alerta : undefined}
        serie={historico.volta}
      />
      <Kpi
        rotulo="TEMPO MÉDIO"
        valor={
          tempoMedioHoras === null ? "—" : `${Math.round(tempoMedioHoras)} h`
        }
      />
      <Kpi
        rotulo="GARGALO"
        valor={
          gargalo
            ? (status.estacoes.find((e) => e.id === gargalo.estacao)?.nome ??
              (gargalo.estacao || gargalo.texto))
            : "—"
        }
        cor={gargalo ? CORES.espera : undefined}
      />
    </div>
  );
}
