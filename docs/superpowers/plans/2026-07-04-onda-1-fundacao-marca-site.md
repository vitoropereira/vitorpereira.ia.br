# Onda 1 — Fundação de Marca + Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o tema cinza padrão do site pela identidade da marca (paleta elétrica, tipografia mono+sans, logo "o prompt" `>_`, favicon/OG, tagline/statement e home no novo sistema), terminando com o Vitor vendo o site rodando em `http://localhost:3003`.

**Architecture:** O rebrand acontece **remapeando o contrato de tokens do shadcn** no `app/globals.css` (dark + light) — assim todos os componentes existentes herdam a marca sem reescrita — mais uma fonte mono nova (`next/font`), um componente `Logo` (SVG inline, cursor animado), ícones via `ImageResponse`, e ajustes de copy no `siteConfig`/Hero/Header. Serif é aposentado.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4 (CSS-first `@theme`), shadcn/ui sobre `@base-ui/react`, next-themes, next-intl, next/font, Velite, Vitest + @testing-library/react.

## Global Constraints

- **Gerenciador de pacotes:** usar **`pnpm`** (o repo tem `pnpm-lock.yaml` + `pnpm-workspace.yaml`; README manda `pnpm dev`). ⚠️ O `.claude/CLAUDE.md` diz "use npm" — **contradição a confirmar com o Vitor**; até lá, o lockfile manda → pnpm.
- **Dev server:** `http://localhost:3003` (script `pnpm dev` = velite + next em paralelo).
- **Cor de marca (acento):** `#24C8FF` (ciano elétrico) + apoio `#3B82F6`. **NUNCA** o índigo `#4F46E5` da ClearSeg.
- **Tokens de cor:** escritos em **HEX** (fidelidade à paleta aprovada no painel; o arquivo original usa oklch, mas hex é válido em Tailwind v4 e evita erro de conversão manual).
- **Dark é o mundo primário**; light existe e deve ficar legível (contraste do ciano em branco exige tom mais fundo `#0C88C7` pra texto/link).
- **Tipografia:** headings de conteúdo = Inter (`font-heading`→sans); mono (JetBrains Mono) = hero, rótulos, wordmark, code. **Sem serif.**
- **Anti-marca:** sem clichê de IA, sem emoji-spam, sem gradiente arco-íris, um único acento.
- **Verificação (regra deste plano):** rebrand é visual — o gate primário de cada task é `pnpm typecheck` + `pnpm lint` + `pnpm build` verdes **e** conferência visual. Testes unitários entram só onde agregam (shape do `siteConfig`, render do `Logo`), não como snapshot de CSS.
- **Commits:** formato `<type>: <descrição>`, sem atribuição (desabilitada globalmente). Nome sempre "Vitor".
- **Branch:** trabalhar na `feat/rebrand-marca` (já criada).

---

## Phase A — Fundação de marca

### Task 1: Renderizar 5 variações do logo → Vitor escolhe (portão de design)

**Files:**
- Create: `scratchpad/logo-variacoes.html` (painel visual efêmero; publicado como Artifact)

**Interfaces:**
- Produces: **a variação escolhida** (1 de 5) que a Task 4 implementa como `components/brand/Logo.tsx`.

Esta é uma **iteração de design com portão humano**, não um ciclo TDD. Renderizar as 5 variações da Direção A ("o prompt") lado a lado, em dark, escala grande + tamanho favicon, e o Vitor escolhe vendo.

- [ ] **Step 1: Montar o painel das 5 variações**

Reaproveitar a estética do painel de marca (dark `#070B12`, mono, acento `#24C8FF`). Renderizar cada variação como SVG inline, em tamanho grande e em 28px (favicon), sobre tile escuro:
1. `>_` puro (chevron + cursor no tile)
2. `vp_` (mono, cursor final)
3. `v>_` (v + chevron + cursor)
4. tile `>_` + wordmark `vitor pereira` ao lado
5. wordmark com cursor final: `vitor pereira▮`

