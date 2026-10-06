# Redesign ② — Home didática — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A home passa a explicar ao gestor o que é um agente operacional: hero com log animado, "Como funciona", antes/depois, FAQ, cards com capa — em PT e EN.

**Architecture:** Componentes novos em `features/marketing/components/`. Conteúdo bilíngue em objetos `copy`/dados no próprio arquivo (padrão do repo, ex.: `OperationalAgentService.tsx`). Animação reaproveita `Reveal`/`CountUp`/`.card-interactive` do PR ① (`components/motion/`, `app/globals.css`). Só `AgentLog` é client component novo; o resto é Server Component envolto em `Reveal`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, lucide-react, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-05-site-redesign-design.md` (§5)

## Global Constraints

- Nenhum exemplo de venda usa fluxo de empresa do Vitor (ClearSeg, SARCORPS, Pixel, MGM). Cenários genéricos e fictícios, com rótulo "exemplo de execução" / "exemplo".
- Nenhum número inventado. Antes/depois é qualitativo. Preço e prazo vêm de `features/booking/services.ts` (mesma fonte da página de serviço).
- Proibido na seção "Como funciona": RLS, guardrail, LLM, webhook, event-driven.
- Nunca envolver o hero / elemento de LCP em `Reveal`.
- Convenção de escalonamento: `<Reveal delay={i * 80}>` por item (não existe componente Stagger).
- Classe utilitária do Tailwind de `opacity-*`/`transition-*` no mesmo nó do `Reveal` anula o reveal — não usar.
- Só `opacity`/`transform` animam; altura fixa no log do hero (CLS zero).
- `prefers-reduced-motion`: tudo estático no estado final.
- Comentários em pt-BR explicando o porquê; strings de UI no idioma do contexto.
- Teste ao lado do arquivo. Vitest sempre com `</dev/null` e em primeiro plano (sem isso o processo pendura).
- Commits conventional, pt-BR, terminando com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Worktree `../vitorpereira.ia.br-home`, branch `feat/home-didatica`, de `origin/main`. Nunca `git checkout` na pasta principal.

## Review Focus

1. **Aba em segundo plano / hero fora da tela** → o `AgentLog` pausa (não acumula timers nem roda em loop invisível). Teste na Task 2.
2. **Sem JS** → o log mostra o cenário 1 completo (vem do servidor), FAQ abre/fecha (é `<details>`), nada fica invisível. Testes nas Tasks 2 e 5.
3. **EN** → todo texto novo existe em inglês; nenhum link de caso aponta para post sem tradução; número do Proof usa separador decimal do inglês (`3.6M+`). Testes nas Tasks 1, 5 e 6.
4. **Post de caso sem capa ou despublicado** → card renderiza com fallback, sem quebrar o build. Teste na Task 6.
5. **Unmount no meio da animação** (navegação client-side) → nenhum `setState` depois do unmount, timers limpos. Teste na Task 2.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `features/marketing/components/Proof.tsx` (modify) | valor por idioma |
| `features/marketing/data/agentLogScenarios.ts` (create) | 3 cenários fictícios PT/EN |
| `features/marketing/components/AgentLog.tsx` (create) | janela de terminal animada |
| `features/marketing/components/Hero.tsx` (modify) | 2 colunas com `AgentLog` |
| `features/marketing/components/HowItWorks.tsx` (create) | 5 passos + linha desenhada |
| `features/marketing/components/BeforeAfter.tsx` (create) | hoje × com agente |
| `features/marketing/components/Faq.tsx` (create) | acordeão + JSON-LD |
| `components/seo/JsonLd.tsx` (modify) | tipo `FAQPage` |
| `features/marketing/components/Specialties.tsx` (modify) | copy sem jargão + Reveal |
| `features/marketing/components/CaseStudies.tsx` (modify) | capas, primeiro em destaque |
| `features/marketing/components/LatestPosts.tsx` (modify) | cards com capa |
| `features/blog/lib/cover.ts` (create) | extrair `{src,width,height}` do `post.cover` (hoje repetido em 3 lugares) |
| `app/(site)/page.tsx`, `app/(site)/en/page.tsx` (modify) | nova ordem |

---

### Task 0: Worktree

```bash
cd /Users/vop12/projects/vitorpereira.ia.br && git fetch -q
git worktree add -b feat/home-didatica ../vitorpereira.ia.br-home origin/main
cd ../vitorpereira.ia.br-home && git branch --show-current
pnpm install --frozen-lockfile && pnpm exec velite build && pnpm exec vitest run </dev/null
```

---

### Task 1: Proof com número por idioma

**Files:** Modify `features/marketing/components/Proof.tsx`, `features/marketing/components/Proof.test.tsx`

- [ ] **Step 1: Teste (acrescentar ao `Proof.test.tsx`)**

```tsx
  it("usa o separador decimal de cada idioma", () => {
    const { unmount } = render(<Proof locale="en" />);
    expect(screen.getAllByText("3.6M+").length).toBeGreaterThan(0);
    expect(screen.queryByText("3,6M+")).toBeNull();
    unmount();
    render(<Proof locale="pt" />);
    expect(screen.getAllByText("3,6M+").length).toBeGreaterThan(0);
  });
