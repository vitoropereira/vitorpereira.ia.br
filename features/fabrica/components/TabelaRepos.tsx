import { CORES } from "../cores";
import { formatarUltimoDeploy } from "../formato";
import type { GrupoRepo } from "../status";

const COR_SAUDE: Record<string, string> = {
  ok: CORES.ok,
  atencao: CORES.espera,
};

export function TabelaRepos({
  repos,
  agora = new Date(),
}: {
  repos: GrupoRepo[];
  agora?: Date;
}) {
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
          <th className="py-1 text-right font-medium">Ativos</th>
          <th className="py-1 text-right font-medium">Entregues/sem</th>
          <th className="py-1 text-right font-medium">Voltas</th>
          <th className="py-1 text-right font-medium">Último deploy</th>
          <th className="py-1 text-right font-medium">Saúde</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((g) => {
          const { resumo: r } = g;
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
              <td className="py-1 text-right tabular-nums">{r.ativos}</td>
              <td className="py-1 text-right tabular-nums">{r.entregues}</td>
              <td className="py-1 text-right tabular-nums">{r.voltas}</td>
              <td className="py-1 text-right">
                {formatarUltimoDeploy(r.ultimoDeploy, agora)}
              </td>
              <td
                className="py-1 text-right"
                style={{ color: COR_SAUDE[r.saude] ?? CORES.neutro }}
              >
                {r.saude || "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
