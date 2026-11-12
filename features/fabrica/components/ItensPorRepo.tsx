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
  // Agrupa pelo apelido (vp, vpc…); sem apelido, pelo nome do repo.
  const porRepo = new Map<string, ItemFabrica[]>();
  for (const it of itens) {
    const chave = it.alias || it.repo;
    porRepo.set(chave, [...(porRepo.get(chave) ?? []), it]);
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
                key={`${it.n ?? it.titulo}:${i}`}
                className="flex justify-between gap-4"
              >
                <span>
                  {it.n !== undefined && (
                    <span className="text-muted-foreground">#{it.n} </span>
                  )}
                  {it.url ? (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      {it.titulo}
                    </a>
                  ) : (
                    it.titulo
                  )}
                  {it.pr && (
                    <>
                      {" "}
                      <a
                        href={it.pr}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground text-xs underline underline-offset-4"
                      >
                        PR
                      </a>
                    </>
                  )}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
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
