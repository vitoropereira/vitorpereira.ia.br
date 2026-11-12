import type { EventoFabrica } from "../status";

const MAX_EVENTOS = 20;

export function Eventos({ eventos }: { eventos: EventoFabrica[] }) {
  // Por instante, não por texto: offsets diferentes quebrariam a ordem. Data
  // ilegível (NaN) vai pro fim.
  const instante = (em: string) => Date.parse(em) || 0;
  const recentes = [...eventos]
    .sort((a, b) => instante(b.em) - instante(a.em))
    .slice(0, MAX_EVENTOS);
  if (recentes.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Sem eventos na semana.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {recentes.map((e, i) => (
        <li key={`${e.em}:${i}`} className="flex gap-3">
          <time className="text-muted-foreground shrink-0 text-xs">{e.em}</time>
          <span>
            {e.texto || "(evento)"}
            {e.repo && (
              <span className="text-muted-foreground">
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
