import type { ContaLinha, MetaLinha, PostLinha, RunLinha } from "../painel";

// "Agora" das fixtures: quarta 2026-10-14 12h BRT. Semana atual = 2026-10-12.
export const AGORA = new Date("2026-10-14T15:00:00Z");

export const METAS: MetaLinha[] = [
  {
    rede: "youtube",
    tipo: "longo",
    por_semana: 1,
    vigente_desde: "2026-09-01",
  },
  {
    rede: "youtube",
    tipo: "longo",
    por_semana: 2,
    vigente_desde: "2026-10-06",
  },
  {
    rede: "youtube",
    tipo: "short",
    por_semana: 3,
    vigente_desde: "2026-10-12",
  },
  {
    rede: "instagram",
    tipo: "estatico",
    por_semana: 4,
    vigente_desde: "2026-09-01",
  },
];

export const POSTS: PostLinha[] = [
  // Semana atual (2026-10-12): 2 imagens e 1 carrossel = 3 estáticos.
  { rede: "instagram", tipo: "imagem", published_at: "2026-10-12T13:00:00Z" },
  { rede: "instagram", tipo: "imagem", published_at: "2026-10-13T13:00:00Z" },
  {
    rede: "instagram",
    tipo: "carrossel",
    published_at: "2026-10-14T13:00:00Z",
  },
  { rede: "instagram", tipo: "reel", published_at: "2026-10-13T20:00:00Z" },
  { rede: "youtube", tipo: "longo", published_at: "2026-10-12T22:00:00Z" },
  // Segunda 02h UTC = domingo 23h BRT: conta na semana anterior (2026-10-05).
  { rede: "youtube", tipo: "longo", published_at: "2026-10-12T02:00:00Z" },
  // Sem data de publicação: fora da contagem.
  { rede: "youtube", tipo: "short", published_at: null },
];

export const CONTAS: ContaLinha[] = [
  {
    rede: "youtube",
    dia: "2026-10-12",
    seguidores: 1000,
    views_dia: 100,
    alcance_dia: null,
  },
  {
    rede: "youtube",
    dia: "2026-10-13",
    seguidores: null,
    views_dia: 50,
    alcance_dia: null,
  },
  {
    rede: "youtube",
    dia: "2026-10-14",
    seguidores: 1010,
    views_dia: null,
    alcance_dia: null,
  },
  {
    rede: "instagram",
    dia: "2026-10-11",
    seguidores: 500,
    views_dia: 30,
    alcance_dia: 20,
  },
];

const h = (horas: number) => new Date(AGORA.getTime() - horas * 3_600_000);

export function run(
  parcial: Partial<RunLinha> & Pick<RunLinha, "rede" | "job">,
): RunLinha {
  return {
    started_at: h(1),
    finished_at: h(1),
    ok: true,
    erro: null,
    ...parcial,
  };
}

export { h as horasAtras };
