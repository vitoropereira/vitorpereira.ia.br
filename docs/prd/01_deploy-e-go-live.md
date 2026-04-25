# PRD 01: Deploy & Go-Live

> **PRD**: `docs/prd/01_deploy-e-go-live.md`
> **Tasks**: `docs/tasks/01/`
> **Spec de referência**: `docs/superpowers/specs/2026-04-21-vitorpereira-blog-portfolio-design.md` (§11 Deploy, §15 Critérios de sucesso)
> **Plano operacional**: `docs/superpowers/plans/2026-04-21-phase-07-deploy.md` (instruções passo-a-passo por task)
> **Data**: 2026-04-21

## 1. Introdução

Fechar a Phase 7 do rewrite — levar `vitorpereira.ia.br` do build local 100% verde para o domínio real em produção na Vercel, com Giscus funcional, analytics (Vercel + GA4 + Clarity gated por consent), SEO/Schema validados, Search Console configurado e monitoring de uptime. O repositório já está pushed em `github.com/vitoropereira/vitorpereira.ia.br`. Este PRD é um tracker de status; os passos detalhados estão no plano Phase 7 acima.

## 2. Goals

- Site no ar em `vitorpereira.ia.br` atendendo aos 11 critérios de sucesso do spec §15.
- Comentários por post funcionando via Giscus contra GitHub Discussions reais.
- Analytics LGPD-compliant: Vercel sempre on, GA4/Clarity só após aceite de cookies.
- SEO auditável em validators públicos (Google Rich Results, Twitter Cards, W3C Feed).
- Monitoramento básico: Search Console indexando, uptime monitor alertando.

## 3. User Stories

### US-001: Giscus configurado contra o repo real

**Descrição:** Como Vitor, quero que o widget de comentários Giscus carregue nos posts com `comments: true` e publique discussões no meu próprio GitHub, para ter um canal de feedback leitor-me-autor sem depender de plataforma de terceiros.

**Acceptance Criteria:**

- [ ] GitHub Discussions habilitado em `github.com/vitoropereira/vitorpereira.ia.br/settings` → General → Features
- [ ] Categoria `Comments` criada no Discussions, format `Announcement` (só maintainers postam topics; Giscus faz bypass para comentários)
- [ ] 4 IDs obtidos em https://giscus.app e salvos localmente em `.env.development.local` (gitignored): `NEXT_PUBLIC_GISCUS_REPO`, `_REPO_ID`, `_CATEGORY`, `_CATEGORY_ID`
- [ ] Smoke test local: `pnpm dev` → abrir `/2026/04/21/hello-world` → Giscus carrega → postar comentário de teste → aparece como Discussion na categoria `Comments`
- [ ] Comentário de teste pode ser deletado após validação (não polui o histórico público)

### US-002: Vercel bootstrap (link + env vars)

**Descrição:** Como Vitor, quero o projeto conectado na Vercel com todas as env vars de produção preenchidas, para que deploys automáticos funcionem em cada push na branch `main` e previews nas PRs.

**Acceptance Criteria:**

- [ ] Vercel CLI autenticado (`vercel login`)
- [ ] Projeto criado e linkado (`vercel link`) com preset Next.js, root `./`, nome `vitorpereira-ia-br`
- [ ] 7 env vars adicionadas em scope `production` via `vercel env add`:
  - `NEXT_PUBLIC_SITE_URL=https://vitorpereira.ia.br`
  - `NEXT_PUBLIC_GA_ID=<G-XXXXXXXXXX>`
  - `NEXT_PUBLIC_CLARITY_ID=<10-char>`
  - `NEXT_PUBLIC_GISCUS_REPO=vitoropereira/vitorpereira.ia.br`
  - `NEXT_PUBLIC_GISCUS_REPO_ID=<R_kgDO…>`
  - `NEXT_PUBLIC_GISCUS_CATEGORY=Comments`
  - `NEXT_PUBLIC_GISCUS_CATEGORY_ID=<DIC_kwDO…>`
- [ ] Mesmas 7 variáveis adicionadas em scope `preview` (com `NEXT_PUBLIC_SITE_URL=https://vitorpereira-ia-br.vercel.app`)
- [ ] `vercel env ls` lista tudo nos scopes corretos

### US-003: Deploy provisório passando aceite completo

**Descrição:** Como Vitor, quero o site rodando em URL Vercel provisória (`*.vercel.app`) validado contra os 11 critérios de sucesso do spec §15, para ter confiança antes de migrar o DNS do domínio real.

**Acceptance Criteria:**

