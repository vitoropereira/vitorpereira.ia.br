import { cn } from "@/lib/utils";

/**
 * Marca "v>_" (símbolo mono) e wordmark two-tone "vitor pereira▮".
 * `mark` = tile v>_ (avatar/favicon on-site); `wordmark` = nome + cursor.
 */
export function Logo({
  variant = "wordmark",
  className,
}: {
  variant?: "mark" | "wordmark";
  className?: string;
}) {
  if (variant === "mark") {
    return (
      <span
        role="img"
        aria-label="Vitor Pereira"
        className={cn(
          "border-border bg-card inline-flex h-8 w-8 items-center justify-center rounded-[22%] border font-mono text-sm font-bold",
          className,
        )}
      >
        <span className="text-foreground">v</span>
        <span className="text-brand">&gt;</span>
        <span aria-hidden className="brand-cursor" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-lg font-semibold tracking-tight lowercase",
        className,
      )}
    >
      <span className="text-foreground">vitor</span>
      <span className="text-muted-foreground pl-[0.3ch]">pereira</span>
      <span aria-hidden className="brand-cursor" />
    </span>
  );
}
