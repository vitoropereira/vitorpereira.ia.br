import { CORES, corTipo } from "../cores";
import { formatarHoraEvento } from "../formato";
import type { EventoFabrica } from "../status";

const MAX_EVENTOS = 20;

export function Eventos({
  eventos,
  agora = new Date(),
}: {
  eventos: EventoFabrica[];
  agora?: Date;
}) {
  // Por instante, não por texto: offsets diferentes quebrariam a ordem. Data
  // ilegível (NaN) vai pro fim.
  const instante = (em: string) => Date.parse(em) || 0;
  const recentes = [...eventos]
    .sort((a, b) => instante(b.em) - instante(a.em))
    .slice(0, MAX_EVENTOS);
  if (recentes.length === 0) {
    return (
      <p className="text-sm" style={{ color: CORES.rotulo }}>
        Sem eventos na semana.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {recentes.map((e, i) => (
        <li key={`${e.em}:${i}`} className="flex gap-3">
          <time
            dateTime={e.em || undefined}
            className="shrink-0 tabular-nums"
            style={{ color: CORES.rotulo }}
          >
            {formatarHoraEvento(e.em, agora)}
          </time>
          <span style={{ color: CORES.texto }}>
            {e.tipo && (
              <span
                className="font-semibold"
                style={{ color: corTipo(e.tipo) }}
              >
                {e.tipo}
              </span>
            )}
            {e.tipo && e.texto && " "}
            {e.texto || (!e.tipo && "(evento)")}
            {e.repo && (
              <span style={{ color: CORES.rotulo }}>
                {" "}
                · {e.repo}
                {e.n !== undefined && ` #${e.n}`}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
