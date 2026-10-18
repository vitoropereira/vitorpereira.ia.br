"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  COR_REDE,
  NOME_REDE,
  diaCurto,
  numero,
  numeroCompacto,
  type PontoGraficoSeguidores,
} from "./formato";

// Recebe só números já calculados no servidor: nada de conexão aqui. Um
// gráfico por rede porque as escalas das contas são muito diferentes.

export const ESTILO_TOOLTIP = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    fontSize: 12,
  },
  labelStyle: { color: "var(--muted-foreground)" },
} as const;

export const EIXO = {
  stroke: "var(--muted-foreground)",
  tick: { fill: "var(--muted-foreground)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

export const LEGENDA_RECONSTRUIDO = "reconstruído a partir de ganhos/perdas";

export function GraficoSeguidores({
  rede,
  dados,
}: {
  rede: "youtube" | "instagram";
  dados: PontoGraficoSeguidores[];
}) {
  const temReconstruido = dados.some((d) => d.reconstruido !== null);
  return (
    <div className="flex flex-col gap-1">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={dados}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="dia"
              tickFormatter={diaCurto}
              minTickGap={32}
              {...EIXO}
            />
            <YAxis
              width={44}
              domain={["auto", "auto"]}
              tickFormatter={numeroCompacto}
              {...EIXO}
            />
            <Tooltip
              {...ESTILO_TOOLTIP}
              labelFormatter={(d) => diaCurto(String(d))}
              formatter={(v, nome) => [numero(v as number), nome]}
            />
            {/* connectNulls desligado: dia sem dado aparece como lacuna. */}
            <Line
              type="monotone"
              dataKey="valor"
              name={NOME_REDE[rede]}
              stroke={COR_REDE[rede]}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
            {/* Mesma cor da rede, tracejada e mais apagada: é estimativa, não
              número que a API devolveu. */}
            <Line
              type="monotone"
              dataKey="reconstruido"
              name={`${NOME_REDE[rede]} (reconstruído)`}
              stroke={COR_REDE[rede]}
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeOpacity={0.55}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {temReconstruido && (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <svg width="20" height="4" aria-hidden="true">
            <line
              x1="0"
              y1="2"
              x2="20"
              y2="2"
              stroke={COR_REDE[rede]}
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeOpacity={0.55}
            />
          </svg>
          {LEGENDA_RECONSTRUIDO}
        </p>
      )}
    </div>
  );
}
