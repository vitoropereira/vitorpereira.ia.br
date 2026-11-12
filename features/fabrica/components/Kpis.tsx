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
  valor: number;
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
      {serie && <Barras valores={serie} />}
    </div>
  );
}

// O produtor já variou entre singular e plural nas chaves da semana e do
// histórico; aceita as duas para o KPI não zerar em silêncio.
const daSemana = (s: StatusFabrica["semana"], ...chaves: string[]): number => {
  for (const k of chaves) {
    const v = s[k];
    if (typeof v === "number") return v;
  }
  return 0;
};
const daSerie = (h: StatusFabrica["historico"], ...chaves: string[]) =>
  chaves.map((k) => h[k]).find((x) => x !== undefined);

export function Kpis({ status }: { status: StatusFabrica }) {
  const { historico: h, semana: s } = status;
  const ativos = status.repos.reduce((a, g) => a + g.resumo.ativos, 0);
  const esperam = status.aguardando_dono.length;
  const voltas = daSemana(s, "voltas", "volta");
  const porteiro = daSemana(s, "porteiro");
  const reverts = daSemana(s, "reverts", "revert");
  const entregues = daSemana(s, "no-ar");
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Kpi rotulo="EM ANDAMENTO" valor={ativos || status.itens.length} />
      <Kpi
        rotulo="ESPERA VOCÊ"
        valor={esperam}
        cor={esperam > 0 ? CORES.espera : undefined}
        serie={h.chamou}
      />
      <Kpi
        rotulo="ENTREGUES"
        valor={entregues || soma(h["no-ar"])}
        cor={CORES.ok}
        serie={h["no-ar"]}
      />
      <Kpi
        rotulo="VOLTAS"
        valor={voltas || soma(daSerie(h, "voltas", "volta"))}
        cor={voltas > 0 ? CORES.alerta : undefined}
        serie={daSerie(h, "voltas", "volta")}
      />
      <Kpi
        rotulo="PORTEIRO SEGUROU"
        valor={porteiro || soma(h.porteiro)}
        serie={h.porteiro}
      />
      <Kpi
        rotulo="REVERTS"
        valor={reverts || soma(daSerie(h, "reverts", "revert"))}
        cor={reverts > 0 ? CORES.alerta : undefined}
        serie={daSerie(h, "reverts", "revert")}
      />
    </div>
  );
}
