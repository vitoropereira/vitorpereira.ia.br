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
      <p className="text-sm" style={{ color: CORES.rotulo }}>
        Nenhum item na fábrica.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead style={{ color: CORES.rotulo }}>
          <tr>
            <th className="py-1 pr-2 text-left font-medium">Repo</th>
            <th className="px-2 py-1 text-right font-medium">Ativos</th>
            <th className="px-2 py-1 text-right font-medium">Entregues/sem</th>
            <th className="px-2 py-1 text-right font-medium">Voltas</th>
            <th className="px-2 py-1 text-right font-medium">Último deploy</th>
            <th className="py-1 pl-2 text-right font-medium">Saúde</th>
          </tr>
        </thead>
        <tbody style={{ color: CORES.texto }}>
          {repos.map((g) => {
            const { resumo: r } = g;
            return (
              <tr
                key={`${g.alias}:${g.repo}`}
                className="border-t"
                style={{ borderColor: CORES.borda }}
              >
                <th
                  scope="row"
                  className="py-1 pr-2 text-left font-medium"
                  style={{ color: CORES.forte }}
                >
                  {g.alias || g.repo || "(sem repo)"}
                  {g.alias && g.repo && (
                    <span
                      className="font-normal"
                      style={{ color: CORES.rotulo }}
                    >
                      {" "}
                      {g.repo}
                    </span>
                  )}
                </th>
                <td className="px-2 py-1 text-right tabular-nums">
                  {r.ativos}
                </td>
                <td className="px-2 py-1 text-right tabular-nums">
                  {r.entregues}
                </td>
                <td
                  className="px-2 py-1 text-right tabular-nums"
                  style={r.voltas > 0 ? { color: CORES.volta } : undefined}
                >
                  {r.voltas}
                </td>
                <td className="px-2 py-1 text-right">
                  {formatarUltimoDeploy(r.ultimoDeploy, agora)}
                </td>
                <td
                  className="py-1 pl-2 text-right"
                  style={{ color: COR_SAUDE[r.saude] ?? CORES.rotulo }}
                >
                  {r.saude || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
