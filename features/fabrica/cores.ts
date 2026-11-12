// Paleta do mock "sala de controle" num lugar só, para kanban, matriz, KPIs e
// eventos não divergirem. Texto e rótulos passam de 4.5:1 sobre `painel`.
export const CORES = {
  fundo: "#05070c",
  painel: "#0b0f17",
  borda: "#1f2937",
  texto: "#d1d5db",
  forte: "#f9fafb",
  rotulo: "#9ca3af",
  destaque: "#38bdf8",
  // Destaque do que depende do dono.
  espera: "#f59e0b",
  esperaClaro: "#fbbf24",
  ok: "#4ade80",
  volta: "#a78bfa",
  porteiro: "#fb923c",
  revert: "#f87171",
} as const;

// Cor do tipo de evento; o que não está aqui usa `destaque`.
const COR_TIPO: Record<string, string> = {
  chamou: CORES.espera,
  "aguarda-dono": CORES.espera,
  "no-ar": CORES.ok,
  deploy: CORES.ok,
  merge: CORES.ok,
  volta: CORES.volta,
  porteiro: CORES.porteiro,
  revert: CORES.revert,
};

export const corTipo = (tipo: string) => COR_TIPO[tipo] ?? CORES.destaque;

// Cor do cabeçalho da coluna por estação; o que não está aqui usa `rotulo`.
const COR_ESTACAO: Record<string, string> = {
  construir: CORES.destaque,
  provar: CORES.destaque,
  revisar: CORES.volta,
  porteiro: CORES.porteiro,
  entrar: CORES.ok,
  publicar: CORES.ok,
};

export const corEstacao = (id: string) => COR_ESTACAO[id] ?? CORES.rotulo;
