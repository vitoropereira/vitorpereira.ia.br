import { descreverErro } from "../executar.ts";
import type { Gravador } from "../gravador.ts";
import type { Peca, Rede } from "../types.ts";
import { CAMINHO_METAS, type LeitorContentOs } from "./leitor.ts";
import { parsearMetas } from "./metas.ts";
import { parsearPeca } from "./peca.ts";

const MAX_ERRO = 2000;

export interface ResultadoSync {
  job: "sync_pecas";
  ok: boolean;
  erro: string | null;
  linhas: number;
}

export interface PecasCarregadas {
  pecas: Peca[];
  avisos: string[];
}

/**
 * Lê e parseia todas as peças. Peça com problema vira aviso e não derruba as
 * outras; falha de rede do leitor sobe, porque aí nada do que veio é confiável.
 */
export async function carregarPecas(
  leitor: LeitorContentOs,
): Promise<PecasCarregadas> {
  const { caminhos, aviso } = await leitor.listarPecas();
  const pecas: Peca[] = [];
  const avisos: string[] = aviso ? [aviso] : [];
  for (const caminho of caminhos) {
    const conteudo = await leitor.lerArquivo(caminho);
    if (conteudo === null) {
      avisos.push(`${caminho}: sumiu entre a listagem e a leitura`);
      continue;
    }
    const r = parsearPeca(caminho, conteudo);
    if ("aviso" in r) avisos.push(r.aviso);
    else pecas.push(r.peca);
  }
  return { pecas, avisos };
}

interface Alvo {
  rede: Rede;
  externalId: string;
  peca: Peca;
}

/**
 * Um id em duas peças é ambíguo: nenhuma é aplicada ao post e o caso vira
 * aviso, em vez de a última peça lida vencer por acaso.
 */
function alvosDeAtualizacao(pecas: Peca[], avisos: string[]): Alvo[] {
  const porId = new Map<string, Alvo[]>();
  for (const peca of pecas) {
    const ids: [Rede, string | null][] = [
      ["youtube", peca.youtube_id],
      ["instagram", peca.instagram_id],
    ];
    for (const [rede, externalId] of ids) {
      if (!externalId) continue;
      const chave = `${rede}:${externalId}`;
      porId.set(chave, [
        ...(porId.get(chave) ?? []),
        { rede, externalId, peca },
      ]);
    }
  }
  const alvos: Alvo[] = [];
  for (const [chave, lista] of porId) {
    if (lista.length > 1) {
      avisos.push(
        `${chave} repetido nas peças ${lista.map((a) => a.peca.slug).join(", ")}: ignorado`,
      );
    } else {
      alvos.push(lista[0]);
    }
  }
  return alvos;
}

/**
 * Preenche os campos editoriais dos posts já coletados e grava as metas. Segue
 * o esqueleto de `executarColeta`: abre o run, nunca lança e fecha o run no
 * `finally`. Avisos mantêm `ok = true`.
 */
export async function executarSyncPecas(p: {
  leitor: LeitorContentOs;
  gravador: Gravador;
}): Promise<ResultadoSync> {
  let runId: string;
  try {
    runId = await p.gravador.iniciarRun(null, "sync_pecas");
  } catch (e) {
    return {
      job: "sync_pecas",
      ok: false,
      erro: `não abriu o run: ${descreverErro(e)}`,
      linhas: 0,
    };
  }

  let ok = false;
  let erro: string | null = null;
  let linhas = 0;
  try {
    const { pecas, avisos } = await carregarPecas(p.leitor);

    for (const a of alvosDeAtualizacao(pecas, avisos)) {
      const { peca } = a;
      // Peça sem post coletado ainda não cria nada: o coletor é quem insere.
      const atualizou = await p.gravador.atualizarPecaDoPost(
        a.rede,
        a.externalId,
        {
          peca_slug: peca.slug,
          pauta: peca.pauta,
          formato: peca.formato,
          hook: peca.hook,
          template: peca.template,
          testa: peca.testa,
        },
      );
      if (atualizou) linhas++;
    }

    const metasYml = await p.leitor.lerArquivo(CAMINHO_METAS);
    if (metasYml !== null) {
      const { metas, avisos: avisosMetas } = parsearMetas(metasYml);
      avisos.push(...avisosMetas);
      for (const m of metas) {
        await p.gravador.upsertMeta(m);
        linhas++;
      }
    }

    ok = true;
    erro = avisos.length
      ? `aviso: ${avisos.join("; ")}`.slice(0, MAX_ERRO)
      : null;
  } catch (e) {
    ok = false;
    erro = descreverErro(e);
  } finally {
    try {
      await p.gravador.finalizarRun(runId, { ok, erro, linhas });
    } catch (e) {
      ok = false;
      erro = `${erro ?? ""}${erro ? "; " : ""}não fechou o run: ${descreverErro(e)}`;
    }
  }
  return { job: "sync_pecas", ok, erro, linhas };
}
