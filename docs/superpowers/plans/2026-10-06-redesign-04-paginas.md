# Redesign ④ — Páginas internas, header e footer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o mesmo nível da home para post, blog, serviço, portfólio, sobre, contato, header e footer — com leitura confortável, navegação mobile e consistência visual.

**Architecture:** Reaproveita `Reveal`/`.card-interactive` (PR ①), `HowItWorks`/`Faq` e `coverOf` (PR ②). Componentes client novos só onde há estado de navegador: barra de leitura, botão copiar, header (rolagem/rota ativa/menu mobile). Conteúdo das páginas MDX não muda — a linha do tempo do "Sobre" é estilo sobre a lista existente.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, `@base-ui/react` (Sheet em `components/ui/sheet.tsx`), next-intl, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-05-site-redesign-design.md` (§7)

**Depende de:** PR ② mergeado (usa `HowItWorks`, `Faq`, `features/blog/lib/cover.ts`).

## Global Constraints

- Não mexer: consent/analytics, rotas e `routeMap`, conteúdo dos posts, embed do Cal.com, Giscus.
- "Sobre" usa só o conteúdo atual de `content/pages/sobre(.en).mdx` — nenhum fato novo.
- Coluna de leitura do post em `max-w-[70ch]`.
- Contraste WCAG AA nos dois temas; `:focus-visible` em todo interativo; zero rolagem horizontal em 375px.
- Nunca envolver o LCP (capa do post, h1) em `Reveal`.
- `prefers-reduced-motion` respeitado em tudo que anima.
- Strings de UI novas nos dois idiomas; quando o componente é client e já existe namespace em next-intl, use-o; senão, objeto `copy` local por `locale`.
- Comentários em pt-BR explicando o porquê. Teste ao lado. Vitest em primeiro plano com `</dev/null`.
- Commits conventional pt-BR com `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Worktree `../vitorpereira.ia.br-paginas`, branch `feat/paginas-internas`, de `origin/main` **depois** do merge do PR ②.

## Review Focus

1. **Menu mobile** → abre, fecha com Esc, fecha ao navegar, foco preso dentro enquanto aberto, links com rota ativa marcada. Teste na Task 7.
2. **Post sem headings** → TOC não renderiza e a coluna não fica com buraco lateral. Teste na Task 1.
3. **Botão copiar sem permissão de clipboard** (http, iframe) → não lança; mostra estado de erro discreto. Teste na Task 2.
4. **Blog página 2+** → sem card em destaque (destaque só na página 1); paginação intacta. Teste na Task 4.
5. **Projeto sem print no grid** → placeholder com a mesma proporção, alturas alinhadas. Teste na Task 6.

---

### Task 0: Worktree

```bash
cd /Users/vop12/projects/vitorpereira.ia.br && git fetch -q
git worktree add -b feat/paginas-internas ../vitorpereira.ia.br-paginas origin/main
cd ../vitorpereira.ia.br-paginas && pnpm install --frozen-lockfile && pnpm exec velite build && pnpm exec vitest run </dev/null
```

---

### Task 1: Página do post — coluna de leitura, barra de progresso, TOC

**Files:**
- Create: `features/blog/components/ReadingProgress.tsx`, `ReadingProgress.test.tsx`
- Modify: `app/(site)/[year]/[month]/[day]/[slug]/page.tsx`, `app/(site)/en/[year]/[month]/[day]/[slug]/page.tsx`, `features/blog/components/PostToc.tsx`, `features/blog/components/PostToc.test.tsx` (create se não existir)

**Interfaces:** `export function ReadingProgress(): JSX.Element` (client; `role="progressbar"`, `aria-label` PT/EN via prop `locale`, `aria-valuenow` 0–100).

