import type { LinhaCadencia } from "../queries/painel";
import { COR_REDE, NOME_REDE, NOME_TIPO, diaCurto } from "./formato";

// "x de y" na semana atual e "x/y" no histórico. Abaixo da meta vem marcado
// por texto (↓), não só por cor.
function Celula({ feitos, meta }: { feitos: number; meta: number | null }) {
  if (meta === null) return <span>{feitos}</span>;
  const abaixo = feitos < meta;
  return (
    <span className={abaixo ? "text-muted-foreground" : "font-medium"}>
      {feitos}/{meta}
      {abaixo && <span aria-label="abaixo da meta"> ↓</span>}
    </span>
  );
}

export function Cadencia({
  linhas,
  semanas,
}: {
  linhas: LinhaCadencia[];
  semanas: string[];
}) {
  if (linhas.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma meta cadastrada e nenhum post publicado nas últimas{" "}
        {semanas.length} semanas.
      </p>
    );
  }
  const atual = semanas.length - 1;
  return (
    <div className="-mx-6 overflow-x-auto px-6">
      <table className="w-full min-w-[40rem] text-sm tabular-nums">
        <thead>
          <tr className="text-muted-foreground border-b text-left text-xs">
            <th className="py-2 pr-3 font-normal">Rede · tipo</th>
            <th className="py-2 pr-3 font-normal">Semana atual</th>
            {semanas.slice(0, atual).map((s) => (
              <th key={s} className="py-2 pr-3 text-right font-normal">
                {diaCurto(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const agora = l.semanas[atual];
            return (
              <tr
                key={`${l.rede}:${l.tipo}`}
                className="border-b last:border-0"
              >
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  <span
                    className="mr-2 inline-block size-2 rounded-full"
                    style={{ background: COR_REDE[l.rede] }}
                    aria-hidden
                  />
                  {NOME_REDE[l.rede]} · {NOME_TIPO[l.tipo] ?? l.tipo}
                </th>
                <td className="py-2 pr-3 whitespace-nowrap">
                  <strong>{agora.feitos}</strong>
                  {agora.meta !== null && <> de {agora.meta}</>}
                  {agora.meta === null && (
                    <span className="text-muted-foreground"> (sem meta)</span>
                  )}
                </td>
                {l.semanas.slice(0, atual).map((c) => (
                  <td
                    key={c.semana}
                    className="py-2 pr-3 text-right whitespace-nowrap"
                  >
                    <Celula feitos={c.feitos} meta={c.meta} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
