import type { SugestaoPainel } from "../queries/casamentos";
import { NOME_REDE, data } from "./formato";

// Só leitura: a tela mostra onde escrever o id e o Vitor confirma no
// content-os. Nada aqui grava.

export function ListaCasamentos({
  sugestoes,
}: {
  sugestoes: SugestaoPainel[];
}) {
  return (
    <ul className="flex flex-col gap-6">
      {sugestoes.map((s) => (
        <li
          key={`${s.post.rede}:${s.post.external_id}`}
          className="flex flex-col gap-3 rounded-lg border p-4"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {s.post.titulo ?? s.post.external_id}
            </span>
            <span className="text-muted-foreground text-xs">
              {NOME_REDE[s.post.rede]} · publicado {data(s.post.published_at)} ·{" "}
              <code>{s.post.external_id}</code>
            </span>
          </div>
          <ol className="flex flex-col gap-3">
            {s.candidatas.map((c, i) => (
              <li key={c.slug} className="flex flex-col gap-1 text-sm">
                <span>
                  {i === 0 ? "Mais provável: " : ""}
                  <strong>{c.slug}</strong>{" "}
                  <span className="text-muted-foreground">
                    · {c.dias === 0 ? "mesmo dia" : `${c.dias} d depois`} do
                    created
                    {c.pauta && ` · pauta ${c.pauta}`}
                    {c.formato && ` · ${c.formato}`}
                  </span>
                </span>
                <span className="text-muted-foreground text-xs">
                  Em <code className="break-all">{c.caminho}</code>, adicione ao
                  frontmatter:
                </span>
                <pre className="bg-muted overflow-x-auto rounded-md px-3 py-2 text-xs">
                  <code>{c.campo}</code>
                </pre>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ul>
  );
}
