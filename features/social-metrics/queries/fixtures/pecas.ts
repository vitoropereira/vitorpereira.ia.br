import type { MetricaLinha, PostPecaLinha } from "../pecas";

// Hoje = 2026-10-14 (Brasília). A é antigo, com total alto e D+7 baixo; B é
// novo, com D+7 alto e total menor. Ordenar pelo total põe A na frente;
// ordenar pelo D+7 tem que pôr B.
export const AGORA = new Date("2026-10-14T15:00:00Z");

const base = {
  url: null,
  hook: null,
  testa: null,
  formato: "tutorial",
  template: "lista",
};

export const POSTS: PostPecaLinha[] = [
  {
    ...base,
    id: "a",
    rede: "youtube",
    external_id: "AAAAAAAAAAA",
    titulo: "Post A antigo",
    tipo: "longo",
    published_at: "2026-06-01T15:00:00Z",
    peca_slug: "2026-06-01-post-a",
    pauta: "agentes",
  },
  {
    ...base,
    id: "b",
    rede: "youtube",
    external_id: "BBBBBBBBBBB",
    titulo: "Post B novo",
    tipo: "longo",
    published_at: "2026-10-01T15:00:00Z",
    peca_slug: "2026-10-01-post-b",
    pauta: "agentes",
  },
  {
    ...base,
    id: "c",
    rede: "instagram",
    external_id: "1790000",
    titulo: "Reel C de 3 dias",
    tipo: "reel",
    published_at: "2026-10-11T15:00:00Z",
    peca_slug: null,
    pauta: null,
    formato: null,
    template: null,
  },
];

const linha = (
  post_id: string,
  dia: string,
  views: number | null,
  extra: Partial<MetricaLinha> = {},
): MetricaLinha => ({
  post_id,
  dia,
  views,
  likes: null,
  saves: null,
  ctr: null,
  avg_view_pct: null,
  ...extra,
});

export const METRICAS: MetricaLinha[] = [
  // A: 10 por dia na primeira semana, depois 5 mil num dia de pico tardio.
  ...Array.from({ length: 8 }, (_, i) =>
    linha("a", `2026-06-${String(i + 1).padStart(2, "0")}`, 10),
  ),
  linha("a", "2026-08-01", 5000, { ctr: 4.2, avg_view_pct: 38 }),
  linha("a", "2026-10-14", 1, { likes: 300, avg_view_pct: null }),
  // B: 200 por dia na primeira semana.
  ...Array.from({ length: 8 }, (_, i) =>
    linha("b", `2026-10-0${i + 1}`, 200, { ctr: i === 7 ? 6.1 : 5 }),
  ),
  linha("b", "2026-10-14", 3, { likes: 40, saves: 2 }),
  // C: 3 dias, D+7 ainda não chegou.
  linha("c", "2026-10-11", 90),
  linha("c", "2026-10-12", 30, { saves: 12 }),
];
