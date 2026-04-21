"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "../lib/toc";
import { cn } from "@/lib/utils";

export function PostToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

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
      aria-label="Table of contents"
      className="hidden text-sm lg:sticky lg:top-20 lg:block lg:self-start"
    >
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.slug}
            className={cn(
              "text-muted-foreground hover:text-foreground transition-colors",
              it.level === 3 && "pl-3",
              it.level === 4 && "pl-6",
              active === it.slug && "text-foreground",
            )}
          >
            <a href={`#${it.slug}`}>{it.text}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
