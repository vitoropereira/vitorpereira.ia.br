"use client";

import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { SearchItem } from "@/features/blog/lib/searchIndex";

export function CommandPalette({ index }: { index: SearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const locale = useLocale();

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "tags", weight: 0.3 },
          { name: "excerpt", weight: 0.1 },
        ],
        includeScore: true,
        threshold: 0.35,
      }),
    [index],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !isTyping) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const results = q
    ? fuse
        .search(q)
        .slice(0, 10)
        .map((r) => r.item)
    : index.slice(0, 10);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={q}
        onValueChange={setQ}
        placeholder={locale === "pt" ? "Buscar posts…" : "Search posts…"}
      />
      <CommandList>
        <CommandEmpty>
          {locale === "pt" ? "Nenhum resultado" : "No results"}
        </CommandEmpty>
        <CommandGroup heading="Posts">
          {results.map((item) => (
            <CommandItem
              key={item.permalink}
              value={`${item.title} ${item.tags.join(" ")}`}
              onSelect={() => {
                setOpen(false);
                router.push(item.permalink);
              }}
            >
              <span className="truncate">{item.title}</span>
              {item.tags.length > 0 && (
                <span className="text-muted-foreground ml-auto truncate text-xs">
                  {item.tags
                    .slice(0, 2)
                    .map((t) => `#${t}`)
                    .join(" ")}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