- [ ] **Step 2: Publicar como Artifact e apresentar ao Vitor**

Publicar via ferramenta Artifact e mandar o link. Perguntar: qual variação (ou combinação, ex.: "mark do #1 + wordmark do #5")? Two-tone (`vitor` claro / `pereira` muted) ou peso único?

- [ ] **Step 3: Registrar a escolha**

Anotar a decisão neste arquivo (editar o topo da Task 4 com a variação escolhida) antes de implementar. **Não prosseguir pra Task 4 sem a escolha.**

> Sem commit (arquivo de scratchpad, fora do repo). Portão: **decisão do Vitor registrada.**

---

### Task 2: Tokens da marca no `globals.css` (dark + light, contrato shadcn completo)

**Files:**
- Modify: `app/globals.css:56-118` (blocos `:root` e `.dark`) e `app/globals.css:5-52` (bloco `@theme inline` — adicionar tokens `--color-brand*`)

**Interfaces:**
- Produces: contrato de cor da marca consumido por TODOS os componentes shadcn + utilitários `bg-brand` / `text-brand` / `border-brand` / `ring-brand`.

- [ ] **Step 1: Adicionar os tokens de marca ao `@theme inline`**

No bloco `@theme inline` (após a linha `--color-primary: var(--primary);`, por volta da linha 42), adicionar:

```css
  --color-brand: var(--brand);
  --color-brand-2: var(--brand-2);
  --color-brand-foreground: var(--brand-foreground);
```

- [ ] **Step 2: Substituir o bloco `:root` (light) inteiro**

Trocar o bloco `:root { ... }` (linhas ~56-89) por:

```css
:root {
  --background: #FBFCFE;
  --foreground: #0B1220;
  --card: #FFFFFF;
  --card-foreground: #0B1220;
  --popover: #FFFFFF;
  --popover-foreground: #0B1220;
  --primary: #0C88C7;
  --primary-foreground: #FFFFFF;
  --secondary: #F1F5FA;
  --secondary-foreground: #0B1220;
  --muted: #F1F5FA;
  --muted-foreground: #566072;
  --accent: #EAF1F8;
  --accent-foreground: #0B1220;
  --destructive: #DC2626;
  --border: #E2E8F1;
  --input: #E2E8F1;
  --ring: #0C88C7;
  --brand: #24C8FF;
  --brand-2: #3B82F6;
  --brand-foreground: #04121B;
  --chart-1: #0C88C7;
  --chart-2: #3B82F6;
  --chart-3: #38BDF8;
  --chart-4: #60A5FA;
  --chart-5: #93C5FD;
  --radius: 0.625rem;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #0B1220;
  --sidebar-primary: #0C88C7;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #EAF1F8;
  --sidebar-accent-foreground: #0B1220;
  --sidebar-border: #E2E8F1;
  --sidebar-ring: #0C88C7;
}
```

- [ ] **Step 3: Substituir o bloco `.dark` inteiro**

Trocar o bloco `.dark { ... }` (linhas ~90-118) por:

```css
.dark {
  --background: #070B12;
  --foreground: #E9EEF7;
  --card: #0C121D;
  --card-foreground: #E9EEF7;
  --popover: #0C121D;
  --popover-foreground: #E9EEF7;
  --primary: #24C8FF;
  --primary-foreground: #04121B;
  --secondary: #111A28;
  --secondary-foreground: #E9EEF7;
  --muted: #111A28;
  --muted-foreground: #8593AB;
  --accent: #14202F;
  --accent-foreground: #E9EEF7;
  --destructive: #E5484D;
  --border: #1E2A3D;
  --input: #1E2A3D;
  --ring: #24C8FF;
  --brand: #24C8FF;
  --brand-2: #3B82F6;
  --brand-foreground: #04121B;
  --chart-1: #24C8FF;
  --chart-2: #38BDF8;
  --chart-3: #3B82F6;
  --chart-4: #60A5FA;
  --chart-5: #93C5FD;
  --sidebar: #0C121D;
  --sidebar-foreground: #E9EEF7;
  --sidebar-primary: #24C8FF;
  --sidebar-primary-foreground: #04121B;
  --sidebar-accent: #14202F;
  --sidebar-accent-foreground: #E9EEF7;
  --sidebar-border: #1E2A3D;
  --sidebar-ring: #24C8FF;
}
```