- [ ] **Teste `ReadingProgress`**: renderiza `progressbar` com `aria-valuenow="0"`; após simular `scrollY` = metade de `(scrollHeight - innerHeight)` e disparar `scroll`, `aria-valuenow` ≈ 50 (aceitar ±1). Usar `Object.defineProperty(document.documentElement, "scrollHeight", …)` e `window.innerHeight`.
- [ ] **Implementar**: barra fixa `fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary`, escala por `transform: scaleX(p)` (só transform), atualizada em `requestAnimationFrame` a partir de `scroll`/`resize` passivos. `aria-valuenow` atualizado junto. Listener removido no unmount.
- [ ] **Layout do post (PT e EN)**: container `mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_220px]`. Capa e header em `max-w-4xl`; corpo (`PostBody`), relacionados e comentários em `mx-auto max-w-[70ch]`. Trocar o cast manual de `cover` por `coverOf(post)` (`@/features/blog/lib/cover`). Inserir `<ReadingProgress locale=… />` no topo da página. Quando `toc.length === 0`, a grade vira uma coluna só (sem `aside`).
- [ ] **TOC**: item ativo com `text-primary` + `border-l-2 border-primary pl-3` (os demais `border-l-2 border-transparent pl-3`), `aria-current="location"` no ativo; título "Neste post"/"On this page" acima da lista (`aria-label` no `nav` usa o mesmo texto; PostToc recebe `locale`). Teste: renderiza com 2 itens, simula o IO (mock `testUtils`) marcando o segundo como intersectando e confere `aria-current` no segundo; com `items=[]` não renderiza nada.
- [ ] Commit `feat(blog): coluna de leitura, barra de progresso e TOC com item ativo`.

---

### Task 2: Botão copiar nos blocos de código

**Files:** Create `features/blog/mdx/CodeBlock.tsx`, `CodeBlock.test.tsx`; Modify `features/blog/mdx/MDXComponents.tsx`

**Interfaces:** `export function CodeBlock(props: React.ComponentProps<"pre">): JSX.Element` (client) — mapeado como `pre` em `mdxComponents`.

- [ ] **Teste**: renderiza `<CodeBlock><code>const a = 1;</code></CodeBlock>`; clicar no botão "Copiar código" chama `navigator.clipboard.writeText("const a = 1;")` (mock) e o rótulo vira "Copiado"; com `writeText` rejeitando, o rótulo vira "Não copiou" e nada lança; com `navigator.clipboard` indefinido, idem.
- [ ] **Implementar**: wrapper `relative group`, `<pre {...props} ref>` intacto (preserva atributos do rehype-pretty-code), botão `absolute top-2 right-2` com ícone `Copy`/`Check` (lucide), `opacity-0 group-hover:opacity-100 focus-visible:opacity-100` (sempre visível em touch: `[@media(hover:none)]:opacity-100`), `aria-label` dinâmico, volta ao estado inicial após 2s (timer limpo no unmount). Texto copiado = `pre.innerText` (sem números de linha: o rehype-pretty-code não injeta texto nos números). Idioma do rótulo: ler `document.documentElement.lang` (pt-BR/en) no clique — o componente MDX não recebe locale.
- [ ] Commit `feat(blog): botão copiar nos blocos de código`.

---

### Task 3: Relacionados em cards com capa + `PostCard` novo

**Files:** Modify `features/blog/components/PostCard.tsx`, `RelatedPosts.tsx`, `PostList.tsx`; Create `features/blog/components/PostCard.test.tsx` (se não existir)

**Interfaces:**
- `PostCard({ post, variant = "default" | "featured" })` — `default`: card vertical (capa `aspect-[16/9]` no topo, data · tempo de leitura, título, excerpt 2 linhas `line-clamp-2`, até 3 tags); `featured`: horizontal em `md+` (capa `md:w-3/5`), título maior. Fallback sem capa: bloco `aspect-[16/9] bg-gradient-to-br from-primary/15 to-transparent` com a primeira tag em mono. Card inteiro com `card-interactive`; link principal no título, capa também é link (`tabIndex={-1}`, `aria-hidden`) para não duplicar foco.
- `PostList({ posts, featuredFirst = false })` — grid `sm:grid-cols-2 lg:grid-cols-3 gap-6`; com `featuredFirst`, o primeiro vira `variant="featured"` ocupando `sm:col-span-2 lg:col-span-3`. Cada card em `<Reveal delay={(i % 3) * 80}>`.
- `RelatedPosts`: grid de 3 `PostCard` default (sem tags para não poluir).

