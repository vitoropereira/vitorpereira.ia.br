import Link from "next/link";
import type { Locale } from "../types";
import { cn } from "@/lib/utils";

const MAX_CHIPS = 12;

/**
 * Destaque (card full-row) só na página 1: nas seguintes o "mais recente"
 * seria só mais um post antigo e quebraria a grade.
 */
export function shouldFeatureFirst(page: number): boolean {
  return page === 1;
}

/** Tags ordenadas por frequência desc; empate resolvido em ordem alfabética
 *  para a ordem ser estável entre builds. */
export function rankTagsByFrequency(
  posts: readonly { tags?: readonly string[] }[],
): string[] {
  const count = new Map<string, number>();
  for (const p of posts)
    for (const t of p.tags ?? []) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([t]) => t);
}

export function TagChips({
  tags,
  locale,
  active,
}: {
  tags: readonly string[];
  locale: Locale;
  active?: string;
}) {
  if (tags.length === 0) return null;
  const prefix = locale === "en" ? "/en/tags" : "/tags";
  // Com ≤ 12 chips, flex-wrap quebra em linhas e nunca estoura 375px;
  // scroll horizontal esconderia tags sem ninguém perceber. Sem link "todas":
  // não existe índice de tags para onde apontar.
  return (
    <nav aria-label="Tags" className="mb-10">
      <ul className="flex flex-wrap gap-2">
        {tags.slice(0, MAX_CHIPS).map((tag) => {
          const isActive = tag === active;
          return (
            <li key={tag}>
              <Link
                href={`${prefix}/${encodeURIComponent(tag)}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring inline-block rounded-full border px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-2",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:border-primary hover:text-foreground",
                )}
              >
                #{tag}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
