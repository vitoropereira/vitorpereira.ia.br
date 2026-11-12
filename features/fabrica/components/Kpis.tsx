import { CORES } from "../cores";
import { DIAS_HISTORICO, type StatusFabrica } from "../status";

const ZEROS = Array<number>(DIAS_HISTORICO).fill(0);

const soma = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// Uma barra por dia; a altura é relativa ao maior valor da série.
function Barras({ valores, cor }: { valores: number[]; cor: string }) {
  const max = Math.max(1, ...valores);
  return (
    <svg
      viewBox="0 0 49 16"
      className="h-4 w-12"
      role="img"
      aria-label={`últimos ${DIAS_HISTORICO} dias: ${valores.join(", ")}`}
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
            fill={v > 0 ? cor : CORES.borda}
          />
        );
      })}
    </svg>
  );
}

function Kpi({
  rotulo,
  valor,
  cor = CORES.forte,
  serie,
}: {
  rotulo: string;
  valor: number;
  cor?: string;
  serie?: number[];
}) {
  return (
    <div
      className="flex flex-col gap-1 border p-3"
      style={{ background: CORES.painel, borderColor: CORES.borda }}
    >
      <span
        className="text-[11px] tracking-wider"
        style={{ color: CORES.rotulo }}
      >
        {rotulo}
      </span>
      <span
        className="text-2xl font-semibold tabular-nums"
        style={{ color: cor }}
      >
        {valor}
      </span>
      {serie && <Barras valores={serie} cor={cor} />}
    </div>
  );
}

export function Kpis({ status }: { status: StatusFabrica }) {
  const { historico: h, semana: s } = status;
  // Tipo ausente no histórico (status v1, ou dia sem evento) é série zerada.
  const serie = (tipo: string) => h[tipo] ?? ZEROS;
  const ativos = status.repos.reduce((a, g) => a + g.resumo.ativos, 0);
  const esperam = status.aguardando_dono.length;
  const noAr = s["no-ar"];
  const entregues = typeof noAr === "number" ? noAr : 0;
  const voltas = soma(serie("volta"));
  const porteiro = soma(serie("porteiro"));
  const reverts = soma(serie("revert"));
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi rotulo="EM ANDAMENTO" valor={ativos} cor={CORES.destaque} />
      <Kpi
        rotulo="ESPERA VOCÊ"
        valor={esperam}
        cor={CORES.espera}
        serie={serie("chamou")}
      />
      <Kpi
        rotulo="ENTREGUES"
        valor={entregues}
        cor={CORES.ok}
        serie={serie("no-ar")}
      />
      <Kpi
        rotulo="VOLTAS"
        valor={voltas}
        cor={CORES.volta}
        serie={serie("volta")}
      />
      <Kpi
        rotulo="PORTEIRO SEGUROU"
        valor={porteiro}
        cor={CORES.porteiro}
        serie={serie("porteiro")}
      />
      <Kpi
        rotulo="REVERTS"
        valor={reverts}
        cor={CORES.revert}
        serie={serie("revert")}
      />
    </div>
  );
}
