import { ESTACOES, type ItemFabrica } from "../status";

export function LinhaEstacoes({ itens }: { itens: ItemFabrica[] }) {
  // Estação fora da lista não some: sem esta linha a soma das caixas ficaria
  // menor que o total e o painel pareceria saudável.
  const conhecidas = new Set<string>(ESTACOES.map((e) => e.id));
  const desconhecidos = itens.filter((it) => !conhecidas.has(it.estacao));
  return (
    <div className="flex flex-col gap-3">
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ESTACOES.map((e, i) => {
          const total = itens.filter((it) => it.estacao === e.id).length;
          return (
            <li
              key={e.id}
              className="border-border flex flex-col gap-1 rounded-md border p-3"
            >
              <span className="text-muted-foreground text-xs">{i + 1}</span>
              <span className="text-sm font-medium">{e.nome}</span>
              <span className="text-2xl font-semibold tabular-nums">
                {total}
              </span>
            </li>
          );
        })}
      </ol>
      {desconhecidos.length > 0 && (
        <p className="text-muted-foreground text-sm">
          {desconhecidos.length} item(ns) em estação desconhecida:{" "}
          {[
            ...new Set(desconhecidos.map((it) => it.estacao || "(vazia)")),
          ].join(", ")}
        </p>
      )}
    </div>
  );
}
