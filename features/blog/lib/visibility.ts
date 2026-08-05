import type { Post } from "../types";

/**
 * Regras de visibilidade de post — fonte única de verdade.
 *
 * Um post some do site por dois motivos independentes:
 *
 * - `draft: true` — não terminou, não vai ao ar em nenhuma data.
 * - data no futuro — terminou, mas está **agendado**: entra sozinho quando a
 *   data/hora do frontmatter chegar.
 *
 * Ambos os estados são visíveis em dev (`preview`) para revisão, e invisíveis
 * em produção. Quem consulta post precisa passar por aqui — se filtrar
 * `!draft` na mão, o agendamento vaza.
 */

type Schedulable = Pick<Post, "date">;
type Publishable = Pick<Post, "date" | "draft">;

/**
 * Data ainda não chegou. Data ausente/inválida conta como NÃO agendada — o
 * schema do velite (`s.isodate()`) já garante data válida em todo post real,
 * então isso só afeta fixture de teste incompleta.
 */
export function isScheduled(post: Schedulable, now: Date = new Date()): boolean {
  const at = new Date(post.date).getTime();
  if (Number.isNaN(at)) return false;
  return at > now.getTime();
}

/** Público: publicado (não-draft) e com a data já vencida. */
export function isPublic(post: Publishable, now: Date = new Date()): boolean {
  return !post.draft && !isScheduled(post, now);
}

/**
 * Em dev mostramos draft e agendado para revisão; em produção, só o público.
 * Chamado sem argumento pelos helpers de query — passe explicitamente para
 * forçar um comportamento nos testes.
 */
export function previewEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

/** Rótulo do motivo pelo qual um post não está público (para badge em dev). */
export function hiddenReason(
  post: Publishable,
  now: Date = new Date(),
): "draft" | "scheduled" | null {
  if (post.draft) return "draft";
  if (isScheduled(post, now)) return "scheduled";
  return null;
}
