"use client";

import { useState } from "react";
import { CORES, corEstacao } from "../cores";
import type { EstacaoFabrica, GrupoRepo, ItemFabrica } from "../status";

type Modo = "kanban" | "matriz";

const SEM_ESTACAO = "__desconhecida__";

function Cartao({ it }: { it: ItemFabrica }) {
  return (
    <li
      className="border-border flex flex-col gap-1 rounded border p-2 text-xs"
      style={it.aguarda ? { borderColor: CORES.espera } : undefined}
    >
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
            className="underline underline-offset-4"
          >
            {it.titulo}
          </a>
        ) : (
          it.titulo
        )}
      </span>
      {it.pr && (
        <a
          href={it.pr}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground underline underline-offset-4"
        >
          PR
        </a>
      )}
      {it.aguarda && (
        <span style={{ color: CORES.espera }}>aguarda: {it.aguarda}</span>
      )}
    </li>
  );
}

export function Estacoes({
  estacoes,
  repos,
}: {
  estacoes: EstacaoFabrica[];
  repos: GrupoRepo[];
}) {
  const [modo, setModo] = useState<Modo>("kanban");

  // Estação fora da lista ganha coluna própria: sem ela a soma das colunas
  // ficaria menor que o total e o painel pareceria saudável.
  const conhecidas = new Set(estacoes.map((e) => e.id));
  const itens = repos.flatMap((g) => g.itens);
  const temDesconhecida = itens.some((it) => !conhecidas.has(it.estacao));
  const colunas: EstacaoFabrica[] = temDesconhecida
    ? [...estacoes, { id: SEM_ESTACAO, nome: "(estação desconhecida)" }]
    : estacoes;
  const colunaDe = (it: ItemFabrica) =>
    conhecidas.has(it.estacao) ? it.estacao : SEM_ESTACAO;

  const botao = (m: Modo, rotulo: string) => (
    <button
      type="button"
      aria-pressed={modo === m}
      onClick={() => setModo(m)}
      className="border-border aria-pressed:bg-foreground aria-pressed:text-background rounded border px-3 py-1 text-xs"
    >
      {rotulo}
    </button>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {botao("kanban", "Kanban")}
        {botao("matriz", "Repos × estações")}
      </div>
      {modo === "kanban" ? (
        <div className="grid auto-cols-[minmax(11rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
          {colunas.map((c) => {
            const daColuna = itens.filter((it) => colunaDe(it) === c.id);
            return (
              <section key={c.id} className="flex flex-col gap-2">
                <h3
                  className="border-b-2 pb-1 text-xs font-medium"
                  style={{ borderColor: corEstacao(c.id) }}
                >
                  {c.nome}{" "}
                  <span className="text-muted-foreground tabular-nums">
                    {daColuna.length}
                  </span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {daColuna.map((it, i) => (
                    <Cartao
                      key={`${it.repo}:${it.n ?? it.titulo}:${i}`}
                      it={it}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium">Repo</th>
                {colunas.map((c) => (
                  <th key={c.id} className="p-2 text-right font-medium">
                    {c.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repos.map((g) => (
                <tr
                  key={`${g.alias}:${g.repo}`}
                  className="border-border border-t"
                >
                  <th scope="row" className="p-2 text-left font-medium">
                    {g.alias || g.repo || "(sem repo)"}
                  </th>
                  {colunas.map((c) => {
                    const n = g.itens.filter(
                      (it) => colunaDe(it) === c.id,
                    ).length;
                    return (
                      <td
                        key={c.id}
                        className="p-2 text-right tabular-nums"
                        style={n > 0 ? { color: corEstacao(c.id) } : undefined}
                      >
                        {n || "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