```

- [ ] **Step 2: Rodar e ver falhar** — `pnpm vitest run features/marketing/components/Proof.test.tsx </dev/null` → FAIL (EN mostra `3,6M+`).

- [ ] **Step 3: Implementar** — em `Proof.tsx`, trocar `value: string` por `value: string | { pt: string; en: string }` no tipo `Stat`; no stat de interações usar `value: { pt: "3,6M+", en: "3.6M+" }`; resolver com `const v = typeof stat.value === "string" ? stat.value : stat.value[lang];` e usar `v` no `key` e no `CountUp`. Comentário pt-BR: o leitor de EN leria "3,6" como três mil e seiscentos.

- [ ] **Step 4: Passar e commitar** — `fix(home): número do Proof com separador decimal do inglês`.

---

### Task 2: `AgentLog` + cenários

**Files:**
- Create: `features/marketing/data/agentLogScenarios.ts`, `features/marketing/components/AgentLog.tsx`, `features/marketing/components/AgentLog.test.tsx`

**Interfaces:**
- Produces:
  ```ts
  export type LogKind = "input" | "read" | "alert" | "human" | "done";
  export type LogLine = { time: string; kind: LogKind; text: string };
  export type Scenario = { agent: string; lines: LogLine[] };
  export const agentLogScenarios: Record<"pt" | "en", Scenario[]>;
  export function AgentLog(props: { locale: Locale; className?: string }): JSX.Element;
  ```

- [ ] **Step 1: Dados — `agentLogScenarios.ts`**

```ts
import type { Locale } from "@/lib/i18n/config";

// Cenários fictícios e genéricos: servem para o gestor de qualquer ramo se
// reconhecer. Nunca usar o fluxo de uma empresa real do Vitor aqui.
export type LogKind = "input" | "read" | "alert" | "human" | "done";
export type LogLine = { time: string; kind: LogKind; text: string };
export type Scenario = { agent: string; lines: LogLine[] };

