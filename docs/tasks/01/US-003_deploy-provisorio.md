# US-003: Deploy provisório passando aceite completo

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Task**: `docs/tasks/01/US-003_deploy-provisorio.md`
> **Status**: Pendente

## Description

Como Vitor, quero o site rodando em URL Vercel provisória (`*.vercel.app`) validado contra os 11 critérios de sucesso do spec §15, para ter confiança antes de migrar o DNS do domínio real.

## Acceptance Criteria

### Deploy

- [ ] `vercel --prod` executado a partir da raiz do repo
- [ ] Build na Vercel completa sem erros (logs: `pnpm install` → `pnpm build` = `velite build && next build`)
- [ ] URL provisória anotada (formato: `https://vitorpereira-ia-br-<hash>.vercel.app` ou alias `https://vitorpereira-ia-br.vercel.app`)

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

### SEO validators (URL provisória)

- [ ] `https://<provisional-url>/robots.txt` → `Disallow: /` (previews bloqueadas — cuidado aqui: se a URL for preview scope, robots.txt bloqueia)
  - **NOTA**: se `vercel --prod` gerar URL de scope production (`*.vercel.app` alias), robots.txt retorna `Allow: /`. Se for preview, `Disallow: /`. Depende do scope — conferir `VERCEL_ENV` nos logs.
- [ ] `/sitemap.xml` e `/en/rss.xml` respondem 200 com XML válido
- [ ] Google Rich Results Test (https://search.google.com/test/rich-results) em URL de post → `BlogPosting` reconhecido
- [ ] Twitter Card Validator (https://cards-dev.twitter.com/validator) em URL de post → `summary_large_image` preview renderiza
- [ ] W3C Feed Validator (https://validator.w3.org/feed/) em `/rss.xml` → RSS 2.0 valid sem warnings críticos
- [ ] Schema.org validator (https://validator.schema.org) em URL de post → estrutura JSON-LD OK

### Lighthouse (mobile, incognito)

- [ ] `/` → Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90
- [ ] `/2026/04/21/hello-world` → Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90

### Regressões

- [ ] Nenhum 500 nos logs da Vercel no smoke
- [ ] Nenhum console error em `view-source:` ou DevTools ao visitar as 16 rotas

## Implementation Notes

### Fix loop esperado

Bugs encontrados durante o smoke viram commits de fix. Pattern:

```bash
# exemplo: OG image quebrada em prod
git checkout -b fix/og-image-prod
# edit arquivo
git commit -m "fix(og): handle missing cover image in production"
git push origin fix/og-image-prod  # ou merge direto em main
# Vercel auto-deploya; re-run smoke
```

Alternativamente, commits diretos em `main` (projeto solo, tolerável). Cada fix → novo build Vercel → re-validar item específico.

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

- [ ] Manual: 16 rotas smoke-tested em incognito
- [ ] Manual: Lighthouse 2 páginas em mobile preset
- [ ] Manual: 4 validators externos (Google, Twitter, W3C, Schema.org)
- [ ] Manual: Consent flow Aceita/Recusa/Reabrir
