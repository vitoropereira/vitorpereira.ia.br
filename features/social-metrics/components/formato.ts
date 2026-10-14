// Formatação compartilhada entre os blocos do painel (server e client).

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