export const agentLogScenarios: Record<Locale, Scenario[]> = {
  pt: [
    {
      agent: "agente-financeiro",
      lines: [
        { time: "09:14:02", kind: "input", text: "nota fiscal recebida por e-mail" },
        { time: "09:14:03", kind: "read", text: "valores conferidos com o pedido" },
        { time: "09:14:03", kind: "alert", text: "divergência de R$ 312,00 no frete" },
        { time: "09:14:04", kind: "human", text: "aguardando aprovação → Ana (financeiro)" },
        { time: "09:16:40", kind: "done", text: "aprovado por Ana — lançamento feito" },
      ],
    },
    {
      agent: "agente-atendimento",
      lines: [
        { time: "10:02:11", kind: "input", text: "mensagem nova no WhatsApp" },
        { time: "10:02:12", kind: "read", text: "pedido #4812 identificado" },
        { time: "10:02:12", kind: "read", text: "status conferido no sistema: em separação" },
        { time: "10:02:13", kind: "done", text: "resposta enviada ao cliente" },
      ],
    },
    {
      agent: "agente-operacao",
      lines: [
        { time: "14:30:00", kind: "input", text: "planilha nova no Drive" },
        { time: "14:30:04", kind: "read", text: "214 linhas validadas" },
        { time: "14:30:04", kind: "alert", text: "3 linhas com CNPJ inválido" },
        { time: "14:30:05", kind: "human", text: "responsável avisado → Bruno (operações)" },
        { time: "14:30:05", kind: "done", text: "211 linhas importadas" },
      ],
    },
  ],
  en: [
    {
      agent: "finance-agent",
      lines: [
        { time: "09:14:02", kind: "input", text: "invoice received by email" },
        { time: "09:14:03", kind: "read", text: "amounts checked against the order" },
        { time: "09:14:03", kind: "alert", text: "R$ 312.00 mismatch on shipping" },
        { time: "09:14:04", kind: "human", text: "waiting for approval → Ana (finance)" },
        { time: "09:16:40", kind: "done", text: "approved by Ana — entry posted" },
      ],
    },
    {
      agent: "support-agent",
      lines: [
        { time: "10:02:11", kind: "input", text: "new WhatsApp message" },
        { time: "10:02:12", kind: "read", text: "order #4812 identified" },
        { time: "10:02:12", kind: "read", text: "status checked in the system: being packed" },
        { time: "10:02:13", kind: "done", text: "reply sent to the customer" },
      ],
    },
    {
      agent: "ops-agent",
      lines: [
        { time: "14:30:00", kind: "input", text: "new spreadsheet in Drive" },
        { time: "14:30:04", kind: "read", text: "214 rows validated" },
        { time: "14:30:04", kind: "alert", text: "3 rows with an invalid tax ID" },
        { time: "14:30:05", kind: "human", text: "owner notified → Bruno (operations)" },
        { time: "14:30:05", kind: "done", text: "211 rows imported" },
      ],
    },
  ],
};
```

Nota: os números dentro do log (R$ 312,00, 214 linhas) são parte do **exemplo fictício rotulado**, não afirmação sobre clientes — o rótulo "exemplo de execução" é obrigatório no componente.

- [ ] **Step 2: Teste — `AgentLog.test.tsx`**

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { AgentLog } from "./AgentLog";
import { agentLogScenarios } from "../data/agentLogScenarios";
import { mockIntersectionObserver, mockMatchMedia } from "@/components/motion/testUtils";

const pt = agentLogScenarios.pt;

describe("AgentLog", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;
  beforeEach(() => {
    vi.useFakeTimers();
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
  });
  afterEach(() => {
    io.restore();
    restoreMM();
    vi.useRealTimers();
  });

  it("o HTML inicial já traz o cenário 1 completo e o rótulo de exemplo (sem JS)", () => {
    render(<AgentLog locale="pt" />);
    for (const l of pt[0]!.lines) expect(screen.getAllByText(l.text).length).toBeGreaterThan(0);
    expect(screen.getByText(/exemplo de execução/i)).toBeInTheDocument();
  });

  it("passa ao próximo cenário e digita linha a linha quando visível", () => {
    render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(2600)); // pausa no cenário 1
    expect(screen.queryByText(pt[0]!.lines[0]!.text)).toBeNull();
    act(() => vi.advanceTimersByTime(700));
    expect(screen.getByText(pt[1]!.lines[0]!.text)).toBeInTheDocument();
    expect(screen.queryByText(pt[1]!.lines[3]!.text)).toBeNull();
  });

  it("pausa fora da tela", () => {
    render(<AgentLog locale="pt" />);
    act(() => io.trigger(false));
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getAllByText(pt[0]!.lines[0]!.text).length).toBeGreaterThan(0);
  });

  it("com reduced-motion fica estático no cenário 1", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getAllByText(pt[0]!.lines[4]!.text).length).toBeGreaterThan(0);
  });

  it("desmontar no meio da animação limpa os timers", () => {
    const { unmount } = render(<AgentLog locale="pt" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(3000));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("EN usa os cenários em inglês", () => {
    render(<AgentLog locale="en" />);
    expect(screen.getByText(/example run/i)).toBeInTheDocument();
    expect(screen.getAllByText(agentLogScenarios.en[0]!.lines[0]!.text).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar** — módulo inexistente.

- [ ] **Step 4: Implementar `AgentLog.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Hand, Inbox, ScanSearch, TriangleAlert, type LucideIcon } from "lucide-react";
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
  alert: "text-amber-500",
  human: "text-primary",
  done: "text-emerald-500",
};

const LABEL = {
  pt: { live: "ao vivo", example: "exemplo de execução", aria: "Exemplo de um agente executando um processo" },
  en: { live: "live", example: "example run", aria: "Example of an agent running a workflow" },
} as const;

