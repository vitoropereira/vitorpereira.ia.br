"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Hand,
  Inbox,
  ScanSearch,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { prefersReducedMotion } from "@/components/motion/reducedMotion";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";
import { agentLogScenarios, type LogKind } from "../data/agentLogScenarios";

const LINE_MS = 600;
const HOLD_MS = 2500;

const ICON: Record<LogKind, LucideIcon> = {
  input: Inbox,
  read: ScanSearch,
  alert: TriangleAlert,
  human: Hand,
  done: CheckCircle2,
};
const TONE: Record<LogKind, string> = {
  input: "text-muted-foreground",
  read: "text-foreground",
  alert: "text-amber-700 dark:text-amber-400",
  human: "text-primary",
  done: "text-emerald-700 dark:text-emerald-400",
};

const LABEL = {
  pt: {
    live: "simulação",
    example: "exemplo de execução",
    aria: "Exemplo de um agente executando um processo",
  },
  en: {
    live: "simulated",
    example: "example run",
    aria: "Example of an agent running a workflow",
  },
} as const;

// O servidor manda o cenário 1 inteiro (sem JS e crawler veem o exemplo
// completo). A lista animada é aria-hidden porque muda sozinha; o leitor de
// tela lê a lista sr-only estática do cenário 1, que nunca muda. No cliente, depois de uma pausa, a animação passa ao
// próximo cenário e digita linha a linha. Altura fixa = sem layout shift.
export function AgentLog({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const scenarios = agentLogScenarios[locale];
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(scenarios[0]!.lines.length);
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (
      !el ||
      prefersReducedMotion() ||
      typeof IntersectionObserver === "undefined"
    )
      return;

    let i = 0;
    let n = scenarios[0]!.lines.length;
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
    const step = () => {
      clear();
      if (!visible.current || document.hidden) return; // retoma no próximo evento
      const lines = scenarios[i]!.lines.length;
      if (n < lines) {
        n += 1;
        setShown(n);
        timer.current = setTimeout(step, LINE_MS);
      } else {
        timer.current = setTimeout(() => {
          i = (i + 1) % scenarios.length;
          n = 0;
          setIndex(i);
          setShown(0);
          timer.current = setTimeout(step, LINE_MS);
        }, HOLD_MS);
      }
    };

    const io = new IntersectionObserver((entries) => {
      visible.current = entries.some((e) => e.isIntersecting);
      if (visible.current && !timer.current) step();
      if (!visible.current) clear();
    });
    io.observe(el);
    const onVis = () => {
      if (document.hidden) clear();
      else if (visible.current && !timer.current) step();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      clear();
    };
  }, [scenarios]);

  const scenario = scenarios[index]!;
  const t = LABEL[locale];
  // Cursor inline na última linha (ou numa linha vazia no início): não adiciona
  // linha nova, então a altura fixa da lista não muda. aria-hidden por ser enfeite.
  const cursor = (
    <span
      className="brand-cursor"
      data-testid="agent-cursor"
      aria-hidden="true"
    />
  );

  return (
    <figure
      ref={rootRef}
      aria-label={t.aria}
      className={cn(
        "bg-card overflow-hidden rounded-xl border font-mono text-[13px] shadow-sm",
        className,
      )}
    >
      <div className="bg-muted flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#28C840]" aria-hidden />
        <span className="text-muted-foreground ml-3 truncate">
          {scenario.agent}
        </span>
        <span className="text-foreground/80 ml-auto flex items-center gap-1.5 text-xs">
          <span
            className="bg-primary size-1.5 animate-pulse rounded-full motion-reduce:animate-none"
            aria-hidden
          />
          {t.live}
        </span>
      </div>
      <ol className="sr-only">
        {scenarios[0]!.lines.map((line, k) => (
          <li key={k}>
            {line.time} — {line.text}
          </li>
        ))}
      </ol>
      <ol
        className="h-[20rem] space-y-2 p-4 min-[360px]:h-[17rem] sm:h-[13.5rem]"
        aria-hidden="true"
      >
        {scenario.lines.slice(0, shown).map((line, k) => {
          const Icon = ICON[line.kind];
          return (
            <li
              key={`${index}-${k}`}
              className="animate-in fade-in flex gap-3 duration-300 motion-reduce:animate-none"
            >
              <span className="text-muted-foreground shrink-0 tabular-nums">
                {line.time}
              </span>
              <Icon
                className={cn("mt-0.5 size-3.5 shrink-0", TONE[line.kind])}
                aria-hidden
              />
              <span className={TONE[line.kind]}>
                {line.text}
                {k === shown - 1 && cursor}
              </span>
            </li>
          );
        })}
        {shown === 0 && <li className="h-5">{cursor}</li>}
      </ol>
      <figcaption className="text-muted-foreground border-t px-4 py-2 text-[11px] tracking-wider uppercase">
        {t.example}
      </figcaption>
    </figure>
  );
}
