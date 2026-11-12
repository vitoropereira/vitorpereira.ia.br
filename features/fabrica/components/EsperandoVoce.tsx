import type { ItemFabrica } from "../status";

export function EsperandoVoce({ itens }: { itens: ItemFabrica[] }) {
  if (itens.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nada esperando você.</p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((it, i) => (
        <li
          key={`${it.repo}:${it.n ?? it.titulo}:${i}`}
          className="border-border flex flex-col gap-1 rounded-md border px-3 py-2 text-sm"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span>
              <span className="text-muted-foreground">
                {it.alias || it.repo}
                {it.n !== undefined && ` #${it.n}`}
              </span>{" "}
              {it.url ? (
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline underline-offset-4"
                >
                  {it.titulo}
                </a>
              ) : (
                <span className="font-medium">{it.titulo}</span>
              )}
            </span>
            {it.pr && (
              <a
                href={it.pr}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline underline-offset-4"
              >
                PR
              </a>
            )}
          </div>
          {it.aguarda && (
            <span className="text-muted-foreground text-xs">
              destrava com: {it.aguarda}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
