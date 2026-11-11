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
          key={`${it.repo}:${it.titulo}:${i}`}
          className="border-border flex flex-wrap items-baseline justify-between gap-x-4 rounded-md border px-3 py-2 text-sm"
        >
          {it.url ? (
            <a
              href={it.url}
              className="font-medium underline underline-offset-4"
            >
              {it.titulo}
            </a>
          ) : (
            <span className="font-medium">{it.titulo}</span>
          )}
          <span className="text-muted-foreground text-xs">{it.repo}</span>
        </li>
      ))}
    </ul>
  );
}
