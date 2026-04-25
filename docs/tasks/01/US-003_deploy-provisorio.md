# US-003: Deploy provisório passando aceite completo

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Task**: `docs/tasks/01/US-003_deploy-provisorio.md`
> **Status**: Pendente

## Description

Como Vitor, quero o site rodando em URL Vercel provisória (`*.vercel.app`) validado contra os 11 critérios de sucesso do spec §15, para ter confiança antes de migrar o DNS do domínio real.

## Acceptance Criteria

### Deploy (via PR → merge em `main`, sem CLI)

- [ ] Git integration GitHub↔Vercel conectada (Dashboard → Settings → Git)
- [ ] PR aberto em `main` (branch de deploy ou commit existente) — Vercel cria Preview deployment automaticamente
- [ ] PR merged em `main` → Vercel cria Production deployment no alias `https://vitorpereira-ia-br.vercel.app`
- [ ] Build na Vercel completa sem erros (logs: `pnpm install` → `pnpm build` = `velite build && next build`)
- [ ] URL production alias anotada: `https://vitorpereira-ia-br.vercel.app`

### Smoke test — 16 rotas (manual, em incognito)

- [ ] `/` (PT home) e `/en` (EN home)
- [ ] `/posts` e `/en/posts` (listings)
- [ ] `/2026/04/21/hello-world` e `/en/2026/04/21/hello-world` (post bilíngue)
- [ ] `/portfolio` e `/en/portfolio` (grid com filtros)
- [ ] `/sobre` e `/en/about`
- [ ] `/contato` e `/en/contact`
- [ ] `/privacidade` e `/en/privacy`
- [ ] `/termos` e `/en/terms`

### Interações

- [ ] Theme toggle (dark/light/system) persiste via `next-themes`
- [ ] Language toggle navega PT↔EN preservando a rota quando a tradução existe; desabilita com tooltip quando não existe
- [ ] Command palette (⌘K) abre e busca posts (fuzzy via fuse.js)

### Analytics + Consent

- [ ] Consent banner aparece na primeira visita (sem cookie `consent` prévio)
- [ ] Clicar **Recusar** → cookie `consent=rejected` (1 ano) → GA4 e Clarity **não** carregam (verificar Network tab por requests a `clarity.ms` e `googletagmanager.com` — devem estar ausentes)
- [ ] Clicar **Aceitar** → cookie `consent=accepted` (1 ano) → GA4 e Clarity carregam
- [ ] Vercel Analytics e Speed Insights sempre carregam (requests a `/_vercel/insights/*`)
- [ ] Footer "Gerenciar cookies" reabre o banner

### Comentários

- [ ] Giscus carrega no `hello-world` post (scroll até o fim)
- [ ] Post de teste → aparece no GitHub Discussions
- [ ] Deletar Discussion de teste após validar

### Drafts

- [ ] Listing `/posts` na URL prod (`VERCEL_ENV=production`): `hello-world` visível, `draft-only-example-post` **ausente**
- [ ] URL direta de draft em prod → 404
- [ ] Mesmo check em `/en/posts` (se houver draft EN)

### SEO sanity (no alias production `vitorpereira-ia-br.vercel.app`)

- [x] `https://vitorpereira-ia-br.vercel.app/robots.txt` → `Allow: /` (alias de production é `VERCEL_ENV=production`)
  - URLs efêmeras de Preview (`*-git-<branch>-*.vercel.app`) retornam `Disallow: /`.
- [x] `/sitemap.xml`, `/rss.xml` e `/en/rss.xml` respondem 200 com XML válido (RSS 2.0, hreflang `pt-BR/en/x-default`)
- [x] `og:image`, `twitter:image` e JSON-LD `image` presentes (fallback para `/opengraph-image` quando post não tem cover — fix em PR #4)

> **Validators externos deslocados para US-005.** Canonical/og/JSON-LD apontam para `https://vitorpereira.ia.br/...` (domínio real ainda hospedando o site PHP legacy via DNS atual). Rodar validators agora capturaria o site antigo, não o novo. US-005 já cobre re-validação pós-cutover.

### Lighthouse (mobile, incognito)

- [ ] `/` → Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90
- [ ] `/2026/04/21/hello-world` → Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90

### Regressões

- [ ] Nenhum 500 nos logs da Vercel no smoke
- [ ] Nenhum console error em `view-source:` ou DevTools ao visitar as 16 rotas

## Implementation Notes

### Fix loop esperado (PR → main, sem CLI)

Bugs encontrados durante o smoke viram PRs de fix em `main`. Regra do PRD: **deploy = PR merged**. Pattern:

```bash
# exemplo: OG image quebrada em prod
git checkout -b fix/og-image-prod
# edit arquivo
git add -A && git commit -m "fix(og): handle missing cover image in production"
git push -u origin fix/og-image-prod
gh pr create --fill --base main
gh pr checks --watch          # aguarda Vercel Preview build passar
gh pr merge --squash --delete-branch
# Vercel auto-deploya Production a partir do merge em main; re-run smoke no alias
```

**Não commitar direto em `main`** — mesmo sendo projeto solo, esta PRD padroniza PR para ter trilha de auditoria e gate via CI/Preview. Cada fix → PR → merge → novo deploy Production → re-validar item específico.

### Código de referência — robots.ts

Controla o que valida ou não em URLs provisórias:

```typescript
// app/robots.ts
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  (process.env.VERCEL_ENV === undefined &&
    process.env.NODE_ENV === "production");

if (!isProduction) {
  return { rules: [{ userAgent: "*", disallow: "/" }], ... };
}
```

URL `*.vercel.app` alias do production aceita validadores externos; preview URLs de PR são Disallowed.

### Dependências

- Depends on: US-002 (Vercel linkado + env vars)
- Blocks: US-004 (DNS cutover exige aceite completo)

## Testing

- [ ] Manual: 16 rotas smoke-tested em incognito (HTTP 200 já validado via curl no automated pass)
- [ ] Manual: Lighthouse 2 páginas em mobile preset
- [ ] Manual: Consent flow Aceita/Recusa/Reabrir
- [ ] Manual: Theme toggle, language toggle, ⌘K
- [ ] Manual: Giscus scroll + comentário teste PT/EN

> Validators externos (Google Rich Results, Twitter Card, W3C Feed, Schema.org) → **US-005** (pós-cutover).

## Deploy log

- **Production alias**: `https://vitorpereira-ia-br.vercel.app`
- **Commit production deploy**: `8a20799` — PR [#3](https://github.com/vitoropereira/vitorpereira.ia.br/pull/3) `deploy: go-live provisional (US-003)`
- **Fix follow-up**: PR [#4](https://github.com/vitoropereira/vitorpereira.ia.br/pull/4) `fix(seo): fallback og:image to /opengraph-image when post has no cover` (commit `878a662`)
- **Automated checks pass** (curl + HTML inspection):
  - 16 rotas → 200
  - drafts → 404; ausentes do listing
  - sitemap/rss → XML válido
  - canonical, hreflang, JSON-LD (Person, WebSite, BlogPosting), og:image, twitter:image presentes
  - GA + Clarity NÃO carregam pré-consent (correto)
  - `/_vercel/insights/script.js` → 200
- **Lighthouse mobile** (a preencher após Vitor rodar):
  - `/` — Perf: __ / SEO: __ / A11y: __
  - `/2026/04/21/hello-world` — Perf: __ / SEO: __ / A11y: __
- **Issues conhecidos remanescentes**: nenhum bloqueador para US-004; validators externos pulados conforme nota acima.
