import { diaSaoPaulo, diasEntre } from "../dia.ts";
import type { Gravador, PostSemPeca } from "../gravador.ts";
import type { Peca } from "../types.ts";
import type { LeitorContentOs } from "./leitor.ts";
import { carregarPecas } from "./sync.ts";

/** Quantos dias depois do `created` da peça o post ainda pode ser dela. */
export const JANELA_DIAS = 14;

export interface Candidata {
  peca: Peca;
  /** Dias entre `created` da peça e a publicação do post (Brasília). */
  dias: number;
}

export interface Sugestao {
  post: PostSemPeca;
  /** Da menor para a maior distância em dias. */
  candidatas: Candidata[];
}

/**
 * Sugere peça para post que o sync não casou por id (alimenta a futura tela de
 * casamentos). Só considera peça ainda sem publicação e sem id: peça com id é
 * resolvida pelo sync, e `linkedin` nunca casa porque não há post dele aqui.
 * É função pura; quem confirma o casamento é o Vitor, no content-os.
 */
export function sugerirCasamentos(
  posts: PostSemPeca[],
  pecas: Peca[],
): Sugestao[] {
  const livres = pecas.filter(
    (p) =>
      p.created !== null &&
      p.publicado === null &&
      p.youtube_id === null &&
      p.instagram_id === null,
  );

  const sugestoes: Sugestao[] = [];
  for (const post of posts) {
    if (!post.published_at) continue;
    const dia = diaSaoPaulo(new Date(post.published_at));
    const candidatas = livres
      .filter((p) => p.plataforma === post.rede)
      .map((peca) => ({ peca, dias: diasEntre(peca.created!, dia) }))
      .filter((c) => c.dias >= 0 && c.dias <= JANELA_DIAS)
      .sort(
        (a, b) => a.dias - b.dias || a.peca.slug.localeCompare(b.peca.slug),
      );
    if (candidatas.length) sugestoes.push({ post, candidatas });
  }
  return sugestoes;
}

/** Só lê (content-os e posts sem peça); não grava nada. */
export async function carregarSugestoes(p: {
  leitor: LeitorContentOs;
  gravador: Gravador;
}): Promise<Sugestao[]> {
  const { pecas } = await carregarPecas(p.leitor);
  const posts = await p.gravador.listarPostsSemPeca();
  return sugerirCasamentos(posts, pecas);
}
