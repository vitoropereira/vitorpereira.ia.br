"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "../lib/toc";
import { cn } from "@/lib/utils";

const TITLE = { pt: "Neste post", en: "On this page" } as const;

export function PostToc({
  items,
  locale,
}: {
  items: TocItem[];
  locale: "pt" | "en";
}) {
  const [active, setActive] = useState<string>("");

  // Abertura direta por âncora (/post#secao): o observer só dispara ao rolar,
  // então sem isto o índice ficaria sem item ativo até o primeiro scroll.
  useEffect(() => {
    let slug = "";
    try {
      slug = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    } catch {
      return; // hash malformado: ignora
    }
    // microtask: ler o hash é sincronizar com sistema externo (location), mas o
    // setState direto no corpo do effect dispara render em cascata.
    if (slug && items.some((it) => it.slug === slug))
      queueMicrotask(() => setActive(slug));
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0% -70% 0%" },
    );
    for (const item of items) {
      const el = document.getElementById(item.slug);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={TITLE[locale]}
      className="text-sm lg:sticky lg:top-20 lg:self-start"
    >
      <p className="text-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        {TITLE[locale]}
      </p>
      <ul className="space-y-2">
        {items.map((it) => {
          const isActive = active === it.slug;
          return (
            <li key={it.slug}>
              <a
                href={`#${it.slug}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "focus-visible:ring-ring block rounded-sm border-l-2 pl-3 transition-colors outline-none focus-visible:ring-2",
                  it.level === 3 && "pl-6",
                  it.level === 4 && "pl-9",
                  isActive
                    ? "text-primary border-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