- [ ] **Step 4: Verificar build e visual**

Run: `pnpm typecheck && pnpm build`
Expected: PASS (sem erros de CSS/tokens).
Depois `pnpm dev` e abrir `http://localhost:3003` em dark e light — botões (primary) devem ficar ciano no dark, o fundo near-black, foco ciano.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(brand): remapeia tokens do shadcn pra paleta eletrica (dark+light)"
```

---

### Task 3: Fonte mono + aposentar serif (infra de tipografia)

**Files:**
- Modify: `app/layout.tsx:1-19,41` (imports de fonte + body className)
- Modify: `app/globals.css:11-13` (tokens de fonte no `@theme inline`) e `app/globals.css:135` (`.prose-post` serif→sans)
- Modify (sweep mecânico `font-serif` → `font-heading`): `features/marketing/components/Hero.tsx:7`, `Specialties.tsx:54`, `FeaturedProjects.tsx:12`, `LatestPosts.tsx:12,29`, `ContactCTA.tsx:10`, `components/layout/Header.tsx:17`, `features/blog/components/MdxPage.tsx:16`, `features/blog/components/PostCard.tsx:47`, `features/portfolio/components/ProjectCard.tsx:32`, `app/(site)/posts/page.tsx:34`, `app/(site)/contato/page.tsx:90`, `app/(site)/tags/[tag]/page.tsx:43`, `app/(site)/portfolio/page.tsx:21`, `app/(site)/[year]/[month]/[day]/[slug]/page.tsx:115`, e os espelhos EN: `app/(site)/en/posts/page.tsx:34`, `en/contact/page.tsx:90`, `en/tags/[tag]/page.tsx:43`, `en/portfolio/page.tsx:21`, `en/[year]/[month]/[day]/[slug]/page.tsx:117`

**Interfaces:**
- Produces: utilitário `font-mono` (JetBrains Mono) disponível; `font-heading`/`font-serif`-legacy resolvidos pra sans; nenhuma referência a serif restante.

- [ ] **Step 1: Trocar imports de fonte no `layout.tsx`**

Substituir as linhas 2 e 8-19 (imports `Inter, Source_Serif_4` e as duas declarações de fonte) por:

```tsx
import { Inter, JetBrains_Mono } from "next/font/google";
```
```tsx
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
```

- [ ] **Step 2: Atualizar o `body` className**

Linha ~41: trocar `${inter.variable} ${sourceSerif.variable}` por `${inter.variable} ${jetbrainsMono.variable}`:

```tsx
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
```

- [ ] **Step 3: Ajustar os tokens de fonte no `globals.css` (`@theme inline`)**

Linhas 11-13 — trocar por (remove serif, aponta mono pra fonte real, heading segue sans):

```css
  --font-serif: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-heading: var(--font-sans);
```

- [ ] **Step 4: `.prose-post` deixa de usar serif**

Linha 135 — trocar `@apply font-serif text-[17px] leading-relaxed;` por:

```css
    @apply font-sans text-[17px] leading-relaxed;
```

- [ ] **Step 5: Sweep `font-serif` → `font-heading`**

Em cada arquivo/linha listado em **Files**, substituir a classe `font-serif` por `font-heading`. (Mecânico; mesma posição, só a classe muda.) Exemplo em `Header.tsx:17`:

```tsx
        <Link href={r("home")} className="font-heading text-lg font-bold">
