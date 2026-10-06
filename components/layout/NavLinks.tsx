"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  // Rotas que também acendem o item (ex.: posts em /AAAA/MM/DD/slug).
  matchPrefixes?: string[];
  matchPatterns?: RegExp[];
};

type Props = {
  items: NavItem[];
  orientation?: "row" | "column";
  onNavigate?: () => void;
};

// Home nunca casa por prefixo: "/" é prefixo de tudo e acenderia sempre.
function isActive(pathname: string, item: NavItem) {
  const { href } = item;
  if (
    item.matchPrefixes?.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    )
  )
    return true;
  if (item.matchPatterns?.some((re) => re.test(pathname))) return true;
  if (href === "/" || href === "/en") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function NavLinks({ items, orientation = "row", onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <ul
      className={cn(
        "flex text-sm",
        orientation === "row"
          ? "items-center gap-6"
          : "flex-col gap-1 text-base",
      )}
    >
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring relative inline-block rounded-sm outline-none focus-visible:ring-2",
                // Coluna (menu mobile): alvo de toque ≥ 44px.
                orientation === "row" ? "py-1" : "block py-3",
                active
                  ? "text-foreground after:bg-primary font-medium after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:content-['']"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
