import { sugerirCasamentos } from "../content-os/casamentos";
import type { LeitorContentOs } from "../content-os/leitor";
import { slugDoCaminho } from "../content-os/peca";
import { carregarPecas } from "../content-os/sync";
import type { Db, PostSemPeca } from "../gravador";

// Tela de casamentos: só sugere. Quem confirma é o Vitor, escrevendo o id na
// peça do content-os; por isso cada candidata já leva o caminho do arquivo e
// a linha exata a colar.

export interface CandidataPainel {
  slug: string;
  caminho: string;
  created: string | null;
  pauta: string | null;
  formato: string | null;
  dias: number;
  /** Linha de frontmatter que fecha o casamento. */
  campo: string;
}

export interface SugestaoPainel {
  post: PostSemPeca;
  candidatas: CandidataPainel[];
}

export interface CasamentosPainel {
  postsSemPeca: number;
  sugestoes: SugestaoPainel[];
  /** Aviso de leitura das peças (árvore truncada, YAML quebrado). */
  avisos: string[];
  /** O content-os não pôde ser lido: a tela mostra isto no lugar da lista. */
  erro: string | null;
}

// Mesmo SELECT do `listarPostsSemPeca` do gravador, mas pelo reader: a rota
// não pode carregar o módulo que escreve.
const SQL_POSTS_SEM_PECA = `select rede, external_id, titulo, published_at
from public.vitor_social_posts
where peca_slug is null
order by published_at desc nulls last`;

async function postsSemPeca(db: Db): Promise<PostSemPeca[]> {
  const { rows } = await db.query<
    Omit<PostSemPeca, "published_at"> & { published_at: unknown }
  >(SQL_POSTS_SEM_PECA);
  return rows.map((r) => ({
    rede: r.rede,
    external_id: r.external_id,
    titulo: r.titulo,
    published_at:
      r.published_at instanceof Date
        ? r.published_at.toISOString()
        : ((r.published_at as string | null) ?? null),
  }));
}

export async function carregarCasamentosPainel(p: {
  db: Db;
  /** `null` quando falta o token do content-os. */
  leitor: LeitorContentOs | null;
}): Promise<CasamentosPainel> {
  // Erro de banco sobe: a página já trata como aviso de conexão.
  const posts = await postsSemPeca(p.db);
  const vazio = { postsSemPeca: posts.length, sugestoes: [], avisos: [] };
  if (posts.length === 0) return { ...vazio, erro: null };
  if (!p.leitor) {
    return {
      ...vazio,
      erro: "Defina CONTENT_OS_READ_TOKEN no servidor para ler as peças do content-os.",
    };
  }

  // O `Peca` não guarda a pasta do mês: guarda-se o caminho que a listagem
  // devolveu para montar o arquivo a editar.
  const caminhos = new Map<string, string>();
  const leitor = p.leitor;
  const espiao: LeitorContentOs = {
    async listarPecas() {
      const lista = await leitor.listarPecas();
      for (const c of lista.caminhos) caminhos.set(slugDoCaminho(c), c);
      return lista;
    },
    lerArquivo: (c) => leitor.lerArquivo(c),
  };

  let carregadas;
  try {
    carregadas = await carregarPecas(espiao);
  } catch (e) {
    // A mensagem do GitHub pode citar status e caminho; fica só no log.
    console.error("[admin/redes/casamentos] falha ao ler o content-os", e);
    return {
      ...vazio,
      erro: "Não foi possível ler as peças do content-os agora. Confira o token e tente de novo.",
    };
  }

  const sugestoes = sugerirCasamentos(posts, carregadas.pecas).map((s) => ({
    post: s.post,
    candidatas: s.candidatas.map(({ peca, dias }) => ({
      slug: peca.slug,
      caminho:
        caminhos.get(peca.slug) ??
        `content/producao/${peca.created!.slice(0, 7)}/${peca.slug}.md`,
      created: peca.created,
      pauta: peca.pauta,
      formato: peca.formato,
      dias,
      campo: `${s.post.rede}_id: ${s.post.external_id}`,
    })),
  }));

  return {
    postsSemPeca: posts.length,
    sugestoes,
    avisos: carregadas.avisos,
    erro: null,
  };
}
