"use client";

import { useEffect, useRef, useState } from "react";

const LABEL = { pt: "Progresso de leitura", en: "Reading progress" } as const;

export function ReadingProgress({ locale }: { locale: "pt" | "en" }) {
  const barRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      // Só transform: scaleX não dispara layout nem paint do resto da página.
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      setValue(Math.round(p * 100));
    };
    // rAF agrupa vários eventos de scroll num único cálculo por frame.
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-label={LABEL[locale]}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div
        ref={barRef}
        className="bg-primary h-full w-full origin-left"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
