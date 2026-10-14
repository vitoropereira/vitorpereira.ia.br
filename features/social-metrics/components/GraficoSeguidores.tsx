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

export function GraficoSeguidores({
  rede,
  dados,
}: {
  rede: "youtube" | "instagram";
  dados: { dia: string; valor: number | null }[];
}) {
  return (
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
            formatter={(v) => [numero(v as number), NOME_REDE[rede]]}
          />
          {/* connectNulls desligado: dia sem dado aparece como lacuna. */}
          <Line
            type="monotone"
            dataKey="valor"
            stroke={COR_REDE[rede]}
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
