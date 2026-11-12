// Estações do status.json da fábrica, na ordem do fluxo. É só o nome de tela e
// o reserva quando o arquivo não traz `estacoes[]`; a ordem real vem do arquivo.
const NOMES_ESTACAO: Record<string, string> = {
  pedido: "Pedido (intake)",
  bancada: "Bancada",
  construir: "Construir",
  provar: "Provar",
  revisar: "Revisar",
  porteiro: "Porteiro",
  entrar: "Entrar",
  publicar: "Publicar",
  acompanhar: "Acompanhar",
  relatorio: "Relatório",
};

export type EstacaoFabrica = { id: string; nome: string };

export type ItemFabrica = {
  titulo: string;
  repo: string;
  // Apelido curto do repo (vp, vpc…) que o status.json traz.
  alias?: string;
  n?: number;
  estacao: string;
  // O que destrava o item (ex.: "ok do dono no PR").
  aguarda?: string;
  url?: string;
  pr?: string;
};

export type EventoFabrica = {
  em: string;
  texto: string;
  repo?: string;
  n?: number;
};

// Contagens do repo que o produtor já calcula (ex.: {abertos, aguardando}).
export type ResumoRepo = Record<string, number>;

export type GrupoRepo = {
  alias: string;
  repo: string;
  itens: ItemFabrica[];
  resumo: ResumoRepo;
};

// Últimos 7 dias por tipo de evento, do mais antigo ao mais novo.
export type Historico = Record<string, number[]>;

export type Gargalo = { estacao: string; texto: string };

export const DIAS_HISTORICO = 7;

export type StatusFabrica = {
  gerado_em?: string;
  estacoes: EstacaoFabrica[];
  itens: ItemFabrica[];
  // Mesmos itens, agrupados por repo (matriz e tabela).
  repos: GrupoRepo[];
  historico: Historico;
  gargalo: Gargalo | null;
  tempoMedioHoras: number | null;
  aguardando_dono: ItemFabrica[];
  semana: Record<string, string | number>;
  eventos: EventoFabrica[];
  erros: string[];
};

export type ResultadoStatus =
  | { erro: "sem-token" | "indisponivel" }
  | {
      erro?: undefined;
      status: StatusFabrica;
      minutosDesde: number | null;
      velho: boolean;
    };

const REPO_PADRAO = "vitoropereira/dev-flow";
const BRANCH_PADRAO = "fabrica-status";
const LIMITE_VELHO_MIN = 30;

const ehObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const lista = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter(ehObjeto) : [];

// Primeiro campo textual presente entre os nomes aceitos: o produtor do JSON
// já variou nomes de campo, e um painel vazio parece saudável.
const primeiro = (o: Record<string, unknown>, ...chaves: string[]): string => {
  for (const k of chaves) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
};

// Só https vira link: `javascript:` num href seria XSS vindo do JSON.
const https = (v: string) => (v.startsWith("https://") ? v : undefined);

const numero = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function item(
  o: Record<string, unknown>,
  repoPadrao = "",
  aliasPadrao = "",
): ItemFabrica {
  return {
    titulo: primeiro(o, "titulo", "title", "nome") || "(sem título)",
    repo: primeiro(o, "repo") || repoPadrao,
    alias: primeiro(o, "alias") || aliasPadrao || undefined,
    n: numero(o.n),
    estacao: primeiro(o, "estacao", "etapa"),
    aguarda: primeiro(o, "aguarda") || undefined,
    url: https(primeiro(o, "url", "link")),
    pr: https(primeiro(o, "pr")),
  };
}

// Evento real: {ts, tipo, repo, n, titulo?, veredito?}. Vira uma linha legível.
function evento(e: Record<string, unknown>): EventoFabrica {
  const tipo = primeiro(e, "tipo");
  const titulo = primeiro(e, "titulo");
  const veredito = primeiro(e, "veredito");
  const composto = [
    tipo,
    titulo && `: ${titulo}`,
    veredito && veredito !== tipo && ` (${veredito})`,
  ]
    .filter(Boolean)
    .join("");
  return {
    em: primeiro(e, "ts", "em", "quando", "data", "at"),
    texto: primeiro(e, "texto", "mensagem", "descricao") || composto,
    repo: primeiro(e, "repo") || undefined,
    n: numero(e.n),
  };
}

function estacoes(v: unknown): EstacaoFabrica[] {
  const lidas: EstacaoFabrica[] = [];
  for (const e of Array.isArray(v) ? v : []) {
    const o = typeof e === "string" ? { id: e } : ehObjeto(e) ? e : null;
    const id = o && primeiro(o, "id", "slug", "estacao");
    if (!o || !id) continue;
    lidas.push({
      id,
      nome: primeiro(o, "nome", "titulo", "label") || NOMES_ESTACAO[id] || id,
    });
  }
  if (lidas.length > 0) return lidas;
  return Object.entries(NOMES_ESTACAO).map(([id, nome]) => ({ id, nome }));
}

// Sempre 7 números ≥ 0: o gráfico não pode quebrar com série curta ou suja.
// Série mais longa fica com os 7 dias mais recentes; mais curta é completada
// com zeros no começo.
function serie(v: unknown): number[] {
  const nums = (Array.isArray(v) ? v : []).map((x) =>
    typeof x === "number" && Number.isFinite(x) && x > 0 ? x : 0,
  );
  const ultimos = nums.slice(-DIAS_HISTORICO);
  return [
    ...Array<number>(DIAS_HISTORICO - ultimos.length).fill(0),
    ...ultimos,
  ];
}

