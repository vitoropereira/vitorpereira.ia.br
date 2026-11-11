import type { EventoFabrica } from "../status";

const MAX_EVENTOS = 20;

export function Semana({
  semana,
  eventos,
}: {
  semana: Record<string, string | number>;
  eventos: EventoFabrica[];
}) {
  // ISO 8601 ordena como texto; mais novos primeiro.
  const recentes = [...eventos]
    .sort((a, b) => b.em.localeCompare(a.em))
    .slice(0, MAX_EVENTOS);
  const resumo = Object.entries(semana);
  return (
    <div className="flex flex-col gap-4">
      {resumo.length > 0 && (
        <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {resumo.map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <dt className="text-muted-foreground text-xs">{k}</dt>
              <dd className="font-medium tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {recentes.length === 0 ? (
        <p className="text-muted-foreground text-sm">Sem eventos na semana.</p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {recentes.map((e, i) => (
            <li key={`${e.em}:${i}`} className="flex gap-3">
              <time className="text-muted-foreground shrink-0 text-xs">
                {e.em}
              </time>
              <span>
                {e.texto}
                {e.repo && (
                  <span className="text-muted-foreground"> · {e.repo}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