- [ ] `vercel --prod` executou sem erros (build Vercel corre `pnpm install && pnpm build` = `velite build && next build`)
- [ ] URL provisória acessível; smoke test manual passa em todas as rotas: `/`, `/en`, `/posts`, `/en/posts`, `/2026/04/21/hello-world`, `/en/2026/04/21/hello-world`, `/portfolio`, `/en/portfolio`, `/sobre`, `/en/about`, `/contato`, `/en/contact`, `/privacidade`, `/en/privacy`, `/termos`, `/en/terms`
- [ ] Theme toggle + language toggle funcionam cross-locale
- [ ] Command palette (⌘K) abre e encontra posts
- [ ] Consent banner aparece primeira visita; após aceite, GA4 e Clarity carregam (verificar Network tab); Vercel Analytics sempre on
- [ ] Giscus carrega no `hello-world` post
- [ ] Drafts invisíveis (`draft-only-example-post` NÃO aparece; `hello-world` aparece)
- [ ] `/sitemap.xml`, `/rss.xml` e `/en/rss.xml` respondem 200 com XML válido
- [ ] Lighthouse mobile (incognito) em `/` e `/2026/04/21/hello-world`: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90
- [ ] `robots.txt` no alias production retorna `Allow: /`; preview URLs retornam `Disallow: /` (já implementado em `app/robots.ts` via `VERCEL_ENV === "production"`)

> **Nota:** Validators externos (Google Rich Results, Twitter Card, W3C Feed, Schema.org) **foram deslocados para US-005**. Razão: canonical, `og:image` e JSON-LD `image` apontam para `https://vitorpereira.ia.br/...` (domínio real, ainda hospedado pelo PHP legacy via DNS atual). Validators externos resolveriam essas URLs e pegariam o site antigo. Re-validar pós-cutover (US-004) onde já era ação prevista.

### US-004: DNS cutover para domínio real

**Descrição:** Como Vitor, quero o domínio `vitorpereira.ia.br` apontando para a Vercel em vez do servidor PHP antigo, para que o público acesse a nova versão Next.js. Esta é a única ação destrutiva/irreversível do PRD e requer minha aprovação explícita.

**Acceptance Criteria:**

- [ ] **Gate de segurança**: senha FTP do hosting PHP antigo rotacionada (spec §13 — `.vscode/sftp.json` está no histórico de `legacy-php`; mitigação tratada por rotação; git-filter-repo é opcional e coberto pelo PRD 02)
- [ ] Domínio `vitorpereira.ia.br` adicionado em Vercel Dashboard → Settings → Domains
- [ ] **Aprovação explícita do Vitor** registrada no chat antes de tocar DNS ("approved")
- [ ] Records DNS atualizados no registrar:
  - A record apex `vitorpereira.ia.br` → `76.76.21.21` (ou ANAME/ALIAS → `cname.vercel-dns.com` se o registrar suportar)
  - CNAME `www.vitorpereira.ia.br` → `cname.vercel-dns.com`
- [ ] Vercel Dashboard mostra "Valid Configuration" e certificado TLS emitido
- [ ] `https://vitorpereira.ia.br` serve a nova versão Next.js com TLS válido
- [ ] `https://www.vitorpereira.ia.br` redireciona para apex
- [ ] Spot-check dos 16 URLs da US-003 agora no domínio real

### US-005: Pós-ship — Search Console + validators + uptime

**Descrição:** Como Vitor, quero o domínio indexado no Google com sitemap submetido, SEO re-validado no domínio real e um uptime monitor alertando caso o site caia, para ter o mínimo de observabilidade operacional pós-go-live.

**Acceptance Criteria:**

- [ ] Property `https://vitorpereira.ia.br` adicionada em https://search.google.com/search-console
- [ ] Propriedade verificada (preferência: DNS TXT record — compatível com apex + subdomínios)
- [ ] `https://vitorpereira.ia.br/sitemap.xml` submetido no Search Console e status "Success"
- [ ] Re-validação SEO no domínio real (única passada — pulada em US-003 porque canonical apontava para domínio ainda hospedando o PHP legacy):
  - [ ] Google Rich Results Test → BlogPosting reconhecido com `image`
  - [ ] Twitter Card Validator → `summary_large_image` com imagem (fallback `/opengraph-image` quando post não tem cover)
  - [ ] W3C Feed Validator em `/rss.xml` e `/en/rss.xml` → RSS 2.0 valid
  - [ ] Schema.org validator em URL de post → estrutura JSON-LD OK
- [ ] Lighthouse mobile no domínio real em `/` e post example: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] Uptime monitor configurado (UptimeRobot ou HealthChecks.io — free tier) pingando `https://vitorpereira.ia.br/` a cada 5 min, alerta por email para o endereço do Vitor
- [ ] Vitor confirma explicitamente no chat que o projeto está shipado ("shipado", "projeto no ar", equivalente)

## 4. Functional Requirements

