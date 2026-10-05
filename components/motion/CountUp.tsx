"use client";

import { useEffect, useRef } from "react";
import { formatStat, parseStat } from "./stat";
import { prefersReducedMotion } from "./reducedMotion";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// O texto final sai do servidor; a animação só reescreve o nó visual depois de
// hidratar. Leitor de tela lê o nó sr-only, que nunca muda.
export function CountUp({
  value,
  durationMs = 1200,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const parsed = parseStat(value);
    if (!el || !parsed || prefersReducedMotion()) return;
    if (typeof IntersectionObserver === "undefined") return;

    let frame = 0;
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        el.textContent =
          t < 1 ? formatStat(parsed.value * easeOutCubic(t), parsed) : value;
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
