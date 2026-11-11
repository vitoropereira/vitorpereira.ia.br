export const ESTACOES = [
  { id: "intake", nome: "Pedido (intake)" },
  { id: "planejamento", nome: "Planejamento" },
  { id: "plano-ok", nome: "Plano aprovado" },
  { id: "execucao", nome: "Execução" },
  { id: "gate", nome: "Gate" },
  { id: "pr", nome: "Pull request" },
  { id: "revisao", nome: "Revisão" },
  { id: "merge", nome: "Merge" },
  { id: "deploy", nome: "Deploy" },
  { id: "relatorio", nome: "Relatório" },
] as const;

export type ItemFabrica = {
  titulo: string;
  repo: string;
  estacao: string;
  url?: string;
};

export type EventoFabrica = {
  em: string;
  texto: string;
  repo?: string;
};

export type StatusFabrica = {
  gerado_em?: string;
  estacoes: unknown[];
  itens: ItemFabrica[];
  aguardando_dono: ItemFabrica[];
  semana: Record<string, string | number>;
  eventos: EventoFabrica[];
};

export type ResultadoStatus =
  | { erro: "sem-token" | "indisponivel" }
  | {
      erro?: undefined;
      status: StatusFabrica;
      minutosDesde: number | null;
      velho: boolean;
    };

const REPO_PADRAO = "vitoropereira/content-os";
const BRANCH_PADRAO = "main";
const LIMITE_VELHO_MIN = 30;

const ehObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const lista = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter(ehObjeto) : [];

const texto = (v: unknown, padrao = ""): string =>
  typeof v === "string" ? v : padrao;

function item(o: Record<string, unknown>): ItemFabrica {
  return {
    titulo: texto(o.titulo, "(sem título)"),
    repo: texto(o.repo),
    estacao: texto(o.estacao),
    // Só https vira link: `javascript:` num href seria XSS vindo do JSON.
    url:
      typeof o.url === "string" && o.url.startsWith("https://")
        ? o.url
        : undefined,
  };
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
  return {
    gerado_em:
      typeof bruto.gerado_em === "string" ? bruto.gerado_em : undefined,
    estacoes: bruto.estacoes,
    itens: lista(bruto.itens).map(item),
    aguardando_dono: lista(bruto.aguardando_dono).map(item),
    semana,
    eventos: lista(bruto.eventos).map((e) => ({
      em: texto(e.em),
      texto: texto(e.texto),
      repo: typeof e.repo === "string" ? e.repo : undefined,
    })),
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
