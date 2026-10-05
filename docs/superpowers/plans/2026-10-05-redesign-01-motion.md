# Redesign ① — Fundação de motion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao site uma fundação de animação sóbria (revelar no scroll, contador, hover de card) reutilizável pelos PRs ② e ④, com o primeiro consumidor real no `Proof` da home.

**Architecture:** CSS-first. Tokens de duração/easing e as regras de estado ficam em `app/globals.css`; dois componentes client pequenos (`Reveal`, `CountUp`) só ligam/desligam atributos via IntersectionObserver, sem `setState` (nada re-renderiza). Um script inline no `<head>` marca `<html class="js">` antes da pintura, para que o estado oculto só exista quando há JS; um failsafe tira a classe se a hidratação não acontecer.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4 (`@layer components` no `globals.css`), Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-05-site-redesign-design.md` (§4 e a linha "Proof" da §5)

## Global Constraints

- Zero dependência nova.
- Só `opacity` e `transform` animam (nada de `height`, `top`, `width`) — CLS zero.
- `@media (prefers-reduced-motion: reduce)` desliga toda animação num único bloco do `globals.css`; os componentes também checam `matchMedia` e mostram o estado final direto.
- Sem JS, todo conteúdo aparece normal.
- Comentários em pt-BR explicando o porquê; strings de UI no idioma do contexto.
- Teste ao lado do arquivo (`foo.tsx` + `foo.test.tsx`).
- Commits em conventional commits, descrição em pt-BR, terminando com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Trabalhar no worktree `../vitorpereira.ia.br-motion`, branch `feat/motion-foundation` a partir de `origin/main` atualizado. Nunca `git checkout` na pasta principal.

## Review Focus

1. **Hidratação falhou depois de o script inline marcar `.js`** → conteúdo com `data-reveal` ficaria invisível para sempre. Esperado: failsafe tira `.js` em 4s se nenhum `Reveal` montou. Teste na Task 1 (script) e Task 2 (Reveal marca `data-motion="ready"`).
2. **Usuário chega por âncora (`/#casos`) ou recarrega no meio da página** → seções já visíveis no viewport devem aparecer, não ficar ocultas. O IntersectionObserver dispara `isIntersecting` no primeiro callback para o que já está na tela. Teste na Task 2.
3. **Navegador sem `IntersectionObserver`** (antigo/crawler) → revela de imediato. Teste na Task 2.
4. **Leitor de tela / SEO no `CountUp`** → o valor final (`3,6M+`) está no HTML do servidor e no nó `sr-only`; o nó animado é `aria-hidden`. Teste na Task 3.
5. **Valor não-numérico no `CountUp`** (ex.: `"N/A"`) → renderiza o texto como está e não anima, sem lançar. Teste na Task 3.

---

## File Structure

| Arquivo | Responsabilidade |
|---|---|
| `app/globals.css` (modify) | tokens `--ease-out`, `--dur-*`; regras `[data-reveal]`; `.card-interactive`; keyframe `draw`; bloco reduced-motion |
| `components/motion/motionBoot.ts` (create) | string do script inline (`.js` + failsafe) — testável fora do layout |
| `app/layout.tsx` (modify) | injeta o script no `<head>` |
| `components/motion/reducedMotion.ts` (create) | `prefersReducedMotion()` com guarda de SSR |
| `components/motion/testUtils.ts` (create) | mocks de IntersectionObserver e matchMedia para os testes |
| `components/motion/Reveal.tsx` (create) | revela filhos ao entrar na tela |
| `components/motion/countUp.ts` (create) | `parseStat` / `formatStat` puros |
| `components/motion/CountUp.tsx` (create) | anima número ao entrar na tela |
| `features/marketing/components/Proof.tsx` (modify) | primeiro consumidor: `CountUp` + `Reveal` |

---

### Task 0: Worktree e dependências

- [ ] **Step 1: Criar worktree**

```bash
cd /Users/vop12/projects/vitorpereira.ia.br
git fetch -q
git worktree add -b feat/motion-foundation ../vitorpereira.ia.br-motion origin/main
cd ../vitorpereira.ia.br-motion
git branch --show-current   # esperado: feat/motion-foundation
pnpm install
pnpm test                    # baseline verde antes de mexer
```

