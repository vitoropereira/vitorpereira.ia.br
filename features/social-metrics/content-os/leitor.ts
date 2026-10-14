import type { Fetch } from "../types.ts";

// Dono, repo e branch ficam fixos: o leitor não lê nada fora do content-os, e
// o token fine-grained só enxerga esse repo de qualquer jeito.
const HOST = "https://api.github.com";
const REPO = "vitoropereira/content-os";
const BRANCH = "main";

const CAMINHO_PECA = /^content\/producao\/\d{4}-\d{2}\/[^/]+\.md$/;

export const CAMINHO_METAS = "content/metricas/metas.yml";

export interface ListaPecas {
  caminhos: string[];
  /** Árvore truncada pela API: a lista pode estar incompleta. */
  aviso: string | null;
}

export interface LeitorContentOs {
  listarPecas(): Promise<ListaPecas>;
  /** Conteúdo cru do arquivo; `null` quando não existe (404). */
  lerArquivo(caminho: string): Promise<string | null>;
}

/**
 * Leitor só-GET do content-os. Nenhum método escreve: o `publicado:` e os ids
 * são do Vitor, o sync só lê. Mensagens de erro nunca carregam o token.
 */
export function criarLeitor(p: {
  fetch: Fetch;
  token: string;
}): LeitorContentOs {
  const headers = (accept: string) => ({
    Accept: accept,
    Authorization: `Bearer ${p.token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  });

  async function listarPecas(): Promise<ListaPecas> {
    const res = await p.fetch(
      `${HOST}/repos/${REPO}/git/trees/${BRANCH}?recursive=1`,
      { method: "GET", headers: headers("application/vnd.github+json") },
    );
    if (!res.ok) {
      throw new Error(`GitHub ${res.status} ao listar a árvore do content-os`);
    }
    const corpo = (await res.json()) as {
      tree?: { path?: unknown; type?: unknown }[];
      truncated?: boolean;
    };
    const caminhos = (corpo.tree ?? [])
      .filter((n) => n.type === "blob" && typeof n.path === "string")
      .map((n) => n.path as string)
      .filter((c) => CAMINHO_PECA.test(c))
      .sort();
    return {
      caminhos,
      aviso: corpo.truncated
        ? "árvore do content-os truncada pela API: lista de peças pode estar incompleta"
        : null,
    };
  }

  async function lerArquivo(caminho: string): Promise<string | null> {
    const rota = caminho.split("/").map(encodeURIComponent).join("/");
    const res = await p.fetch(
      `${HOST}/repos/${REPO}/contents/${rota}?ref=${BRANCH}`,
      { method: "GET", headers: headers("application/vnd.github.raw") },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub ${res.status} ao ler ${caminho}`);
    return res.text();
  }

  return { listarPecas, lerArquivo };
}