// O servidor manda o cenário 1 inteiro (sem JS, leitor de tela e crawler veem
// o exemplo completo). No cliente, depois de uma pausa, a animação passa ao
// próximo cenário e digita linha a linha. Altura fixa = sem layout shift.
export function AgentLog({ locale, className }: { locale: Locale; className?: string }) {
  const scenarios = agentLogScenarios[locale];
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(scenarios[0]!.lines.length);
  const rootRef = useRef<HTMLDivElement>(null);
  const visible = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;

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

  return (
    <figure
      ref={rootRef}
      aria-label={t.aria}
      className={cn("bg-card overflow-hidden rounded-xl border font-mono text-[13px] shadow-sm", className)}
    >
      <div className="bg-muted flex items-center gap-1.5 border-b px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" aria-hidden />
        <span className="size-2.5 rounded-full bg-[#28C840]" aria-hidden />
        <span className="text-muted-foreground ml-3 truncate">{scenario.agent}</span>
        <span className="text-primary ml-auto flex items-center gap-1.5 text-xs">
          <span className="bg-primary size-1.5 animate-pulse rounded-full motion-reduce:animate-none" aria-hidden />
          {t.live}
        </span>
      </div>
      <ol className="h-[13.5rem] space-y-2 p-4" aria-live="off">
        {scenario.lines.slice(0, shown).map((line, k) => {
          const Icon = ICON[line.kind];
          return (
            <li key={`${index}-${k}`} className="animate-in fade-in flex gap-3 duration-300 motion-reduce:animate-none">
              <span className="text-muted-foreground shrink-0 tabular-nums">{line.time}</span>
              <Icon className={cn("mt-0.5 size-3.5 shrink-0", TONE[line.kind])} aria-hidden />
              <span className={TONE[line.kind]}>{line.text}</span>
            </li>
          );
        })}
      </ol>
      <figcaption className="text-muted-foreground border-t px-4 py-2 text-[11px] tracking-wider uppercase">
        {t.example}
      </figcaption>
    </figure>
  );
}
```

Notas:
- `animate-in fade-in` vem do `tw-animate-css` já importado no `globals.css`.
- Os tons `text-amber-500`/`text-emerald-500` precisam de contraste AA nos dois temas; conferir na tela (Task 8). Se o amber falhar no tema claro, usar `text-amber-600 dark:text-amber-400`.
- Se o lint reclamar de `setState` síncrono em efeito, ele não deve: os `setState` estão em callbacks de timer/observer.

- [ ] **Step 5: Passar** — `pnpm vitest run features/marketing/components/AgentLog.test.tsx </dev/null`. Se `vi.getTimerCount()` não for 0 no teste de unmount, o cleanup está vazando: corrija o código, não o teste.

- [ ] **Step 6: Commit** — `feat(home): log de agente animado com cenários fictícios`.

---

### Task 3: Hero em duas colunas

**Files:** Modify `features/marketing/components/Hero.tsx`, `features/marketing/components/Hero.test.tsx`

- [ ] **Step 1: Teste (acrescentar)**

```tsx
  it("mostra o log de exemplo ao lado do texto", () => {
    render(<Hero locale="pt" />);
    expect(screen.getByRole("figure", { name: /exemplo de um agente/i })).toBeInTheDocument();
  });

  it("o hero não é envolvido por Reveal (é o LCP)", () => {
    const { container } = render(<Hero locale="pt" />);
    expect(container.querySelector("[data-reveal]")).toBeNull();
  });
```

(Os testes de jsdom do `AgentLog` precisam dos mocks; adicionar `beforeEach`/`afterEach` com `mockIntersectionObserver`/`mockMatchMedia` ao `Hero.test.tsx`.)

- [ ] **Step 2: Implementar** — a `<section>` vira `mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.1fr_0.9fr]`; o bloco de texto atual (eyebrow, h1, pitch, CTAs) vai num `<div>`; à direita `<AgentLog locale={locale} />`. No mobile o log fica abaixo dos CTAs. Reduzir o h1 para `md:text-5xl lg:text-6xl` se quebrar mal com a coluna mais estreita (conferir na tela).

- [ ] **Step 3: Passar e commitar** — `feat(home): hero em duas colunas com o log do agente`.

---

### Task 4: `HowItWorks` e `BeforeAfter`

**Files:** Create `features/marketing/components/HowItWorks.tsx`, `HowItWorks.test.tsx`, `BeforeAfter.tsx`, `BeforeAfter.test.tsx`

- [ ] **Step 1: Testes**

`HowItWorks.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HowItWorks } from "./HowItWorks";

const BANNED = /\b(RLS|guardrails?|LLM|webhooks?|event-driven)\b/i;