Expected: suíte verde. Se não estiver verde na `origin/main`, pare e reporte.

---

### Task 1: Tokens CSS, script de boot e reduced-motion

**Files:**
- Create: `components/motion/motionBoot.ts`, `components/motion/motionBoot.test.ts`, `components/motion/reducedMotion.ts`
- Modify: `app/globals.css` (fim do arquivo), `app/layout.tsx`

**Interfaces:**
- Produces: `MOTION_BOOT_SCRIPT: string`; `prefersReducedMotion(): boolean`; atributos CSS `data-reveal="fade-up"|"fade"`, `data-revealed`, `--reveal-delay`; classe `.card-interactive`; keyframe `draw`; `<html data-motion="ready">` marcado por `Reveal`.

- [ ] **Step 1: Teste do script de boot**

`components/motion/motionBoot.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { MOTION_BOOT_SCRIPT } from "./motionBoot";

function runBoot() {
  // eslint-disable-next-line no-new-func
  new Function(MOTION_BOOT_SCRIPT)();
}

describe("MOTION_BOOT_SCRIPT", () => {
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.className = "";
    delete document.documentElement.dataset.motion;
  });

  it("marca <html> com .js antes da pintura", () => {
    runBoot();
    expect(document.documentElement.classList.contains("js")).toBe(true);
  });

  it("remove .js se nenhum Reveal montou em 4s (hidratação falhou)", () => {
    vi.useFakeTimers();
    runBoot();
    vi.advanceTimersByTime(4000);
    expect(document.documentElement.classList.contains("js")).toBe(false);
  });

  it("mantém .js quando o Reveal sinalizou que está pronto", () => {
    vi.useFakeTimers();
    runBoot();
    document.documentElement.dataset.motion = "ready";
    vi.advanceTimersByTime(4000);
    expect(document.documentElement.classList.contains("js")).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run components/motion/motionBoot.test.ts`
Expected: FAIL — `Cannot find module './motionBoot'`.

- [ ] **Step 3: Implementar `motionBoot.ts` e `reducedMotion.ts`**

`components/motion/motionBoot.ts`:

```ts
// Roda inline no <head>, antes da pintura. O estado "oculto até revelar" só
// existe sob .js — sem JS o conteúdo aparece normal. Se a hidratação quebrar
// depois de marcar .js, nenhum Reveal sinaliza "ready" e o failsafe devolve o
// conteúdo em 4s, em vez de deixar a página em branco.
export const MOTION_BOOT_SCRIPT = `(function(){var d=document.documentElement;d.classList.add("js");setTimeout(function(){if(d.dataset.motion!=="ready")d.classList.remove("js")},4000)})();`;
```

`components/motion/reducedMotion.ts`:

```ts
// Guarda de SSR: no servidor não há preferência, e o HTML do servidor já sai
// com o estado final visível.
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run components/motion/motionBoot.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Injetar no layout**

Em `app/layout.tsx`, adicionar o import e um `<head>` antes do `<body>`:

```tsx
import { MOTION_BOOT_SCRIPT } from "@/components/motion/motionBoot";
```

```tsx
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />
      </head>
      <body
```

(`suppressHydrationWarning` já existe no `<html>` e cobre a classe adicionada antes da hidratação.)

- [ ] **Step 6: CSS — acrescentar ao fim de `app/globals.css`**

```css
/* ── Motion ────────────────────────────────────────────────────────────── */
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 150ms;
  --dur-base: 300ms;
  --dur-slow: 600ms;
}

