// Paleta do painel num lugar só, para kanban, matriz e KPIs não divergirem.
export const CORES = {
  // Destaque do que depende do dono.
  espera: "#f5a524",
  ok: "#3fb950",
  alerta: "#f85149",
  neutro: "#8b949e",
  barra: "#58a6ff",
} as const;

// Cor da coluna por estação; o que não está aqui usa `neutro`.
export const COR_ESTACAO: Record<string, string> = {
  pedido: "#8b949e",
  bancada: "#a371f7",
  construir: "#58a6ff",
  provar: "#39c5cf",
  revisar: "#d29922",
  porteiro: "#f5a524",
  entrar: "#3fb950",
  publicar: "#3fb950",
  acompanhar: "#58a6ff",
  relatorio: "#8b949e",
};

export const corEstacao = (id: string) => COR_ESTACAO[id] ?? CORES.neutro;
