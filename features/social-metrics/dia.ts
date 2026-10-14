// Dia é sempre `YYYY-MM-DD` de Brasília: o workflow roda às 9h UTC, e a data
// UTC de madrugada é o dia seguinte do Vitor.

// As APIs consolidam o dia com atraso de até ~72 h: reprocessar os últimos 4
// dias corrige o número parcial gravado na primeira passada.
export const DIAS_REPROCESSADOS = 4;

const FORMATO = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function diaSaoPaulo(date: Date): string {
  return FORMATO.format(date);
}

// A aritmética roda em UTC meio-dia para que nenhum fuso desloque a data.
function paraDate(dia: string): Date {
  return new Date(`${dia}T12:00:00Z`);
}

export function somarDias(dia: string, n: number): string {
  const d = paraDate(dia);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function ultimosDias(dia: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => somarDias(dia, i - n + 1));
}

export function ehSegunda(dia: string): boolean {
  return paraDate(dia).getUTCDay() === 1;
}

export function diasEntre(de: string, ate: string): number {
  return Math.round(
    (paraDate(ate).getTime() - paraDate(de).getTime()) / 86_400_000,
  );
}
