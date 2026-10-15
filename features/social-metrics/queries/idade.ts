import { diaSaoPaulo, diasEntre, somarDias } from "../dia";

// Comparar peças pelo total acumulado premia a mais velha. Aqui toda peça é
// medida na mesma idade (D+N dias desde a publicação, no dia de Brasília).
//
// `views` em vitor_social_post_metrics é a view DO DIA (o adapter pede o
// Analytics com `dimensions: day`), então o acumulado em D+N é a soma de D0 a
// D+N. Dia sem linha soma zero, o que equivale a repetir o acumulado da linha
// anterior.

export interface PontoViews {
  /** `AAAA-MM-DD` de Brasília. */
  dia: string;
  views: number | null;
}

export interface PontoIdade {
  idade: number;
  views: number | null;
}

export function diaZero(publishedAt: Date | string | null): string | null {
  return publishedAt ? diaSaoPaulo(new Date(publishedAt)) : null;
}

/** Acumulado de D0 até `ate`; null se nenhuma linha com valor caiu no trecho. */
function acumulado(
  serie: PontoViews[],
  dia0: string,
  ate: string,
): number | null {
  let soma: number | null = null;
  for (const p of serie) {
    if (p.dia < dia0 || p.dia > ate || p.views === null) continue;
    soma = (soma ?? 0) + Number(p.views);
  }
  return soma;
}

/**
 * Views acumuladas no D+N. Post que ainda não chegou ao D+N devolve null: o
 * número parcial dele não pode competir com o D+N fechado de outro.
 */
export function viewsNoDia(
  publishedAt: Date | string | null,
  serie: PontoViews[],
  n: number,
  hoje: string,
): number | null {
  const dia0 = diaZero(publishedAt);
  if (!dia0 || diasEntre(dia0, hoje) < n) return null;
  return acumulado(serie, dia0, somarDias(dia0, n));
}

/** Curva acumulada por idade, do D0 até a idade de hoje. */
export function curvaPorIdade(
  serie: PontoViews[],
  dia0: string,
  hoje: string,
): PontoIdade[] {
  const idadeAtual = diasEntre(dia0, hoje);
  if (idadeAtual < 0) return [];
  // Uma passada ordenada em vez de reacumular a série a cada idade.
  const porDia = new Map<string, number>();
  for (const p of serie) {
    if (p.views === null) continue;
    porDia.set(p.dia, (porDia.get(p.dia) ?? 0) + Number(p.views));
  }
  const curva: PontoIdade[] = [];
  let soma: number | null = null;
  for (let idade = 0; idade <= idadeAtual; idade++) {
    const v = porDia.get(somarDias(dia0, idade));
    if (v !== undefined) soma = (soma ?? 0) + v;
    curva.push({ idade, views: soma });
  }
  return curva;
}
