"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { prefersReducedMotion } from "./reducedMotion";

type RevealProps = {
  children: ReactNode;
  as?: "div" | "section" | "li" | "article" | "span";
  delay?: number;
  variant?: "fade-up" | "fade";
  className?: string;
};

// Cuidados de uso:
// - classes utilitárias do Tailwind no mesmo nó (`opacity-*`, `transition-*`)
//   vencem as regras de `@layer components` e cancelam o reveal;
// - nunca envolva o hero / elemento LCP em Reveal: ele fica com opacity 0 até
//   a hidratação.
// threshold 0: bloco mais alto que a viewport nunca atinge uma fração visível.
//
// Escreve o atributo direto no DOM em vez de usar state: revelar não precisa
// re-renderizar nada, e os filhos (Server Components) ficam intocados.
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  variant = "fade-up",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    document.documentElement.dataset.motion = "ready";
    const el = ref.current;
    if (!el) return;
    const reveal = () => el.setAttribute("data-revealed", "");
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      reveal();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const style = delay
    ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties)
    : undefined;

  return (
    <Tag
      ref={ref as never}
      data-reveal={variant}
      style={style}
      className={className}
    >
      {children}
    </Tag>
  );
}
