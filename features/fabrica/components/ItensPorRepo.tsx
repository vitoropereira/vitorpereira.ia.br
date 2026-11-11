import type { EstacaoFabrica, ItemFabrica } from "../status";

export function ItensPorRepo({
  estacoes,
  itens,
}: {
  estacoes: EstacaoFabrica[];
  itens: ItemFabrica[];
}) {
  const NOME_ESTACAO = Object.fromEntries(estacoes.map((e) => [e.id, e.nome]));
  if (itens.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nenhum item na fábrica.</p>
    );
  }
  const porRepo = new Map<string, ItemFabrica[]>();
  for (const it of itens) {
    porRepo.set(it.repo, [...(porRepo.get(it.repo) ?? []), it]);
  }
  return (
    <div className="flex flex-col gap-5">
      {[...porRepo].map(([repo, lista]) => (
        <section key={repo} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {repo || "(sem repo)"}{" "}
            <span className="text-muted-foreground text-xs">
              · {lista.length}
            </span>
          </h3>
          <ul className="flex flex-col gap-1 text-sm">
            {lista.map((it, i) => (
              <li
                key={`${it.titulo}:${i}`}
                className="flex justify-between gap-4"
              >
                <span>{it.titulo}</span>
                <span className="text-muted-foreground text-xs">
                  {NOME_ESTACAO[it.estacao] ?? (it.estacao || "(sem estação)")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