@layer components {
  [data-reveal] {
    transition:
      opacity var(--dur-slow) var(--ease-out),
      transform var(--dur-slow) var(--ease-out);
    transition-delay: var(--reveal-delay, 0ms);
  }
  /* Oculto só com JS: sem JS (ou com o failsafe acionado) nada some. */
  .js [data-reveal]:not([data-revealed]) {
    opacity: 0;
    transform: translateY(12px);
  }
  .js [data-reveal="fade"]:not([data-revealed]) {
    transform: none;
  }

  .card-interactive {
    transition:
      transform var(--dur-base) var(--ease-out),
      border-color var(--dur-base) var(--ease-out),
      box-shadow var(--dur-base) var(--ease-out);
  }
  .card-interactive:hover,
  .card-interactive:focus-visible,
  .card-interactive:focus-within {
    transform: translateY(-2px);
    border-color: color-mix(in oklab, var(--brand) 45%, var(--border));
    box-shadow: 0 8px 24px -12px color-mix(in oklab, var(--brand) 35%, transparent);
  }
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  .js [data-reveal]:not([data-revealed]) {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .card-interactive,
  .card-interactive:hover,
  .card-interactive:focus-visible,
  .card-interactive:focus-within {
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 7: Verificar e commitar**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: tudo verde.

```bash
git add app/globals.css app/layout.tsx components/motion/motionBoot.ts components/motion/motionBoot.test.ts components/motion/reducedMotion.ts
git commit -m "feat(motion): tokens, boot script e base de reduced-motion

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: `Reveal`

**Files:**
- Create: `components/motion/testUtils.ts`, `components/motion/Reveal.tsx`, `components/motion/Reveal.test.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion()` (Task 1), CSS `[data-reveal]` (Task 1).
- Produces:
  ```ts
  type RevealProps = {
    children: React.ReactNode;
    as?: "div" | "section" | "li" | "article" | "span";
    delay?: number;              // ms, vira --reveal-delay
    variant?: "fade-up" | "fade";
    className?: string;
  };
  export function Reveal(props: RevealProps): JSX.Element;
  ```
  Test utils: `mockIntersectionObserver(): { trigger(isIntersecting?: boolean): void; restore(): void }` e `mockMatchMedia(reduce: boolean): () => void`.

- [ ] **Step 1: Test utils**

`components/motion/testUtils.ts`:

```ts
// Mocks de teste: jsdom não implementa IntersectionObserver nem matchMedia.
type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

export function mockIntersectionObserver() {
  const original = globalThis.IntersectionObserver;
  const instances: { cb: Callback; disconnected: boolean }[] = [];
  class FakeIO {
    private self: { cb: Callback; disconnected: boolean };
    constructor(cb: Callback) {
      this.self = { cb, disconnected: false };
      instances.push(this.self);
    }
    observe() {}
    unobserve() {}
    disconnect() {
      this.self.disconnected = true;
    }
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
  return {
    trigger(isIntersecting = true) {
      for (const i of instances) if (!i.disconnected) i.cb([{ isIntersecting }]);
    },
    instances,
    restore() {
      globalThis.IntersectionObserver = original;
    },
  };
}

export function mockMatchMedia(reduce: boolean) {
  const original = window.matchMedia;
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  return () => {
    window.matchMedia = original;
  };
}
```

- [ ] **Step 2: Teste do Reveal**

`components/motion/Reveal.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Reveal } from "./Reveal";
import { mockIntersectionObserver, mockMatchMedia } from "./testUtils";

describe("Reveal", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;

  beforeEach(() => {
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
    delete document.documentElement.dataset.motion;
  });
  afterEach(() => {
    io.restore();
    restoreMM();
  });

  it("renderiza os filhos no HTML desde o início", () => {
    render(<Reveal>conteúdo</Reveal>);
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("começa sem data-revealed e revela ao entrar na tela", () => {
    render(<Reveal>x</Reveal>);
    const el = screen.getByText("x");
    expect(el).toHaveAttribute("data-reveal", "fade-up");
    expect(el).not.toHaveAttribute("data-revealed");
    io.trigger(true);
    expect(el).toHaveAttribute("data-revealed");
  });

  it("revela quem já está na tela no primeiro callback (chegada por âncora)", () => {
    render(<Reveal>âncora</Reveal>);
    io.trigger(true);
    expect(screen.getByText("âncora")).toHaveAttribute("data-revealed");
  });

  it("não revela enquanto não intersecta e desconecta depois de revelar", () => {
    render(<Reveal>y</Reveal>);
    io.trigger(false);
    expect(screen.getByText("y")).not.toHaveAttribute("data-revealed");
    io.trigger(true);
    expect(io.instances[0].disconnected).toBe(true);
  });

  it("com reduced-motion revela de imediato", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    render(<Reveal>z</Reveal>);
    expect(screen.getByText("z")).toHaveAttribute("data-revealed");
  });

  it("sem IntersectionObserver revela de imediato", () => {
    io.restore();
    const original = globalThis.IntersectionObserver;
    // @ts-expect-error simulando navegador antigo
    delete globalThis.IntersectionObserver;
    render(<Reveal>w</Reveal>);
    expect(screen.getByText("w")).toHaveAttribute("data-revealed");
    globalThis.IntersectionObserver = original;
  });

  it("sinaliza ao boot script que a hidratação aconteceu", () => {
    render(<Reveal>k</Reveal>);
    expect(document.documentElement.dataset.motion).toBe("ready");
  });

  it("aplica delay como --reveal-delay e respeita as/variant", () => {
    render(
      <Reveal as="li" delay={120} variant="fade">
        d
      </Reveal>,
    );
    const el = screen.getByText("d");
    expect(el.tagName).toBe("LI");
    expect(el).toHaveAttribute("data-reveal", "fade");
    expect(el.style.getPropertyValue("--reveal-delay")).toBe("120ms");
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `pnpm vitest run components/motion/Reveal.test.tsx`
Expected: FAIL — `Cannot find module './Reveal'`.

- [ ] **Step 4: Implementar**

`components/motion/Reveal.tsx`:

```tsx
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
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
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
```

- [ ] **Step 5: Rodar e ver passar**

Run: `pnpm vitest run components/motion/Reveal.test.tsx`
Expected: 8 passed.

- [ ] **Step 6: Lint/typecheck e commit**

Run: `pnpm lint && pnpm typecheck`
Expected: verde. Se a regra `react-hooks/refs` ou similar reclamar do `ref as never`, troque por `ref={ref as React.RefObject<HTMLDivElement>}` — o cast existe porque `Tag` é união de tags.

```bash
git add components/motion/testUtils.ts components/motion/Reveal.tsx components/motion/Reveal.test.tsx
git commit -m "feat(motion): componente Reveal com IntersectionObserver

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `parseStat`/`formatStat` + `CountUp`

**Files:**
- Create: `components/motion/countUp.ts`, `components/motion/countUp.test.ts`, `components/motion/CountUp.tsx`, `components/motion/CountUp.test.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion()`, `mockIntersectionObserver`, `mockMatchMedia`.
- Produces:
  ```ts
  type ParsedStat = { prefix: string; value: number; decimals: number; separator: "," | "."; suffix: string };
  export function parseStat(text: string): ParsedStat | null;
  export function formatStat(n: number, p: ParsedStat): string;
  export function CountUp(props: { value: string; durationMs?: number; className?: string }): JSX.Element;
  ```

- [ ] **Step 1: Teste das funções puras**

`components/motion/countUp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatStat, parseStat } from "./countUp";

describe("parseStat", () => {
  it.each([
    ["70+", { prefix: "", value: 70, decimals: 0, suffix: "+" }],
    ["~700", { prefix: "~", value: 700, decimals: 0, suffix: "" }],
    ["3,6M+", { prefix: "", value: 3.6, decimals: 1, suffix: "M+" }],
    ["~400", { prefix: "~", value: 400, decimals: 0, suffix: "" }],
    ["3.6M+", { prefix: "", value: 3.6, decimals: 1, suffix: "M+" }],
  ])("%s", (input, expected) => {
    expect(parseStat(input)).toMatchObject(expected);
  });

  it("devolve null para texto sem número", () => {
    expect(parseStat("N/A")).toBeNull();
  });
});

describe("formatStat", () => {
  it("o valor final reproduz o texto original", () => {
    for (const s of ["70+", "~700", "3,6M+", "~400", "3.6M+"]) {
      const p = parseStat(s)!;
      expect(formatStat(p.value, p)).toBe(s);
    }
  });

  it("valores intermediários usam o separador e as casas do original", () => {
    const p = parseStat("3,6M+")!;
    expect(formatStat(1.234, p)).toBe("1,2M+");
    expect(formatStat(0, p)).toBe("0,0M+");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run components/motion/countUp.test.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 3: Implementar `countUp.ts`**

```ts
export type ParsedStat = {
  prefix: string;
  value: number;
  decimals: number;
  separator: "," | ".";
  suffix: string;
};

// Aceita "70+", "~700", "3,6M+": prefixo não numérico, um número com no
// máximo um separador decimal, e o resto como sufixo.
const STAT = /^(\D*?)(\d+)(?:([.,])(\d+))?(.*)$/;

export function parseStat(text: string): ParsedStat | null {
  const m = STAT.exec(text);
  if (!m) return null;
  const [, prefix, int, sep, frac, suffix] = m;
  const decimals = frac ? frac.length : 0;
  return {
    prefix: prefix ?? "",
    value: Number(`${int}${frac ? `.${frac}` : ""}`),
    decimals,
    separator: sep === "." ? "." : ",",
    suffix: suffix ?? "",
  };
}

export function formatStat(n: number, p: ParsedStat): string {
  const fixed = n.toFixed(p.decimals);
  const body = p.decimals ? fixed.replace(".", p.separator) : fixed;
  return `${p.prefix}${body}${p.suffix}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run components/motion/countUp.test.ts`
Expected: todos passam.

- [ ] **Step 5: Teste do componente**

`components/motion/CountUp.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { CountUp } from "./CountUp";
import { mockIntersectionObserver, mockMatchMedia } from "./testUtils";

describe("CountUp", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;

  beforeEach(() => {
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
  });
  afterEach(() => {
    io.restore();
    restoreMM();
    vi.useRealTimers();
  });

  it("o HTML inicial já tem o valor final (SEO e sem JS)", () => {
    const { container } = render(<CountUp value="3,6M+" />);
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("3,6M+");
  });

  it("expõe o valor final para leitor de tela e esconde o animado", () => {
    const { container } = render(<CountUp value="70+" />);
    expect(container.querySelector(".sr-only")).toHaveTextContent("70+");
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });

  it("anima ao entrar na tela e termina exatamente no texto original", () => {
    vi.useFakeTimers();
    const { container } = render(<CountUp value="~700" durationMs={1000} />);
    const visual = container.querySelector("[aria-hidden]")!;
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(300));
    expect(visual.textContent).not.toBe("~700");
    act(() => vi.advanceTimersByTime(1500));
    expect(visual.textContent).toBe("~700");
  });

  it("com reduced-motion não anima", () => {
    restoreMM();
    restoreMM = mockMatchMedia(true);
    vi.useFakeTimers();
    const { container } = render(<CountUp value="~400" />);
    act(() => io.trigger(true));
    act(() => vi.advanceTimersByTime(50));
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("~400");
  });

  it("texto não numérico renderiza como está, sem lançar", () => {
    const { container } = render(<CountUp value="N/A" />);
    act(() => io.trigger(true));
    expect(container.querySelector("[aria-hidden]")).toHaveTextContent("N/A");
  });
});
```

Nota: o Vitest com `useFakeTimers()` também falsifica `requestAnimationFrame` e `performance.now()` (padrão `toFake` do Vitest 4). Se algum teste ficar parado no primeiro frame, use `vi.useFakeTimers({ toFake: ["setTimeout", "requestAnimationFrame", "performance"] })`.

- [ ] **Step 6: Rodar e ver falhar**

Run: `pnpm vitest run components/motion/CountUp.test.tsx`
Expected: FAIL — módulo não existe.

- [ ] **Step 7: Implementar `CountUp.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { formatStat, parseStat } from "./countUp";
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
```

- [ ] **Step 8: Rodar e ver passar**

Run: `pnpm vitest run components/motion/`
Expected: todos passam.

- [ ] **Step 9: Commit**

```bash
git add components/motion/countUp.ts components/motion/countUp.test.ts components/motion/CountUp.tsx components/motion/CountUp.test.tsx
git commit -m "feat(motion): CountUp com valor final no HTML do servidor

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Primeiro consumidor — `Proof`

**Files:**
- Modify: `features/marketing/components/Proof.tsx`
- Create: `features/marketing/components/Proof.test.tsx`

**Interfaces:**
- Consumes: `Reveal`, `CountUp`.

- [ ] **Step 1: Teste**

`features/marketing/components/Proof.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Proof } from "./Proof";
import { mockIntersectionObserver, mockMatchMedia } from "@/components/motion/testUtils";

describe("Proof", () => {
  let io: ReturnType<typeof mockIntersectionObserver>;
  let restoreMM: () => void;
  beforeEach(() => {
    io = mockIntersectionObserver();
    restoreMM = mockMatchMedia(false);
  });
  afterEach(() => {
    io.restore();
    restoreMM();
  });

  it("mantém os 4 números finais acessíveis em PT", () => {
    render(<Proof locale="pt" />);
    for (const v of ["70+", "~700", "3,6M+", "~400"]) {
      expect(screen.getAllByText(v).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("founders simultâneos", { selector: "span" })).toBeInTheDocument();
  });

  it("cada stat entra com Reveal escalonado", () => {
    const { container } = render(<Proof locale="en" />);
    const revealed = container.querySelectorAll("[data-reveal]");
    expect(revealed).toHaveLength(4);
    expect((revealed[3] as HTMLElement).style.getPropertyValue("--reveal-delay")).toBe("240ms");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `pnpm vitest run features/marketing/components/Proof.test.tsx`
Expected: o segundo teste falha (`toHaveLength(4)` recebe 0).

- [ ] **Step 3: Implementar**

Em `features/marketing/components/Proof.tsx`, importar e trocar o `<div key=...>` e o `<span>` do valor:

```tsx
import { CountUp } from "@/components/motion/CountUp";
import { Reveal } from "@/components/motion/Reveal";
```

```tsx
          {stats.map((stat, i) => (
            <Reveal key={stat.value + stat[lang].label} delay={i * 80}>
              <dt className="sr-only">{stat[lang].label}</dt>
              <dd>
                <CountUp
                  value={stat.value}
                  className="text-primary block font-mono text-4xl font-semibold tracking-tight tabular-nums"
                />
                <span className="mt-2 block font-sans text-sm font-semibold">
                  {stat[lang].label}
                </span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  {stat[lang].context}
                </span>
              </dd>
            </Reveal>
          ))}
```

`tabular-nums` evita que a largura do número "dance" durante a contagem.

- [ ] **Step 4: Rodar e ver passar**

Run: `pnpm vitest run features/marketing/components/Proof.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add features/marketing/components/Proof.tsx features/marketing/components/Proof.test.tsx
git commit -m "feat(home): números do Proof entram com contagem e reveal

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Verificação real e PR

- [ ] **Step 1: Suíte e build**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: tudo verde.

- [ ] **Step 2: Tela renderizada de verdade**

Subir `pnpm dev` e capturar via Chrome headless + CDP (`Emulation.setDeviceMetricsOverride`, nunca `--window-size` — ver memória `headless-chrome-viewport-gotcha`):

1. Home 1440×900, tema escuro: rolar até o Proof, screenshot no meio da contagem e depois do fim — números finais iguais aos de produção.
2. Home 375×812: idem; `document.documentElement.scrollWidth - innerWidth === 0`.
3. `Emulation.setEmulatedMedia` com `prefers-reduced-motion: reduce`: Proof aparece estático com os valores finais.
4. Com JS desabilitado (`Emulation.setScriptExecutionDisabled`): Proof visível com valores finais.
5. Navegar direto para `/#casos`: nada acima/abaixo fica invisível depois de rolar.

Olhar cada screenshot antes de seguir.

- [ ] **Step 3: Push e PR**

```bash
gh auth switch -u vitoropereira
git push -u origin feat/motion-foundation
gh pr create --base main --title "feat(motion): fundação de animação sóbria (Reveal, CountUp, hover)" --body "..."
```

Corpo do PR: resumo (componentes, tokens, reduced-motion, failsafe sem JS), referência à spec, e test plan com os 5 itens do Step 2 marcados.
