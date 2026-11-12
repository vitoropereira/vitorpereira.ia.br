import { CORES } from "../cores";
import type { ItemFabrica } from "../status";

// Faixa âmbar do que só anda com o dono. Sem item, não ocupa espaço: o KPI
// "espera você" já mostra o zero.
export function EsperandoVoce({ itens }: { itens: ItemFabrica[] }) {
  if (itens.length === 0) return null;
  return (
    <section
      className="flex flex-col gap-2 border p-3"
      style={{
        borderColor: CORES.espera,
        background: `color-mix(in oklab, ${CORES.espera} 8%, ${CORES.painel})`,
      }}
    >
      <h2
        className="text-xs font-semibold tracking-wider"
        style={{ color: CORES.esperaClaro }}
      >
        ESPERA VOCÊ · {itens.length}
      </h2>
      <ul className="flex flex-col gap-2">
        {itens.map((it, i) => {
          // Sem PR, o que destrava é a própria issue.
          const destino = it.pr ?? it.url;
          return (
            <li
              key={`${it.repo}:${it.n ?? it.titulo}:${i}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"
            >
              <span>
                <span style={{ color: CORES.rotulo }}>
                  {it.alias || it.repo}
                  {it.n !== undefined && ` #${it.n}`}
                </span>{" "}
                <span style={{ color: CORES.forte }}>{it.titulo}</span>
                {it.aguarda && (
                  <span style={{ color: CORES.esperaClaro }}>
                    {" "}
                    — {it.aguarda}
                  </span>
                )}
              </span>
              {destino && (
                <a
                  href={destino}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border px-3 py-1 text-xs font-semibold"
                  style={{
                    borderColor: CORES.espera,
                    color: CORES.esperaClaro,
                  }}
                >
                  Abrir
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