function historico(v: unknown): Historico {
  if (!ehObjeto(v)) return {};
  return Object.fromEntries(Object.entries(v).map(([k, s]) => [k, serie(s)]));
}

function resumo(v: unknown): ResumoRepo {
  if (!ehObjeto(v)) return {};
  const r: ResumoRepo = {};
  for (const [k, n] of Object.entries(v)) {
    const x = numero(n);
    if (x !== undefined) r[k] = x;
  }
  return r;
}

function gargalo(v: unknown): Gargalo | null {
  if (typeof v === "string") return v ? { estacao: "", texto: v } : null;
  if (!ehObjeto(v)) return null;
  const estacao = primeiro(v, "estacao", "id");
  const texto = primeiro(v, "texto", "motivo", "descricao");
  return estacao || texto ? { estacao, texto } : null;
}

// `repos` pode vir como lista ({repo, itens}) ou mapa (repo → itens | {itens}).
function gruposDosRepos(repos: unknown): GrupoRepo[] {
  const grupos: [string, unknown][] = Array.isArray(repos)
    ? repos.filter(ehObjeto).map((r) => [primeiro(r, "repo", "nome"), r])
    : ehObjeto(repos)
      ? Object.entries(repos)
      : [];
  return grupos.map(([repo, g]) => {
    const dentro = ehObjeto(g) ? g.itens : g;
    const alias = ehObjeto(g) ? primeiro(g, "alias") : "";
    return {
      alias,
      repo,
      itens: lista(dentro).map((o) => item(o, repo, alias)),
      resumo: ehObjeto(g) ? resumo(g.resumo) : {},
    };
  });
}

function normalizar(bruto: unknown): StatusFabrica | null {
  // Sem `estacoes` o arquivo não é um status da fábrica: melhor "indisponível"
  // do que renderizar um painel zerado que parece saudável.
  if (!ehObjeto(bruto) || !Array.isArray(bruto.estacoes)) return null;
  const semana: Record<string, string | number> = {};
  if (ehObjeto(bruto.semana)) {
    for (const [k, v] of Object.entries(bruto.semana)) {
      if (typeof v === "string" || typeof v === "number") semana[k] = v;
    }
  }
  const repos = gruposDosRepos(bruto.repos);
  const soltos = lista(bruto.itens).map((o) => item(o));
  // Item solto também entra na matriz e na tabela, no grupo do próprio repo.
  for (const it of soltos) {
    const g = repos.find(
      (r) => r.repo === it.repo && r.alias === (it.alias ?? ""),
    );
    // Mesmo item nas duas listas (repos e itens) não conta em dobro.
    const repetido =
      it.n !== undefined &&
      repos.some((r) =>
        r.itens.some((x) => x.repo === it.repo && x.n === it.n),
      );
    if (repetido) continue;
    if (g) g.itens.push(it);
    else
      repos.push({
        alias: it.alias ?? "",
        repo: it.repo,
        itens: [it],
        resumo: {},
      });
  }
  const tempo = numero(bruto.tempo_medio_horas);
  return {
    gerado_em:
      typeof bruto.gerado_em === "string" ? bruto.gerado_em : undefined,
    estacoes: estacoes(bruto.estacoes),
    itens: repos.flatMap((g) => g.itens),
    repos,
    historico: historico(bruto.historico),
    gargalo: gargalo(bruto.gargalo),
    tempoMedioHoras: tempo !== undefined && tempo >= 0 ? tempo : null,
    aguardando_dono: lista(bruto.aguardando_dono).map((o) => item(o)),
    semana,
    eventos: lista(bruto.eventos).map(evento),
    // Repo que a fábrica não conseguiu ler: {repo, erro}.
    erros: (Array.isArray(bruto.erros) ? bruto.erros : [])
      .map((e) =>
        typeof e === "string"
          ? e
          : ehObjeto(e)
            ? [primeiro(e, "repo"), primeiro(e, "erro", "mensagem")]
                .filter(Boolean)
                .join(": ")
            : "",
      )
      .filter(Boolean),
  };
}

export async function carregarStatus(
  now: Date = new Date(),
): Promise<ResultadoStatus> {
  const token = process.env.FACTORY_GITHUB_TOKEN;
  if (!token) return { erro: "sem-token" };

  const repo = process.env.FACTORY_STATUS_REPO || REPO_PADRAO;
  const branch = process.env.FACTORY_STATUS_BRANCH || BRANCH_PADRAO;
  const url = `https://api.github.com/repos/${repo}/contents/status.json?ref=${encodeURIComponent(branch)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });
    if (!res.ok) return { erro: "indisponivel" };
    const status = normalizar(await res.json());
    if (!status) return { erro: "indisponivel" };

    const geradoMs = status.gerado_em ? Date.parse(status.gerado_em) : NaN;
    const minutosDesde = Number.isNaN(geradoMs)
      ? null
      : Math.max(0, Math.floor((now.getTime() - geradoMs) / 60_000));
    return {
      status,
      minutosDesde,
      // Sem data não dá para provar que está fresco.
      velho: minutosDesde === null || minutosDesde > LIMITE_VELHO_MIN,
    };
  } catch {
    // A mensagem de rede pode citar host; não vai pra tela.
    return { erro: "indisponivel" };
  }
}
