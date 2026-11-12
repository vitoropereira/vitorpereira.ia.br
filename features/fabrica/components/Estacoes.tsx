"use client";

import { useState } from "react";
import { CORES, corEstacao } from "../cores";
import type { EstacaoFabrica, GrupoRepo, ItemFabrica } from "../status";
import { Painel } from "./Painel";

type Modo = "kanban" | "matriz";

const SEM_ESTACAO = "__desconhecida__";

const ref = (it: ItemFabrica) =>
  `${it.alias || it.repo}${it.n !== undefined ? ` #${it.n}` : ""}`;

function Cartao({ it }: { it: ItemFabrica }) {
  return (
    <li
      className="flex flex-col gap-1 border p-2 text-xs"
      style={
        it.aguarda
          ? {
              borderColor: CORES.espera,
              background: `color-mix(in oklab, ${CORES.espera} 10%, ${CORES.fundo})`,
            }
          : { borderColor: CORES.borda, background: CORES.fundo }
      }
    >
      <span style={{ color: CORES.rotulo }}>{ref(it)}</span>
      {it.url ? (
        <a
          href={it.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
          style={{ color: CORES.forte }}
        >
          {it.titulo}
        </a>
      ) : (
        <span style={{ color: CORES.forte }}>{it.titulo}</span>
      )}
      {it.pr && (
        <a
          href={it.pr}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4"
          style={{ color: CORES.destaque }}
        >
          PR
        </a>
      )}
      {it.aguarda && (
        <span style={{ color: CORES.esperaClaro }}>aguarda: {it.aguarda}</span>
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

  const botao = (m: Modo, rotulo: string) => {
    const ativo = modo === m;
    return (
      <button
        type="button"
        aria-pressed={ativo}
        onClick={() => setModo(m)}
        className="border px-3 py-1 text-xs"
        style={
          ativo
            ? {
                borderColor: CORES.destaque,
                color: CORES.fundo,
                background: CORES.destaque,
              }
            : { borderColor: CORES.borda, color: CORES.texto }
        }
      >
        {rotulo}
      </button>
    );
  };

  return (
    <Painel
      titulo="Estações"
      extra={
        <div className="flex gap-2">
          {botao("kanban", "Kanban")}
          {botao("matriz", "Repos × estações")}
        </div>
      }
    >
      {modo === "kanban" ? (
        <div className="grid auto-cols-[minmax(11rem,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
          {colunas.map((c) => {
            const daColuna = itens.filter((it) => colunaDe(it) === c.id);
            return (
              <section key={c.id} className="flex flex-col gap-2">
                <h3
                  className="border-b-2 pb-1 text-xs font-medium"
                  style={{ borderColor: corEstacao(c.id), color: CORES.forte }}
                >
                  {c.nome}{" "}
                  <span
                    className="tabular-nums"
                    style={{ color: CORES.rotulo }}
                  >
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
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr style={{ color: CORES.rotulo }}>
                {/* Coluna do repo presa à esquerda ao rolar no celular. */}
                <th
                  className="sticky left-0 p-2 text-left font-medium"
                  style={{ background: CORES.painel }}
                >
                  Repo
                </th>
                {colunas.map((c) => (
                  <th
                    key={c.id}
                    className="min-w-[9rem] p-2 text-left font-medium"
                  >
                    {c.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repos.map((g) => (
                <tr
                  key={`${g.alias}:${g.repo}`}
                  className="border-t align-top"
                  style={{ borderColor: CORES.borda }}
                >
                  <th
                    scope="row"
                    className="sticky left-0 p-2 text-left font-medium"
                    style={{ background: CORES.painel, color: CORES.forte }}
                  >
                    {g.alias || g.repo || "(sem repo)"}
                    {g.alias && g.repo && (
                      <span
                        className="block font-normal"
                        style={{ color: CORES.rotulo }}
                      >
                        {g.repo}
                      </span>
                    )}
                  </th>
                  {colunas.map((c) => {
                    const daCelula = g.itens.filter(
                      (it) => colunaDe(it) === c.id,
                    );
                    return (
                      <td key={c.id} className="p-2">
                        {daCelula.length === 0 ? (
                          <span style={{ color: CORES.rotulo }}>·</span>
                        ) : (
                          <ul className="flex flex-col gap-1">
                            {daCelula.map((it, i) => (
                              <li
                                key={`${it.n ?? it.titulo}:${i}`}
                                style={{
                                  color: it.aguarda
                                    ? CORES.esperaClaro
                                    : CORES.texto,
                                }}
                              >
                                {it.n !== undefined && `#${it.n} `}
                                {it.titulo}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Painel>
  );
}
