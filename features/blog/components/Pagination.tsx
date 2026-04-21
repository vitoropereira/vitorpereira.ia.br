import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  current,
  total,
  basePath,
}: {
  current: number;
  total: number;
  basePath: string;
}) {
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  const hrefFor = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center gap-1">
      {current > 1 && (
        <Link
          href={hrefFor(current - 1)}
          aria-label="Previous page"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          ←
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-label={`Page ${p}`}
          aria-current={p === current ? "page" : undefined}
          className={cn(
            buttonVariants({
              variant: p === current ? "default" : "ghost",
              size: "sm",
            }),
          )}
        >
          {p}
        </Link>
      ))}
      {current < total && (
        <Link
          href={hrefFor(current + 1)}
          aria-label="Next page"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          →
        </Link>
      )}
    </nav>
  );
}