- [ ] **Testes**: `PostCard` com capa renderiza `img` e link do título para o permalink; sem capa renderiza fallback sem `img`; `featured` aplica a classe de layout horizontal. `PostList` com `featuredFirst` marca só o primeiro como featured. (`PostCard` é async server component com `getLocale`/`getTranslations` — mockar `next-intl/server` como os testes existentes do repo fazem; se nenhum faz, converter `PostCard` para receber `locale` e `readingTimeLabel` por props a partir do `PostList`, que já é chamado em páginas server com acesso ao locale.)
- [ ] Commit `feat(blog): cards de post com capa e relacionados em grade`.

---

### Task 4: Lista do blog e tags

**Files:** Modify `app/(site)/posts/page.tsx`, `app/(site)/en/posts/page.tsx`, `app/(site)/tags/[tag]/page.tsx`, `app/(site)/en/tags/[tag]/page.tsx`; Create `features/blog/components/TagChips.tsx`, `TagChips.test.tsx`

- [ ] Cabeçalho do blog: h1 + subtítulo ("Agentes, automação e IA em produção — o que funciona, o que quebra e por quê." / "Agents, automation, and AI in production — what works, what breaks, and why.").
- [ ] `TagChips({ tags, locale, active? })`: linha rolável horizontalmente no mobile (`overflow-x-auto` no contêiner interno, sem estourar a página), chips `rounded-full border px-3 py-1 text-xs`, link para `/tags/<tag>` ou `/en/tags/<tag>` (`encodeURIComponent`), `aria-current="page"` no ativo. Tags ordenadas por frequência (contar via `getPostsByLocale`), no máximo 12 + link "todas" só se houver mais (YAGNI: se ≤ 12, sem link).
- [ ] `/posts`: `PostList featuredFirst={current === 1}`. Tags: `PostList` sem destaque + `TagChips active={tag}`.
- [ ] Teste `TagChips`: hrefs PT/EN corretos com tag acentuada (`segurança` → `/tags/seguran%C3%A7a`), `aria-current` no ativo. Teste da regra "destaque só na página 1": se a página for difícil de testar, extrair `shouldFeatureFirst(page: number)` e testar a função.
- [ ] Commit `feat(blog): lista em grade com destaque e chips de tag`.

---

### Task 5: Página do Agente Operacional

**Files:** Modify `features/marketing/components/OperationalAgentService.tsx`, `OperationalAgentService.test.tsx`; Create `features/marketing/components/MethodTimeline.tsx`, `MethodTimeline.test.tsx`

- [ ] `MethodTimeline({ locale })` com 4 etapas (copy derivado de `methodText` — nada novo):
  - PT: **Mapear** "o processo, a entrada, a saída e os limites" · **Avaliar** "critérios de resultado, trajeto, segurança e custo antes de construir" · **Implantar** "uma fatia pequena em produção, com dados reais" · **Operar** "acompanhar e só então ampliar a autonomia".
  - EN: **Map** "the workflow, its input, output, and boundaries" · **Evaluate** "criteria for outcome, path, security, and cost before building" · **Deploy** "one thin slice in production, with real data" · **Operate** "monitor it, and only then expand autonomy".
  Layout: `ol` horizontal em `md+` com conector (mesma técnica da linha do `HowItWorks`, classe `how-line`), vertical no mobile; cada etapa em `Reveal delay={i*100}`.
