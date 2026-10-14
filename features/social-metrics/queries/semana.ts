import { diaSaoPaulo, somarDias } from "../dia";

// Semana do painel = segunda a domingo no horário de Brasília. Tudo vira
// `YYYY-MM-DD` de São Paulo antes de agrupar: um post de domingo 23h BRT já é
// segunda em UTC e cairia na semana errada.

export function inicioSemana(dia: string): string {
  const dow = new Date(`${dia}T12:00:00Z`).getUTCDay();
  // getUTCDay: domingo = 0. Domingo recua 6 dias, os outros recuam até a segunda.
  return somarDias(dia, dow === 0 ? -6 : 1 - dow);
}

export function semanaDe(instante: Date | string): string {
  const d = typeof instante === "string" ? new Date(instante) : instante;
  return inicioSemana(diaSaoPaulo(d));
}

export function ultimasSemanas(hoje: string, n: number): string[] {
  const atual = inicioSemana(hoje);
  return Array.from({ length: n }, (_, i) => somarDias(atual, (i - n + 1) * 7));
}
