"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EIXO, ESTILO_TOOLTIP } from "./GraficoSeguidores";
import { COR_REDE, diaCurto, numero, numeroCompacto } from "./formato";

export function GraficoSemanal({
  rede,
  dados,
}: {
  rede: "youtube" | "instagram";
  dados: { semana: string; views: number | null; alcance: number | null }[];
}) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="semana" tickFormatter={diaCurto} {...EIXO} />
          <YAxis width={44} tickFormatter={numeroCompacto} {...EIXO} />
          <Tooltip
            {...ESTILO_TOOLTIP}
            cursor={{ fill: "var(--muted)" }}
            labelFormatter={(s) => `Semana de ${diaCurto(String(s))}`}
            formatter={(v, nome) => [
              numero((v as number | null) ?? null),
              nome,
            ]}
          />
          <Legend
            iconType="square"
            wrapperStyle={{ fontSize: 12 }}
            // Texto na cor do tema: o default herda a cor da série, e o tom
            // claro do alcance fica ilegível.
            formatter={(v) => (
              <span style={{ color: "var(--muted-foreground)" }}>{v}</span>
            )}
          />
          <Bar
            dataKey="views"
            name="Views"
            fill={COR_REDE[rede]}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          {/* Mesma cor da rede, mais clara. color-mix em vez de fillOpacity
              para a legenda herdar o mesmo tom da barra. */}
          <Bar
            dataKey="alcance"
            name="Alcance"
            fill={`color-mix(in oklab, ${COR_REDE[rede]} 40%, transparent)`}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