- [ ] Na página: a seção do método passa a usar `MethodTimeline` (remove a string `Map → Evaluate → Deploy → Operate` solta, mas mantém `methodText` como parágrafo acima). Inserir `<HowItWorks locale />` logo após o hero do serviço e `<Faq locale withJsonLd />` antes do CTA final. "Faz / não faz sentido": dois cards lado a lado — o de "faz" com `border-primary/40` e ícones `CheckCircle2 text-primary`, o de "não faz" com `bg-muted/40` e `XCircle text-muted-foreground`. Entregáveis em `Reveal` escalonado com `card-interactive`.
- [ ] Testes: os existentes continuam passando (ajustar seletor se a string do método mudar de nó); novo: a página tem 4 etapas do método em PT e EN, contém o FAQ (5 `details`) e o `HowItWorks` (5 passos).
- [ ] Commit `feat(servicos): linha do tempo do método, como funciona e FAQ na página do agente`.

---

### Task 6: Portfólio — placeholder sem print e entrada escalonada

**Files:** Modify `features/portfolio/components/ProjectCard.tsx`, `ProjectCard.test.tsx`, `ProjectGrid.tsx`

- [ ] Card sem `cover`: mesmo `data-browser-frame` com barra de 3 bolinhas + domínio (quando houver `url`) e, no lugar do print, bloco `aspect-[16/10] bg-gradient-to-br from-primary/15 via-transparent to-transparent` com o título do projeto em mono grande `text-muted-foreground/60` centralizado (decorativo, `aria-hidden`). Assim todo card tem a mesma estrutura e altura de mídia.
- [ ] `ProjectGrid`: cada card em `<Reveal delay={(i % 3) * 80}>`; `key` inclui o filtro ativo para os cards reentrarem ao trocar filtro? **Não** — reanimar a cada clique cansa; manter `key={p.id}`.
- [ ] Teste: sem cover, `[data-browser-frame]` existe, não há `img`, e o título aparece duas vezes (heading + decorativo `aria-hidden`); `getByRole("heading")` continua único.
- [ ] Commit `feat(portfolio): placeholder para projeto sem print e entrada escalonada`.

---

### Task 7: Header — rota ativa, rolagem e menu mobile

**Files:** Create `components/layout/NavLinks.tsx`, `NavLinks.test.tsx`, `components/layout/MobileNav.tsx`, `MobileNav.test.tsx`, `components/layout/ScrollAwareHeader.tsx`; Modify `components/layout/Header.tsx`

**Interfaces:**
- `NavLinks({ items, orientation?: "row" | "column", onNavigate?: () => void })` (client) — `items: { href: string; label: string }[]`; usa `usePathname()`; ativo quando `pathname === href || pathname.startsWith(href + "/")` (home nunca por prefixo); ativo recebe `aria-current="page"` e `text-foreground` + sublinhado `after:` em `--brand`.
- `MobileNav({ items, label })` (client) — `Sheet` lateral direita com `SheetTrigger` (ícone `Menu`, `aria-label` "Abrir menu"/"Open menu"), `NavLinks orientation="column" onNavigate={close}`, e os toggles de idioma/tema no rodapé do sheet.
- `ScrollAwareHeader({ children })` (client) — `<header>` que aplica `data-scrolled` quando `scrollY > 8` (listener passivo); CSS: sem borda e fundo transparente no topo, `border-b bg-background/80 backdrop-blur` quando `data-scrolled`.
- [ ] `Header` (server) monta `items` com `getTranslations("nav")` e `institutionalRoutes` (mesmos 4 links de hoje), renderiza `ScrollAwareHeader` > logo + `NavLinks` (`hidden md:flex`) + toggles (`hidden md:flex`) + `MobileNav` (`md:hidden`).
- [ ] Testes: `NavLinks` marca `aria-current` só no item da rota (mock `next/navigation` `usePathname`), inclusive em subrota (`/portfolio/x` não existe hoje, mas `/posts?page=2` → pathname `/posts`); home não fica ativa em `/posts`. `MobileNav`: clicar no trigger abre (links visíveis), `Escape` fecha, clicar num link chama `onNavigate` e fecha.
- [ ] Commit `feat(layout): header com rota ativa, estado de rolagem e menu mobile`.

