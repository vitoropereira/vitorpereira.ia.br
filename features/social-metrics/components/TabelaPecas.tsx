import Link from "next/link";
import type { Filtros, LinhaRanking, Ordem } from "../queries/pecas";
import { NOME_REDE, NOME_TIPO, data, numero, percentual } from "./formato";

// Tabela do ranking. A ordenação é um link com a query string inteira: sem JS,
// e o estado da tela fica na URL (dá para compartilhar e voltar).

const BASE = "/admin/redes/pecas";

type Coluna = { ordem: Ordem; titulo: string; dica?: string };

const COLUNAS: Coluna[] = [
  { ordem: "publicado", titulo: "Publicado" },
  { ordem: "d1", titulo: "D+1", dica: "Views acumuladas até 1 dia depois" },
  { ordem: "d7", titulo: "D+7", dica: "Views acumuladas até 7 dias depois" },
  { ordem: "d30", titulo: "D+30", dica: "Views acumuladas até 30 dias depois" },
  {
    ordem: "total",
    titulo: "Total",
    dica: "Acumulado até hoje: favorece post antigo",
  },
  { ordem: "likes", titulo: "Likes" },
  { ordem: "saves", titulo: "Saves" },
  { ordem: "ctr", titulo: "CTR" },
  { ordem: "retencao", titulo: "Retenção" },
];

export function hrefOrdem(f: Filtros, ordem: Ordem): string {
  const q = new URLSearchParams();
  for (const k of [
    "rede",
    "tipo",
    "formato",
    "pauta",
    "template",
    "de",
    "ate",
  ] as const) {
    const v = f[k];
    if (v) q.set(k, v);
  }
  q.set("ordem", ordem);
  // Clicar na coluna já ativa inverte; numa coluna nova começa do maior.
  q.set("dir", f.ordem === ordem && f.dir === "desc" ? "asc" : "desc");
  return `${BASE}?${q.toString()}`;
}

// A URL vem do coletor, não de digitação, mas vira href: só http(s) passa,
// para um valor estranho no banco não virar `javascript:` na tela do admin.
export function urlExterna(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

function TituloPost({ linha }: { linha: LinhaRanking }) {
  const href = urlExterna(linha.url);
  const titulo = linha.titulo ?? linha.external_id;
  if (!href) return <span className="truncate font-medium">{titulo}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="truncate font-medium underline-offset-4 hover:underline"
    >
      {titulo}
    </a>
  );
}

function valor(l: LinhaRanking, ordem: Ordem): string {
  switch (ordem) {
    case "publicado":
      return data(l.publicadoEm);
    case "ctr":
    case "retencao":
      return percentual(l[ordem]);
    default:
      return l[ordem] === null ? "—" : numero(l[ordem]);
  }
}

export function TabelaPecas({
  linhas,
  filtros,
}: {
  linhas: LinhaRanking[];
  /** Sem filtros, o cabeçalho não ordena (página da peça). */
  filtros?: Filtros;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[64rem] text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-left">
            <th className="py-2 pr-4 font-medium">Post</th>
            <th className="py-2 pr-4 font-medium">Peça</th>
            <th className="py-2 pr-4 font-medium">Idade</th>
            {COLUNAS.map((c) => {
              const ativa = filtros?.ordem === c.ordem;
              return (
                <th
                  key={c.ordem}
                  title={c.dica}
                  aria-sort={
                    ativa
                      ? filtros?.dir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                  className="py-2 pr-4 text-right font-medium whitespace-nowrap"
                >
                  {filtros ? (
                    <Link
                      href={hrefOrdem(filtros, c.ordem)}
                      className={
                        ativa
                          ? "text-foreground underline underline-offset-4"
                          : "hover:text-foreground"
                      }
                    >
                      {c.titulo}
                      {ativa && (filtros.dir === "asc" ? " ↑" : " ↓")}
                    </Link>
                  ) : (
                    c.titulo
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.id} className="border-b last:border-0">
              <td className="max-w-[22rem] py-2 pr-4">
                <div className="flex flex-col">
                  {/* O título leva ao post na rede; a análise da peça fica na
                      coluna "Peça", para não esconder o link externo. */}
                  <TituloPost linha={l} />
                  <span className="text-muted-foreground truncate text-xs">
                    {NOME_REDE[l.rede]}
                    {l.tipo && ` · ${NOME_TIPO[l.tipo] ?? l.tipo}`}
                    {l.pauta && ` · ${l.pauta}`}
                  </span>
                </div>
              </td>
              <td className="max-w-[14rem] py-2 pr-4">
                {l.peca_slug ? (
                  <Link
                    href={`${BASE}/${encodeURIComponent(l.peca_slug)}`}
                    className="block truncate underline-offset-4 hover:underline"
                  >
                    {l.peca_slug}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">sem peça</span>
                )}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap tabular-nums">
                {l.idade === null ? "—" : `${l.idade} d`}
              </td>
              {COLUNAS.map((c) => (
                <td
                  key={c.ordem}
                  className="py-2 pr-4 text-right whitespace-nowrap tabular-nums"
                >
                  {valor(l, c.ordem)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