- **FR-1**: O build da Vercel deve executar `pnpm install && pnpm build` (onde `build = velite build && next build`). Falha em typecheck/lint/test bloqueia deploy (exit não-zero).
- **FR-2**: Env vars `NEXT_PUBLIC_*` são consumidas no client e consideradas públicas por natureza — seguro commit em `.env.example` com valores vazios, mas valores reais ficam só na Vercel e em `.env.development.local` (gitignored).
- **FR-3**: `app/robots.ts` retorna `Disallow: /` quando `VERCEL_ENV !== "production"` — garantia de que previews e deploys não-prod não são indexados (já implementado na Phase 5).
- **FR-4**: Após aceite do consent banner, `ClarityScript` e `GAScript` só injetam o `<script>` se a env var correspondente estiver definida E o cookie `consent=accepted` presente (dupla gate já implementada na Phase 6).
- **FR-5**: Giscus usa lookup por pathname como discussion mapping (configurado em `components/blog/GiscusEmbed.tsx` na Phase 3), para que URLs bilíngues PT/EN do mesmo post caiam em discussions distintas.
- **FR-6**: DNS cutover (US-004) não executa nenhum comando automático — os passos são manuais pelo registrar e Vercel Dashboard, com Claude apenas instruindo e validando.

## 5. Non-Goals (fora de escopo deste PRD)

- **Migração `middleware.ts` → `proxy.ts`** (Next 16 deprecation) — tratada no PRD 02.
- **Scrub do histórico git** (`git filter-repo` em `.vscode/sftp.json`) — opcional, PRD 02. Rotação de senha (US-004 gate) já neutraliza o vetor.
- **Geração de tradução para todos os posts** — out of scope, posts bilíngues continuam opt-in.
- **Formulário de contato** — spec §14 YAGNI explícito, contato é via links sociais.
- **Redirects 301 de URLs antigas do PHP** (`/portfolio.php?x=y` etc.) — legacy-php não era indexada o suficiente pra justificar; se Search Console reclamar de URLs quebradas no pós-ship, abrir PRD novo.
- **CDN / Cloudflare em frente à Vercel** — Vercel Edge já cobre; custo+complexidade não justificam.
- **A/B testing / feature flags** — não há necessidade no MVP.

## 6. Architecture Considerations

Este PRD é operacional — **não há código novo a escrever no repositório**. Todo o trabalho de código foi feito nas Phases 1-6. O que muda:

| Camada                             | Arquivos afetados           | Ação                                            |
| ---------------------------------- | --------------------------- | ----------------------------------------------- |
| Config runtime                     | Vercel Dashboard (env vars) | Criar/editar — US-002                           |
| Config runtime                     | Vercel Dashboard (domains)  | Adicionar domain — US-004                       |
| External — GitHub                  | Repo settings → Discussions | Habilitar + criar categoria — US-001            |
| External — Registrar               | DNS records                 | Atualizar apex A + www CNAME — US-004           |
| External — Google                  | Search Console property     | Verificar via DNS TXT + submit sitemap — US-005 |
| External — Uptime service          | UptimeRobot/HealthChecks    | Criar check HTTP — US-005                       |
| Repo (nenhum code change esperado) | —                           | —                                               |

Se alguma US revelar bug que exija code change (ex: OG image quebrada em prod), abrir task em `docs/tasks/01/` descrevendo o fix e listar em §8 deste PRD.

## 7. Success Metrics

- **Time-to-live**: do primeiro `vercel --prod` (US-003) até o DNS cutover validado (US-004) — meta: <2 dias corridos.
- **Lighthouse em prod**: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90, Best Practices ≥ 90 nas duas páginas auditadas.
- **Zero regressão** entre URL provisória e domínio real (o smoke test de US-004 deve bater o de US-003).
- **Search Console**: sitemap aceito sem warnings de URLs unreachable no primeiro crawl (até 48h após cutover).
- **Uptime**: 99.9%+ nos primeiros 7 dias pós-cutover (Vercel edge é altamente disponível; qualquer queda sinaliza config errada).

## 8. Open Questions

- **Redirects de URLs legacy-php**: Vitor mencionou que o site PHP antigo teve indexação ativa? Se sim, Search Console vai sinalizar URLs 404 pós-cutover e pode valer um mini-PRD de redirects 301 para canonicals Next.js. Decidir após primeiros 7 dias de crawl.
- **Preview Giscus**: deploys de PR devem mostrar Giscus (escopo preview das env vars) ou deixar vazio para evitar poluir Discussions reais com testes? US-002 opta por compartilhar IDs entre prod e preview — aceita?
- **Cloudflare para DNS**: registrar atual suporta ALIAS/ANAME no apex? Se não, A-record para `76.76.21.21` funciona mas é Vercel-proprietary IP — se Vercel mudar o IP, precisa reconfigurar. Cloudflare em DNS-only mode (gray cloud) resolve isso com CNAME flattening. Avaliar no momento da US-004.
- **Monitoring além de uptime**: considerar Sentry (free tier Hobby = 5k events/mês) para error tracking client-side? Não está no spec, mas útil. Abrir PRD novo se fizer sentido pós-go-live.
