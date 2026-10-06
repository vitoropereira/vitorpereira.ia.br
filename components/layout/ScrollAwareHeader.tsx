"use client";

import { useEffect, useState } from "react";

// No topo o header some visualmente (sem borda/fundo) para não competir com o
// hero; ao rolar ganha fundo e borda. Listener passivo para não travar scroll.
export function ScrollAwareHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? "" : undefined}
      className="data-[scrolled]:border-border data-[scrolled]:bg-background/80 sticky top-0 z-40 border-b border-transparent bg-transparent transition-colors data-[scrolled]:backdrop-blur"
    >
      {children}
    </header>
  );
}
