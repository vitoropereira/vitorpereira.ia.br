import type { GrupoRepo } from "../status";

export function TabelaRepos({ repos }: { repos: GrupoRepo[] }) {
  if (repos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nenhum item na fábrica.</p>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead className="text-muted-foreground text-xs">
        <tr>
          <th className="py-1 text-left font-medium">Repo</th>
          <th className="py-1 text-right font-medium">Itens</th>
          <th className="py-1 text-right font-medium">Aguardando</th>
          <th className="py-1 text-right font-medium">PRs</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((g) => {
          // O resumo do produtor manda; sem ele, conta pelos itens.
          const itens = g.resumo.itens ?? g.itens.length;
          const aguardando =
            g.resumo.aguardando ?? g.itens.filter((it) => it.aguarda).length;
          const prs = g.resumo.prs ?? g.itens.filter((it) => it.pr).length;
          return (
            <tr key={`${g.alias}:${g.repo}`} className="border-border border-t">
              <th scope="row" className="py-1 text-left font-medium">
                {g.alias || g.repo || "(sem repo)"}
                {g.alias && g.repo && (
                  <span className="text-muted-foreground text-xs">
                    {" "}
                    {g.repo}
                  </span>
                )}
              </th>
              <td className="py-1 text-right tabular-nums">{itens}</td>
              <td className="py-1 text-right tabular-nums">{aguardando}</td>
              <td className="py-1 text-right tabular-nums">{prs}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
