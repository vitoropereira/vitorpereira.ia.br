// Reconstrução do histórico de seguidores a partir de ganhos/perdas diários.
// Roda no type-stripping do Node (via gravador): sem `enum`, import com `.ts`.

import { somarDias } from "./dia.ts";

export interface LinhaSeguidores {
  dia: string;
  /** Total real que a API devolveu naquele dia; null na maioria dos dias. */
  seguidores: number | null;
  subs_gained: number | null;
  subs_lost: number | null;
}

const conhecido = (
  l: LinhaSeguidores | undefined,
): l is LinhaSeguidores & {
  subs_gained: number;
  subs_lost: number;
} => l != null && l.subs_gained != null && l.subs_lost != null;

const saldo = (l: { subs_gained: number; subs_lost: number }) =>
  l.subs_gained - l.subs_lost;

/**
 * `dia → seguidores no fim do dia`, reconstruído para trás a partir de L, o
 * último dia com ganhos/perdas conhecidos. A âncora é o `seguidores` real mais
 * recente: o Analytics atrasa 2–3 dias, então ela costuma ser posterior a L e
 * o erro fica no saldo desses dias, que ainda não existe. Âncora anterior a L
 * (contagem oculta depois) soma o saldo conhecido até L.
 *
 * Dia sem ganhos/perdas interrompe a série: daí para trás não sai número, em
 * vez de tratar a lacuna como saldo zero.
 */
export function reconstruirSeguidores(
  linhas: LinhaSeguidores[],
): Map<string, number> {
  const out = new Map<string, number>();
  const porDia = new Map(linhas.map((l) => [l.dia, l]));

  let ancora: LinhaSeguidores | null = null;
  let ultimo: string | null = null;
  for (const l of linhas) {
    if (l.seguidores != null && (!ancora || l.dia > ancora.dia)) ancora = l;
    if (conhecido(l) && (!ultimo || l.dia > ultimo)) ultimo = l.dia;
  }
  if (!ancora || ancora.seguidores == null || !ultimo) return out;

  // Ajuste da âncora até L, dia a dia. Âncora depois de L não tem ajuste: por
  // definição de L, não há dia conhecido entre os dois. Lacuna entre âncora e
  // L invalida tudo: somar só os dias conhecidos seria tratá-la como saldo
  // zero, e o erro contaminaria a série inteira.
  let valor = ancora.seguidores;
  for (let d = somarDias(ancora.dia, 1); d <= ultimo; d = somarDias(d, 1)) {
    const l = porDia.get(d);
    if (!conhecido(l)) return out;
    valor += saldo(l);
  }

  let dia = ultimo;
  let atual = porDia.get(dia);
  while (conhecido(atual)) {
    out.set(dia, valor);
    valor -= saldo(atual);
    dia = somarDias(dia, -1);
    atual = porDia.get(dia);
  }
  return out;
}
