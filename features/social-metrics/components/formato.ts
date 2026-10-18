// Formatação compartilhada entre os blocos do painel (server e client).

import type { PontoSeguidores } from "../queries/painel";

export const NOME_REDE = {
  youtube: "YouTube",
  instagram: "Instagram",
} as const;

export const COR_REDE = {
  youtube: "var(--rede-youtube)",
  instagram: "var(--rede-instagram)",
} as const;

export const NOME_TIPO: Record<string, string> = {
  longo: "Vídeo longo",
  short: "Short",
  reel: "Reel",
  carrossel: "Carrossel",
  imagem: "Imagem",
  estatico: "Estático (imagem + carrossel)",
};

const COMPACTO = new Intl.NumberFormat("pt-BR", { notation: "compact" });
const INTEIRO = new Intl.NumberFormat("pt-BR");

export const numeroCompacto = (n: number) => COMPACTO.format(n);
export const numero = (n: number | null) =>
  n === null ? "sem dado" : INTEIRO.format(n);

/** `2026-10-12` → `12/10`. */
export const diaCurto = (dia: string) =>
  `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

const DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export const dataHora = (iso: string) => DATA_HORA.format(new Date(iso));

const DATA = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const data = (iso: string | null) =>
  iso ? DATA.format(new Date(iso)) : "sem data";

/** CTR e retenção chegam em pontos percentuais (5.2 = 5,2%). */
export const percentual = (n: number | null) =>
  n === null
    ? "sem dado"
    : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

export const rotuloPost = (
  rede: keyof typeof NOME_REDE,
  titulo: string | null,
) => `${NOME_REDE[rede]} · ${titulo ?? "sem título"}`;

export interface PontoGraficoSeguidores {
  dia: string;
  valor: number | null;
  reconstruido: number | null;
}

/**
 * Série de uma rede para o gráfico. Fica aqui, e não no componente client,
 * porque quem chama é o PainelRedes, que roda no servidor. O reconstruído só
 * aparece onde não há real, mesmo que a query já garanta isso.
 */
export function pontosSeguidores(
  pontos: PontoSeguidores[],
  rede: keyof typeof NOME_REDE,
): PontoGraficoSeguidores[] {
  return pontos.map((p) => ({
    dia: p.dia,
    valor: p[rede],
    reconstruido: p[rede] === null ? p[`${rede}_calc`] : null,
  }));
}