```

- [ ] **Step 6: Confirmar que não sobrou serif**

Run: `grep -rn "font-serif" app components features` (excluir `.next`)
Expected: nenhuma ocorrência (ou só o token de compat no globals).

- [ ] **Step 7: Verificar build**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. Abrir o site — títulos em Inter, corpo de post em Inter, nenhuma fonte serifada.

- [ ] **Step 8: Commit**

```bash
git add app/layout.tsx app/globals.css features components "app/(site)"
git commit -m "feat(brand): adiciona JetBrains Mono e aposenta serif (headings em sans)"
```

---

### Task 4: Componente `Logo` (marca "o prompt" com cursor animado)

> **Variação escolhida na Task 1:** _[preencher: ex. "tile >_ + wordmark vitor pereira▮ (two-tone)"]_. O código abaixo implementa a preferência provável (tile `>_` como `mark` + wordmark com cursor). Se o Vitor escolher outra, trocar **apenas** o `path`/glifo do `mark`; a estrutura, props e animação permanecem.

**Files:**
- Create: `components/brand/Logo.tsx`
- Create: `components/brand/Logo.test.tsx`
- Modify: `app/globals.css` (adicionar keyframe do cursor no fim do arquivo)

**Interfaces:**
- Produces: `export function Logo({ variant, className }: { variant?: "mark" | "wordmark"; className?: string })` — `variant` default `"wordmark"`. O `mark` usa `currentColor` no cursor/chevron pra herdar cor; o tile usa `--brand`. Consumido pelo `Header` (Task 7).

- [ ] **Step 1: Escrever o teste (render)**

```tsx
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renderiza o wordmark com o nome", () => {
    render(<Logo variant="wordmark" />);
    expect(screen.getByText("vitor")).toBeInTheDocument();
    expect(screen.getByText("pereira")).toBeInTheDocument();
  });

  it("renderiza o mark como SVG acessível", () => {
    render(<Logo variant="mark" />);
    expect(screen.getByRole("img", { name: /vitor pereira/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar o teste (deve falhar)**

Run: `pnpm vitest run components/brand/Logo.test.tsx`
Expected: FAIL ("Cannot find module './Logo'").

- [ ] **Step 3: Implementar `components/brand/Logo.tsx`**

```tsx
import { cn } from "@/lib/utils";

/**
 * Marca "o prompt" (Direção A). `mark` = tile >_ (favicon/avatar);
 * `wordmark` = "vitor pereira" mono + cursor elétrico (aplicações maiores).
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
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="Vitor Pereira"
        className={cn("h-8 w-8", className)}
      >
        <rect width="64" height="64" rx="15" className="fill-card" />
        <rect
          x="1"
          y="1"
          width="62"
          height="62"
          rx="14"
          fill="none"
          className="stroke-border"
        />
        <path
          d="M23 21 L35 32 L23 43"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="30" y="40.5" width="13" height="4.2" rx="1.4" fill="var(--brand)" />
      </svg>
    );
  }

  return (
    <span
      className={cn(
        "font-mono text-lg font-semibold tracking-tight lowercase",
        className,
      )}
    >
      <span className="text-foreground">vitor</span>
      <span className="text-muted-foreground">pereira</span>
      <span aria-hidden className="brand-cursor" />
    </span>
  );
}
```

- [ ] **Step 4: Adicionar o keyframe do cursor no fim do `globals.css`**

```css
@layer components {
  .brand-cursor {
    display: inline-block;
    width: 0.5ch;
    height: 1em;
    margin-left: 3px;
    transform: translateY(0.12em);
    border-radius: 1px;
    background: var(--brand);
    animation: brand-blink 1.15s steps(1) infinite;
  }
}
@keyframes brand-blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .brand-cursor {
    animation: none;
  }
}
```

- [ ] **Step 5: Rodar o teste (deve passar)**

Run: `pnpm vitest run components/brand/Logo.test.tsx`
Expected: PASS (2 testes).

- [ ] **Step 6: Verificar typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/brand/Logo.tsx components/brand/Logo.test.tsx app/globals.css
git commit -m "feat(brand): componente Logo (marca 'o prompt' com cursor animado)"
```

---

### Task 5: Favicon, app-icon, manifest e OpenGraph → marca

**Files:**
- Modify: `app/icon.tsx` (todo o JSX)
- Modify: `app/apple-icon.tsx` (todo o JSX)
- Modify: `app/manifest.ts:11-12` (background/theme color)
- Modify: `app/layout.tsx:26-28` (viewport `themeColor`)
- Modify: `app/opengraph-image.tsx` (JSX)

**Interfaces:**
- Consumes: paleta da Task 2 (`#070B12`, `#24C8FF`).

- [ ] **Step 1: Reescrever `app/icon.tsx` (prompt `>_`)**

Manter `size`/`contentType`; trocar o `return`:

```tsx
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070B12",
        }}
      >
        <svg width="340" height="340" viewBox="0 0 64 64">
          <path
            d="M23 21 L35 32 L23 43"
            fill="none"
            stroke="#24C8FF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="30" y="40" width="14" height="5" rx="1.6" fill="#24C8FF" />
        </svg>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 2: Reescrever `app/apple-icon.tsx`**

Mesma marca, tile arredondado (iOS arredonda de novo, mas o fundo fica ink):

```tsx
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#070B12",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path
            d="M23 21 L35 32 L23 43"
            fill="none"
            stroke="#24C8FF"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="30" y="40" width="14" height="5" rx="1.6" fill="#24C8FF" />
        </svg>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 3: Atualizar cores no `manifest.ts`**

Linhas 11-12: `background_color` e `theme_color` de `#0f172a` → `#070B12`.

- [ ] **Step 4: Atualizar `viewport.themeColor` no `layout.tsx`**

Linha ~27: `themeColor: "#0f172a"` → `themeColor: "#070B12"`.

- [ ] **Step 5: Reescrever `app/opengraph-image.tsx` (marca)**

Trocar o `return` (mantendo `runtime`/`size`/`contentType`; a descrição passa a usar `statement`, criado na Task 6 — se a Task 6 ainda não rodou, usar `siteConfig.tagline.pt` e ajustar depois):

```tsx
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "#070B12",
          color: "#E9EEF7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <path d="M23 21 L35 32 L23 43" fill="none" stroke="#24C8FF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="30" y="40" width="14" height="5" rx="1.6" fill="#24C8FF" />
          </svg>
          <div style={{ fontSize: 68, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ fontSize: 32, marginTop: 28, color: "#8593AB", maxWidth: 900 }}>
          {siteConfig.statement.pt}
        </div>
        <div style={{ width: 120, height: 8, marginTop: 40, background: "#24C8FF", borderRadius: 4 }} />
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 6: Verificar build e imagens**

Run: `pnpm build`
Expected: PASS. Abrir `http://localhost:3003/icon`, `/apple-icon`, `/opengraph-image` — devem renderizar a marca elétrica sobre ink.

- [ ] **Step 7: Commit**

```bash
git add app/icon.tsx app/apple-icon.tsx app/manifest.ts app/layout.tsx app/opengraph-image.tsx
git commit -m "feat(brand): favicon, app-icon, manifest e OG com a marca 'o prompt'"
```

---

## Phase B — Site (copy + home)

### Task 6: `siteConfig` — tagline curta + statement (PT/EN) e descrições apontando pro statement

**Files:**
- Modify: `lib/siteConfig.ts:6-9` (tagline + novo `statement`)
- Create: `lib/siteConfig.test.ts`
- Modify (descrição → statement): `app/(site)/page.tsx:12`, `app/(site)/en/page.tsx:12`, `app/manifest.ts:8`, `app/(site)/rss.xml/route.ts:48`, `app/(site)/en/rss.xml/route.ts:48`, `components/seo/JsonLd.tsx:56`

**Interfaces:**
- Produces: `siteConfig.tagline.{pt,en}` (curta) e `siteConfig.statement.{pt,en}` (completa). Consumidos por Hero (Task 8), OG (Task 5) e descrições.

- [ ] **Step 1: Escrever o teste do shape**

```ts
import { describe, it, expect } from "vitest";
import { siteConfig } from "./siteConfig";

describe("siteConfig", () => {
  it("tem tagline curta nos dois idiomas", () => {
    expect(siteConfig.tagline.pt).toBe("IA aplicada em sistemas reais.");
    expect(siteConfig.tagline.en).toBe("Applied AI in real systems.");
  });
  it("tem statement completo nos dois idiomas", () => {
    expect(siteConfig.statement.pt).toContain("Sem hype");
    expect(siteConfig.statement.en).toContain("No hype");
  });
});
```

- [ ] **Step 2: Rodar o teste (deve falhar)**

Run: `pnpm vitest run lib/siteConfig.test.ts`
Expected: FAIL (tagline atual é a antiga; `statement` não existe).

- [ ] **Step 3: Atualizar `lib/siteConfig.ts`**

Trocar o bloco `tagline` (linhas 6-9) por tagline curta + statement:

```ts
  tagline: {
    pt: "IA aplicada em sistemas reais.",
    en: "Applied AI in real systems.",
  },
  statement: {
    pt: "IA aplicada em sistemas reais. Sem hype, sem demo fake. Código, automação e produto funcionando de verdade — mostrados por quem constrói.",
    en: "Applied AI in real systems. No hype, no fake demos. Code, automation, and products that actually work — shown by the person who builds them.",
  },
```

- [ ] **Step 4: Rodar o teste (deve passar)**

Run: `pnpm vitest run lib/siteConfig.test.ts`
Expected: PASS.

- [ ] **Step 5: Apontar descrições longas pro `statement`**

Nos 6 arquivos listados, trocar `siteConfig.tagline.pt`/`.en` (quando usado como **descrição**) por `siteConfig.statement.pt`/`.en`. Ex. `app/(site)/page.tsx:12`:

```tsx
  description: siteConfig.statement.pt,
```
E `components/seo/JsonLd.tsx:56`:

```tsx
        data.locale === "pt" ? siteConfig.statement.pt : siteConfig.statement.en,
```

- [ ] **Step 6: Verificar**

Run: `pnpm typecheck && pnpm build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/siteConfig.ts lib/siteConfig.test.ts "app/(site)" app/manifest.ts components/seo/JsonLd.tsx
git commit -m "feat(brand): tagline curta + statement completo (PT/EN) no siteConfig"
```

---

### Task 7: Header usa o `Logo`

**Files:**
- Modify: `components/layout/Header.tsx:1-18`

**Interfaces:**
- Consumes: `Logo` (Task 4).

- [ ] **Step 1: Importar e usar o `Logo` no lugar do nome serifado**

Adicionar import `import { Logo } from "@/components/brand/Logo";` e trocar o `<Link>` da home (linhas ~16-18):

```tsx
        <Link href={r("home")} aria-label={siteConfig.name}>
          <Logo variant="wordmark" />
        </Link>
```

- [ ] **Step 2: Verificar**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. Abrir o site — header mostra `vitorpereira▮` em mono com cursor piscando; troca de tema mantém legível.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat(brand): Logo no header (wordmark com cursor)"
```

---

### Task 8: Hero no novo sistema (mono + statement + CTAs elétricos)

**Files:**
- Modify: `features/marketing/components/Hero.tsx` (todo o componente)

**Interfaces:**
- Consumes: `siteConfig.tagline` + `siteConfig.statement` (Task 6); tokens `text-brand`/`bg-primary` (Task 2); rotas de `institutionalRoutes`.

- [ ] **Step 1: Reescrever o `Hero.tsx`**

```tsx
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";
import { institutionalRoutes } from "@/lib/i18n/routeMap";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/config";

export function Hero({ locale }: { locale: Locale }) {
  const r = (key: keyof typeof institutionalRoutes) =>
    institutionalRoutes[key][locale as "pt" | "en"];
  const pitch =
    locale === "en"
      ? "No hype, no fake demos. Code, automation, and products that actually work — shown by the person who builds them."
      : "Sem hype, sem demo fake. Código, automação e produto funcionando de verdade — mostrados por quem constrói.";

  return (
    <section className="mx-auto max-w-5xl px-6 py-24 md:py-32">
      <p className="text-muted-foreground font-mono text-sm tracking-widest uppercase">
        vitor pereira
      </p>
      <h1 className="font-mono mt-6 text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
        IA aplicada em <span className="text-brand">sistemas reais</span>.
      </h1>
      <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
        {pitch}
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href={r("portfolio")}>
            {locale === "en" ? "See the projects" : "Ver os projetos"}
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={r("postsList")}>
            {locale === "en" ? "Read the blog" : "Ler o blog"}
          </Link>
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verificar `institutionalRoutes` tem `portfolio` e `postsList`**

Run: `grep -n "portfolio\|postsList" lib/i18n/routeMap.ts`
Expected: ambas existem (Header já as usa). Se o nome divergir, ajustar as chaves acima.

- [ ] **Step 3: Verificar build e visual**

Run: `pnpm typecheck && pnpm build`
Expected: PASS. Home mostra headline mono com "sistemas reais" em ciano, pitch, e dois CTAs (primary ciano + outline).

- [ ] **Step 4: Commit**

```bash
git add features/marketing/components/Hero.tsx
git commit -m "feat(brand): home hero no novo sistema (mono, statement, CTAs eletricos)"
```

---

### Task 9: Verificação final + portão do Vitor

**Files:** nenhum (verificação).

- [ ] **Step 1: Suite completa**

Run: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Expected: tudo PASS.

- [ ] **Step 2: Subir o dev e conferir manualmente**

Run: `pnpm dev` → abrir `http://localhost:3003`.
Checklist visual (dark **e** light, PT **e** `/en`):
- header com wordmark mono + cursor piscando (para de piscar com "reduzir movimento");
- home hero mono, "sistemas reais" em ciano, CTAs ciano/outline;
- aba do navegador com favicon `>_`;
- seções de marketing, blog e portfólio herdaram a cor da marca; nenhum resquício cinza/slate ou serifado;
- `/opengraph-image` com a marca.

- [ ] **Step 3: Portão do Vitor**

Apresentar o site rodando (screenshots ou pedir pra ele abrir `localhost:3003`). **Só depois da aprovação** abrir PR da `feat/rebrand-marca`. Ajustar o que ele apontar antes do PR.

- [ ] **Step 4 (após aprovação): PR**

```bash
git push -u origin feat/rebrand-marca
```
Abrir PR com resumo das mudanças e checklist de teste.

---

## Self-Review (feito)

- **Cobertura do spec:** §3.2 paleta → Task 2 · §3.3 tipografia → Task 3 · §3.1 logo → Tasks 1+4 · favicon/OG (§5) → Task 5 · tagline/statement (§1.2, §5) → Task 6 · home/header (§5) → Tasks 7+8. Cores light-acessíveis (§3.2) cobertas no `:root`. Movimento contido + reduced-motion (§3.4) na Task 4.
- **Fora de escopo (proposital, Onda 1):** kits de YouTube/LinkedIn/Instagram (Ondas 2-4); reescrita do "sobre" builder-first (fast-follow); conversão hex→oklch (opcional).
- **Placeholders:** só o previsto na Task 4 (glifo do logo depende da escolha da Task 1 — decisão humana, com código default concreto).
- **Consistência de tipos:** `Logo({variant,className})`, `siteConfig.statement.{pt,en}` e `institutionalRoutes` usados igual entre tasks.
