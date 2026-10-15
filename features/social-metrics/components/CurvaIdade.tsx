"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EIXO, ESTILO_TOOLTIP } from "./GraficoSeguidores";
import { COR_REDE, numero, numeroCompacto } from "./formato";

// Views acumuladas por idade do post (dias desde a publicação). Recebe a curva
// pronta do servidor. Cor segue a rede; post de outra peça da mesma pauta vem
// tracejado e em tom neutro, para não depender só da cor.

export interface SerieCurva {
  id: string;
  rede: "youtube" | "instagram";
  rotulo: string;
  derivado: boolean;
  pontos: { idade: number; views: number | null }[];
}

export function CurvaIdade({ series }: { series: SerieCurva[] }) {
  const maxIdade = Math.max(0, ...series.map((s) => s.pontos.length - 1));
  const dados = Array.from({ length: maxIdade + 1 }, (_, idade) => {
    const linha: Record<string, number | null> = { idade };
    for (const s of series) linha[s.id] = s.pontos[idade]?.views ?? null;
    return linha;
  });
  const rotulo = Object.fromEntries(series.map((s) => [s.id, s.rotulo]));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={dados}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="idade"
            type="number"
            domain={[0, maxIdade]}
            allowDecimals={false}
            tickFormatter={(d) => `D+${d}`}
            minTickGap={24}
            {...EIXO}
          />
          <YAxis width={44} tickFormatter={numeroCompacto} {...EIXO} />
          <Tooltip
            {...ESTILO_TOOLTIP}
            labelFormatter={(d) => `D+${d}`}
            formatter={(v, id) => [
              numero(v as number),
              rotulo[String(id)] ?? String(id),
            ]}
          />
          <Legend
            formatter={(id) => (
              <span className="text-foreground text-xs">
                {rotulo[String(id)] ?? String(id)}
              </span>
            )}
          />
          {series.map((s) => (
            <Line
              key={s.id}
              type="monotone"
              dataKey={s.id}
              name={s.id}
              stroke={s.derivado ? "var(--muted-foreground)" : COR_REDE[s.rede]}
              strokeWidth={2}
              strokeDasharray={s.derivado ? "5 4" : undefined}
              dot={false}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