describe("HowItWorks", () => {
  it.each(["pt", "en"] as const)("tem 5 passos em ordem (%s)", (locale) => {
    render(<HowItWorks locale={locale} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  it.each(["pt", "en"] as const)("não usa jargão (%s)", (locale) => {
    const { container } = render(<HowItWorks locale={locale} />);
    expect(container.textContent).not.toMatch(BANNED);
  });

  it("destaca a aprovação humana", () => {
    render(<HowItWorks locale="pt" />);
    expect(screen.getByText(/você aprova o que é sensível/i)).toBeInTheDocument();
  });
});
```

`BeforeAfter.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeforeAfter } from "./BeforeAfter";

describe("BeforeAfter", () => {
  it.each(["pt", "en"] as const)("duas colunas, 4 itens cada, sem números (%s)", (locale) => {
    const { container } = render(<BeforeAfter locale={locale} />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(2);
    lists.forEach((ul) => expect(ul.querySelectorAll("li")).toHaveLength(4));
    expect(container.textContent).not.toMatch(/\d/);
  });

  it("é rotulado como exemplo", () => {
    render(<BeforeAfter locale="pt" />);
    expect(screen.getByText(/exemplo/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implementar `HowItWorks.tsx`**

Copy:

```ts
const copy = {
  pt: {
    eyebrow: "como funciona",
    title: "Como um agente trabalha no seu processo",
    steps: [
      { icon: Inbox, title: "Algo chega", text: "Uma mensagem, um e-mail, um arquivo ou um pedido." },
      { icon: ScanSearch, title: "O agente entende", text: "Lê, extrai o que importa e confere com as regras do processo." },
      { icon: Cog, title: "Age nas suas ferramentas", text: "Nas que a empresa já usa. Não precisa trocar de sistema." },
      { icon: Hand, title: "Você aprova o que é sensível", text: "Ação que não dá para desfazer espera uma pessoa decidir." },
      { icon: ScrollText, title: "Tudo fica registrado", text: "Dá para ver o que foi feito, quando e por quê." },
    ],
  },
  en: {
    eyebrow: "how it works",
    title: "How an agent works inside your process",
    steps: [
      { icon: Inbox, title: "Something arrives", text: "A message, an email, a file, or an order." },
      { icon: ScanSearch, title: "The agent understands it", text: "It reads, extracts what matters, and checks it against the process rules." },
      { icon: Cog, title: "It acts in your tools", text: "The ones your company already uses. No need to switch systems." },
      { icon: Hand, title: "You approve what is sensitive", text: "Anything that can't be undone waits for a person to decide." },
      { icon: ScrollText, title: "Everything is recorded", text: "You can see what was done, when, and why." },
    ],
  },
};
```

Markup: `<section className="mx-auto max-w-6xl px-6 py-20">` com eyebrow mono `text-primary`, `h2` grande, e `<ol className="relative mt-12 grid gap-8 md:grid-cols-5">`. Cada passo é `<Reveal as="li" delay={i * 120}>` com número (`01`…`05`, mono, `text-primary`), ícone num quadrado `bg-accent rounded-lg p-2.5`, título `font-semibold` e texto `text-muted-foreground text-sm`. O passo 4 (aprovação) ganha anel `ring-primary/40 ring-1` no ícone — é a mensagem central.

Linha conectando (só `md+`): um `<svg aria-hidden className="pointer-events-none absolute top-6 right-[10%] left-[10%] hidden h-px md:block" preserveAspectRatio="none" viewBox="0 0 100 1">` com `<line x1="0" y1="0.5" x2="100" y2="0.5" stroke="var(--brand)" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="100" strokeDashoffset="100" pathLength={100} className="how-line" />`, envolto num `<Reveal variant="fade">`. Em `app/globals.css` (dentro do bloco de motion do `@layer components`):

```css
  /* A linha do "Como funciona" se desenha quando a seção é revelada. */
  [data-revealed] .how-line {
    animation: draw 1.2s var(--ease-out) forwards;
  }
```

e no bloco de reduced-motion: `.how-line { stroke-dashoffset: 0 !important; animation: none !important; }`. Sem JS (sem `.js`), a linha também precisa aparecer: adicionar `html:not(.js) .how-line { stroke-dashoffset: 0; }`.

- [ ] **Step 3: Implementar `BeforeAfter.tsx`**

```ts
const copy = {
  pt: {
    eyebrow: "exemplo",
    title: "O mesmo processo, antes e depois",
    before: { label: "Hoje", items: [
      "Alguém copia dados de um sistema para outro.",
      "A conferência é feita à mão, item por item.",
      "O erro aparece tarde, quando já virou retrabalho.",
      "Ninguém sabe ao certo o que foi feito e quando.",
    ]},
    after: { label: "Com um agente", items: [
      "O repetitivo é executado sozinho, no ritmo em que chega.",
      "O agente para e pergunta quando o caso é sensível.",
      "A divergência aparece na hora, com o motivo.",
      "Cada passo fica registrado e pode ser revisto.",
    ]},
  },
  en: {
    eyebrow: "example",
    title: "The same process, before and after",
    before: { label: "Today", items: [
      "Someone copies data from one system into another.",
      "Checks are done by hand, item by item.",
      "Errors show up late, after they turned into rework.",
      "Nobody knows exactly what was done and when.",
    ]},
    after: { label: "With an agent", items: [
      "Repetitive work runs on its own, as it arrives.",
      "The agent stops and asks when a case is sensitive.",
      "Mismatches show up right away, with the reason.",
      "Every step is recorded and can be reviewed.",
    ]},
  },
};
```

Layout: `md:grid-cols-2 gap-6`. Coluna "Hoje": card `border bg-muted/40`, ícone `XCircle` `text-muted-foreground` em cada item. Coluna "Com um agente": card `border-primary/40 bg-card`, ícone `CheckCircle2 text-primary`. Cada coluna é um `<Reveal delay={0|120}>`.

- [ ] **Step 4: Passar e commitar** — `feat(home): seções "como funciona" e antes/depois`.

---

### Task 5: `Faq` + JSON-LD `FAQPage`

**Files:** Create `features/marketing/components/Faq.tsx`, `Faq.test.tsx`; Modify `components/seo/JsonLd.tsx`, `components/seo/JsonLd.test.tsx`

**Interfaces:**
- Produces: `type FaqItem = { q: string; a: string }`; `export function getFaq(locale: Locale): FaqItem[]`; `export function Faq(props: { locale: Locale; withJsonLd?: boolean }): JSX.Element` (default `withJsonLd = true`; a página de serviço do PR ④ reutiliza). `JsonLdData` ganha `{ type: "FAQPage"; items: { q: string; a: string }[] }`.

- [ ] **Step 1: Testes**

`Faq.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Faq, getFaq } from "./Faq";
import { formatPrice, getBookingService } from "@/features/booking/services";

describe("Faq", () => {
  it.each(["pt", "en"] as const)("5 perguntas como <details> (%s)", (locale) => {
    const { container } = render(<Faq locale={locale} />);
    expect(container.querySelectorAll("details")).toHaveLength(5);
  });

  it("o preço vem do catálogo de agendamento, não de texto fixo", () => {
    const service = getBookingService("escopo-software-30-dias")!;
    const pt = getFaq("pt").map((i) => i.a).join(" ").toLowerCase();
    const en = getFaq("en").map((i) => i.a).join(" ").toLowerCase();
    expect(pt).toContain(formatPrice(service, "pt").toLowerCase());
    expect(en).toContain(formatPrice(service, "en").toLowerCase());
  });

  it("emite JSON-LD FAQPage com as mesmas perguntas", () => {
    const { container } = render(<Faq locale="pt" />);
    const ld = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(5);
  });

  it("withJsonLd=false não emite script", () => {
    const { container } = render(<Faq locale="pt" withJsonLd={false} />);
    expect(container.querySelector("script")).toBeNull();
  });
});
```

`<details>` nativo não precisa de teste de clique. Zero dependência nova.

- [ ] **Step 2: JSON-LD** — em `JsonLd.tsx` adicionar `type FaqPageData = { type: "FAQPage"; items: { q: string; a: string }[] };` à união e o ramo:

```ts
  } else if (data.type === "FAQPage") {
    json = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: data.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    };
```

(confira se os outros ramos já incluem `"@context"` — siga o mesmo padrão). Teste em `JsonLd.test.tsx`: renderiza FAQPage com 1 item e confere `@type` e `mainEntity[0].acceptedAnswer.text`.

- [ ] **Step 3: Implementar `Faq.tsx`**

```ts
export function getFaq(locale: Locale): FaqItem[] {
  // Preço e prazo saem do catálogo de agendamento: a home não pode mostrar um
  // número e a página de serviço outro.
  const pilot = getBookingService("escopo-software-30-dias");
  const price = pilot ? formatPrice(pilot, locale) : "";
  if (locale === "en") {
    return [
      { q: "Does this replace my team?", a: "No. The agent takes over the repetitive part of one bounded workflow; a person stays accountable for the outcome and decides what is sensitive. If the goal is to replace a whole team on day one, this is not the right place to start." },
      { q: "What if the AI gets it wrong?", a: "The agent only gets the permissions it needs, fails visibly, and asks for a human decision when an action is irreversible or outside its contract. Everything is logged, so you can see what happened and fix it." },
      { q: "Do I need to change the systems I use?", a: "No. The agent works inside the tools your company already uses, as long as they can be accessed through an API." },
      { q: "How long does it take and how much does it cost?", a: `A pilot for one workflow takes 21 to 30 days, ${price}. The exact number comes out of the scoping session, which is included. The first 30-minute conversation is free.` },
      { q: "Is my data safe?", a: "The boundary lives on the server, not in the prompt: the agent only reaches the data allowed for that workflow, and every access and action is logged." },
    ];
  }
  return [
    { q: "Isso substitui minha equipe?", a: "Não. O agente assume a parte repetitiva de um processo delimitado; uma pessoa continua responsável pelo resultado e decide o que é sensível. Se a expectativa é substituir uma equipe inteira no primeiro dia, não é por aqui que se começa." },
    { q: "E se a IA errar?", a: "O agente recebe só as permissões necessárias, falha de forma visível e pede decisão humana quando a ação é irreversível ou foge do combinado. Tudo fica registrado, então dá para ver o que aconteceu e corrigir." },
    { q: "Preciso trocar os sistemas que uso?", a: "Não. O agente trabalha dentro das ferramentas que a empresa já usa, desde que elas possam ser acessadas por API." },
    { q: "Quanto tempo leva e quanto custa?", a: `O piloto de um processo leva de 21 a 30 dias, ${price.charAt(0).toLowerCase() + price.slice(1)}. O número exato sai do diagnóstico de escopo, que já está incluído. A primeira conversa, de 30 minutos, é gratuita.` },
    { q: "Meus dados ficam seguros?", a: "A fronteira fica no servidor, não no prompt: o agente só acessa os dados permitidos para aquele processo, e cada acesso e ação fica registrado." },
  ];
}
```

(Para o EN, `price` começa com "From R$ 20,000" — ajustar para minúscula também: `price.charAt(0).toLowerCase() + price.slice(1)` → "from R$ 20,000". Faça o mesmo nos dois idiomas com uma função local `lowerFirst`. O teste de preço usa `toContain(formatPrice(...))` — ajuste o teste para comparar sem diferenciar a primeira letra: `expect(answer.toLowerCase()).toContain(formatPrice(service, "pt").toLowerCase())`.)

Markup: `<section className="mx-auto max-w-3xl px-6 py-20">`, título "Perguntas frequentes" / "Frequently asked questions", lista de `<details className="group border-b py-5">` com `<summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">` + ícone `Plus` que gira 45° em `group-open:rotate-45 transition-transform motion-reduce:transition-none`, e `<p className="text-muted-foreground mt-3">`. Cada `<details>` dentro de `<Reveal delay={i * 60}>`. Ao fim, `{withJsonLd && <JsonLd data={{ type: "FAQPage", items }} id="jsonld-faq" />}`.

- [ ] **Step 4: Passar e commitar** — `feat(home): FAQ com respostas do catálogo e JSON-LD FAQPage`.

---

### Task 6: Capas em Casos e Últimos posts; Specialties sem jargão

**Files:** Create `features/blog/lib/cover.ts`, `cover.test.ts`; Modify `CaseStudies.tsx`, `CaseStudies.test.tsx`, `LatestPosts.tsx`, `Specialties.tsx`, `FeaturedProjects.tsx`

**Interfaces:**
- Produces: `export type CoverImage = { src: string; width: number; height: number; blurDataURL?: string }`; `export function coverOf(post: { cover?: unknown } | undefined): CoverImage | null`.

- [ ] **Step 1: `cover.ts` + teste**

```ts
// O Velite tipa `cover` como opcional e o formato real é um objeto de imagem;
// três telas repetiam o mesmo cast. Fica num lugar só.
export type CoverImage = { src: string; width: number; height: number; blurDataURL?: string };

export function coverOf(post: { cover?: unknown } | undefined): CoverImage | null {
  const c = post?.cover;
  if (c && typeof c === "object" && "src" in c && typeof (c as CoverImage).src === "string") {
    return c as CoverImage;
  }
  return null;
}
```

Teste: objeto válido → retorna; `undefined`, `{}`, `{cover: "x"}` → `null`.

- [ ] **Step 2: `CaseStudies`** — derivar o slug do `href` (`href.split("/").pop()`), buscar `getPostBySlug(locale, slug, { preview: false })` e `coverOf(post)`. Layout: o primeiro caso vira card grande (`md:col-span-2 md:grid md:grid-cols-[1.2fr_1fr]`, capa à esquerda `aspect-video`), os demais em grid de 2 colunas com capa `aspect-[16/9]` no topo. Sem capa → bloco `bg-gradient-to-br from-primary/15 to-transparent` com o `tag` em mono. Cada card: `<Reveal as="article" delay={i * 80} className="card-interactive group overflow-hidden rounded-lg border">`; o link continua no título (o teste existente procura pelo nome do link). `next/image` com `sizes` coerente (`(min-width: 768px) 50vw, 100vw`; destaque `60vw`).
  Teste novo em `CaseStudies.test.tsx`: `it("cada caso com capa renderiza imagem", ...)` → em PT, `container.querySelectorAll("img").length` ≥ 3 (os 5 posts dos casos têm capa hoje). Teste de fallback: mockar `getPostBySlug` (`vi.mock("@/features/blog/lib/queries", ...)` retornando `undefined`) e conferir que renderiza sem lançar e sem `img`.

- [ ] **Step 3: `LatestPosts`** — trocar a lista por grid `sm:grid-cols-2 lg:grid-cols-3` de cards (capa `aspect-[16/9]`, data, título), primeiro post `lg:col-span-2 lg:row-span-2` com capa maior. Usa `coverOf`. `Reveal` com delay escalonado. Fallback igual ao dos casos.

- [ ] **Step 4: `Specialties` sem jargão**

```ts
pt:
  { title: "Agentes que executam", desc: "Um agente que faz o trabalho de ponta a ponta — não só responde perguntas." }
  { title: "Automação de processos", desc: "Integrações e rotinas que rodam sozinhas entre as ferramentas da empresa." }
  { title: "IA dentro do seu produto", desc: "Um assistente que responde sobre os dados de cada cliente, dentro do sistema." }
  { title: "Segurança e controle", desc: "Cada agente só acessa o que precisa, e a regra fica no servidor (não no texto do prompt)." }
en:
  { title: "Agents that execute", desc: "An agent that gets the job done end to end — not one that only answers questions." }
  { title: "Process automation", desc: "Integrations and routines that run on their own across your company's tools." }
  { title: "AI inside your product", desc: "An assistant that answers about each customer's data, inside the system." }
  { title: "Security and control", desc: "Each agent only reaches what it needs, and the rule lives on the server (not in the prompt text)." }
```

Cards: `<Reveal delay={i * 80} className="card-interactive rounded-lg border p-5">`.

- [ ] **Step 5: `FeaturedProjects`** — cada `ProjectCard` dentro de `<Reveal delay={i * 80}>` (o card já tem `card-interactive`; Reveal envolve, não no mesmo nó — sem conflito).

- [ ] **Step 6: Passar e commitar** — `feat(home): capas nos casos e posts, especialidades sem jargão`.

---

### Task 7: Ordem da home (PT e EN)

**Files:** Modify `app/(site)/page.tsx`, `app/(site)/en/page.tsx`

- [ ] Ordem nas duas: `Hero`, `Proof`, `HowItWorks`, `BeforeAfter`, `Specialties`, `FeaturedProjects`, `CaseStudies`, `LatestPosts`, `Faq`, `ContactCTA`.
- [ ] Teste (create `app/(site)/page.test.tsx` se viável com os mocks de IO/matchMedia; senão, conferir na tela na Task 8 e registrar): a home PT renderiza "Como um agente trabalha" antes de "O mesmo processo" e o FAQ antes do CTA final.
- [ ] Commit — `feat(home): nova ordem das seções da home`.

---

### Task 8: Verificação real e PR

- [ ] `pnpm lint && pnpm typecheck && pnpm exec vitest run </dev/null && pnpm build`.
- [ ] `pnpm exec next start -p 3109` e screenshots via CDP (`Emulation.setDeviceMetricsOverride`) em 1440×900 e 375×812, temas escuro e claro, `/` e `/en`:
  1. Hero: log anima e troca de cenário (amostrar texto em intervalos); altura do log não muda entre cenários (medir `getBoundingClientRect().height` em 2 cenários).
  2. Reduced-motion: log estático no cenário 1; linha do "Como funciona" visível.
  3. JS desabilitado: log completo, FAQ abre (é `<details>`), nada invisível.
  4. Contraste AA dos tons do log (amber/emerald/primary) nos dois temas — medir com o `getComputedStyle` e checar a razão; corrigir se < 4.5:1.
  5. Overflow horizontal 0 em 375.
  6. `/en`: Proof `3.6M+`, casos só com posts traduzidos.
- [ ] Push + PR (`feat(home): home didática — log animado, como funciona, antes/depois e FAQ`), squash merge depois do CI verde.