---

### Task 8: Footer completo

**Files:** Modify `components/layout/Footer.tsx`; Create `components/layout/Footer.test.tsx`

- [ ] Duas faixas: (1) grade `md:grid-cols-[1.5fr_1fr_1fr]` com logo + tagline (`siteConfig.statement[locale]` se existir; senão "IA aplicada em sistemas reais." / "Applied AI in real systems."), coluna "Navegação" (Blog, Portfólio, Agente Operacional, Sobre, Contato via `institutionalRoutes`) e coluna "Contato" (Agendar diagnóstico → `bookingRoutes.diagnostic(locale)`, `SocialLinks`); (2) linha inferior com copyright, Privacidade, Termos e o botão "gerenciar cookies" **intocado** (mesmo `consent:reopen`).
- [ ] Teste: os 5 links de navegação com hrefs PT e EN; o botão de cookies dispara `consent:reopen` (spy em `window.dispatchEvent`).
- [ ] Commit `feat(layout): footer com navegação, contato e tagline`.

---

### Task 9: Sobre e contato

**Files:** Modify `features/blog/components/MdxPage.tsx`, `app/globals.css`, `app/(site)/contato/page.tsx`, `app/(site)/en/contact/page.tsx`

- [ ] **Linha do tempo do Sobre (só CSS sobre o conteúdo existente)**: `MdxPage` recebe prop opcional `variant?: "about"` e aplica a classe `prose-about` junto de `prose-post`. Em `globals.css`:
  - `.prose-about :is(h2#minha-jornada, h2#career-timeline) + ul` vira linha do tempo: `list-none pl-0 border-l-2 border-border ml-2`, cada `li` com `relative pl-6 my-5` e marcador `::before` (círculo 10px `bg-primary` com anel `ring-4 ring-background`) em `left:-6px; top:0.5em`.
  - `.prose-about :is(h2#destaques, h2#highlights) + ul` vira grade de cartões em `md+`: `grid md:grid-cols-2 gap-3 list-none pl-0`, cada `li` `rounded-lg border p-4 my-0`.
  - Confirmar os ids reais (rehype-slug) renderizando a página; ajustar seletor se diferente.
  - `sobre/page.tsx` e `en/about/page.tsx` passam `variant="about"`. Foto: `sm:w-72 md:w-80`, `rounded-2xl` e leve `ring-1 ring-border`.
- [ ] **Contato**: os cartões de canal ganham `card-interactive` (substitui `hover:border-primary hover:bg-accent transition`) e entram com `Reveal` escalonado; bloco de destaque do diagnóstico com `border-primary/40`.
- [ ] Teste (`MdxPage.test.tsx`, criar se não houver): com `variant="about"` o contêiner tem as classes `prose-post prose-about`.
- [ ] Commit `feat(sobre): linha do tempo e destaques em cartões; contato com cards interativos`.

---

### Task 10: Verificação real e PR

- [ ] `pnpm lint && pnpm typecheck && pnpm exec vitest run </dev/null && pnpm build`.
- [ ] `next start -p 3110` + CDP em 1440×900 e 375×812, temas escuro e claro, PT e EN: post (com e sem TOC; medir largura da coluna ≈ 70ch), `/posts` página 1 e 2, `/tags/agentes`, serviço, portfólio, sobre, contato, header rolado, menu mobile aberto (screenshot), footer.
- [ ] Reduced-motion e JS desabilitado: nada invisível; menu mobile sem JS mostra ao menos o link para o blog/contato no footer (aceitável).
- [ ] Contraste AA dos estados ativos/foco; overflow 0 em 375.
- [ ] Push + PR `feat: páginas internas, header e footer no padrão do redesign`, squash merge após CI verde.
