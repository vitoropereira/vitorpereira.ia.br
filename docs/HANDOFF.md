# HANDOFF — Retomada de sessão

> **Como usar**: na próxima sessão, mande "leia `docs/HANDOFF.md`". Eu vou entender onde paramos, o que falta, e te guiar no próximo passo.
>
> **Última atualização**: 2026-04-26 — fim da Onda 3 do PRD 01 (auto-passes OK, manuais pendentes)

---

## TL;DR onde paramos

- **PRD em curso**: 01 — Deploy & go-live (`docs/prd/01_deploy-e-go-live.md`)
- **Onda atual**: **Onda 3 (US-003) — Deploy provisório**, em fase de **validação manual**
- **Production alias no ar**: https://vitorpereira-ia-br.vercel.app/ (HTTP 200 ✅)
- **Domínio real `vitorpereira.ia.br`**: ainda apontando para PHP legacy (cutover é Onda 4)
- **Status INDEX.md**: PRD 01 = `2/5 US` — **NÃO atualizar para 3/5 até checklist abaixo zerado**
- **Regra de deploy**: PR → merge em `main` (sem Vercel CLI). Documentado em `docs/prompts/prd-01/README.md`.

---

## Checklist de retomada (US-003 — fechar para liberar Onda 4)

> Faça em ordem. Cada item ✅ = marcar `[x]` aqui E no task file `docs/tasks/01/US-003_deploy-provisorio.md` (mesmas seções).
>
> **Tudo no alias production**: `https://vitorpereira-ia-br.vercel.app` — sempre em janela **incognito** (sem extensões interferindo no consent banner).

### 1. Smoke das 16 rotas (visual, não só HTTP 200)

Abra cada URL em incognito, scroll até o fim, verifique se o conteúdo está OK (sem placeholder/quebrado).

- [ ] `/` (PT home)
- [ ] `/en` (EN home)
- [ ] `/posts` (listing PT)
- [ ] `/en/posts` (listing EN)
- [ ] `/2026/04/21/hello-world` (post PT)
- [ ] `/en/2026/04/21/hello-world` (post EN)
- [ ] `/portfolio` (grid PT com filtros)
- [ ] `/en/portfolio` (grid EN com filtros)
- [ ] `/sobre`
- [ ] `/en/about`
- [ ] `/contato`
- [ ] `/en/contact`
- [ ] `/privacidade`
- [ ] `/en/privacy`
- [ ] `/termos`
- [ ] `/en/terms`

### 2. Interações (em qualquer página)

- [ ] **Theme toggle**: alternar dark/light/system → recarregar página → tema persiste (`next-themes` salva em localStorage)
- [ ] **Language toggle**: navegar PT↔EN preservando rota quando tradução existe; em rota sem par (raro), o toggle deve estar desabilitado com tooltip explicando
- [ ] **Command palette ⌘K** (Cmd+K no Mac): abre overlay → buscar "hello" → resultado clicável → fuzzy via fuse.js funciona

### 3. Analytics + Consent flow

Sequência completa em incognito (cookie `consent` precisa não existir):

- [ ] Primeira visita ao alias → **banner de consent aparece**
- [ ] Clicar **Recusar** → cookie `consent=rejected` (validade 1 ano) → DevTools → Network → filtrar "clarity" e "googletagmanager" → **NENHUM request** desses dois domínios
- [ ] Limpar cookies, recarregar, agora clicar **Aceitar** → cookie `consent=accepted` → Network → **GA4 e Clarity carregam** (`googletagmanager.com/gtag/js?id=G-...` e `clarity.ms/tag/...`)
- [ ] Em ambos os flows: **Vercel Analytics e Speed Insights sempre carregam** (filtrar `/_vercel/insights/` no Network — script + eventos)
- [ ] Footer "Gerenciar cookies" → reabre o banner para trocar consent

### 4. Comentários (Giscus)

- [ ] Scroll até o fim de `https://vitorpereira-ia-br.vercel.app/2026/04/21/hello-world` → **Giscus carrega** (iframe do giscus.app aparece)
- [ ] Mesma checagem em `/en/2026/04/21/hello-world` → carrega
- [ ] Postar comentário de teste em uma das versões (ex: "test comment")
- [ ] Verificar no GitHub: https://github.com/vitoropereira/vitorpereira.ia.br/discussions → categoria "Comments" → discussion criada com o comentário
- [ ] **Deletar a discussion de teste** após validar (botão Delete na UI do GitHub)

### 5. Drafts não vazam em produção

- [ ] `https://vitorpereira-ia-br.vercel.app/posts` → `hello-world` aparece, **`draft-only-example-post` NÃO aparece**
- [ ] `https://vitorpereira-ia-br.vercel.app/<slug-do-draft>` direto → **HTTP 404** (URL exata do draft, se você souber; senão pular)
- [ ] Mesmo check em `/en/posts` se houver draft EN

### 6. Lighthouse mobile (incognito, DevTools → Lighthouse)

Settings: **Mobile preset**, **Performance + SEO + Accessibility**, sem throttling extra.

- [ ] `/` → anotar scores: Perf ≥ 90, SEO ≥ 95, A11y ≥ 90
- [ ] `/2026/04/21/hello-world` → anotar scores: Perf ≥ 90, SEO ≥ 95, A11y ≥ 90

**Se algum score < threshold**: criar branch de fix → PR → merge → re-rodar Lighthouse antes de marcar US-003 concluída.

### 7. Regressões (durante o smoke acima)

- [ ] Vercel Dashboard → projeto → **Logs** do último deployment → **nenhum 500**
- [ ] DevTools Console nas 16 rotas → **nenhum erro vermelho** (warnings amarelos toleráveis)

---

## Onde anotar os Lighthouse scores

Editar `docs/tasks/01/US-003_deploy-provisorio.md`, seção **Deploy log** (linhas ~142-144):

```markdown
- **Lighthouse mobile**:
  - `/` — Perf: __ / SEO: __ / A11y: __
  - `/2026/04/21/hello-world` — Perf: __ / SEO: __ / A11y: __
```

Trocar os `__` pelos números.

---

## Quando todos os checks acima estiverem ✅

Sequência de fechamento da US-003 (sempre via PR, sem commit direto em main):

```bash
git checkout -b docs/us-003-complete
# 1. editar docs/HANDOFF.md → apagar este arquivo OU sobrescrever com novo handoff da Onda 4
# 2. editar docs/prd/INDEX.md:
#    - linha "US-003" → status "Concluída" + branch/PR (referência ao PR final)
#    - linha PRD 01 → progresso "3/5 US"
# 3. editar docs/tasks/01/US-003_deploy-provisorio.md:
#    - marcar todos os [ ] que viraram [x]
#    - preencher Lighthouse scores
git add -A && git commit -m "docs(prd): mark US-003 deploy provisional as concluída"
git push -u origin docs/us-003-complete
gh pr create --fill --base main
gh pr checks --watch
gh pr merge --squash --delete-branch
```

---

## Próxima onda (depois de fechar US-003)

**Onda 4 — DNS cutover** (`docs/prompts/prd-01/onda-4_dns-cutover.md`).

**Pré-requisitos antes de abrir** (gates da Onda 4):

1. ✅ US-003 = Concluída (item acima)
2. ⚠️ **Senha FTP do hosting PHP antigo rotacionada** — você precisa entrar no painel do provedor PHP atual e trocar a senha. Confirmar no chat antes de abrir Onda 4.
3. ⚠️ Estar pronto para responder **"approved"** literal quando o agente pedir aprovação para o cutover (ação irreversível dentro de uma janela curta — DNS pode levar até 48h para reverter).

**Aviso operacional**: a Onda 4 troca o DNS de `vitorpereira.ia.br` do PHP antigo para Vercel. A partir desse momento o site público é o Next.js. Validators externos (Google Rich Results, Twitter Card, W3C Feed, Schema.org) que foram **deslocados de US-003 para US-005** vão rodar contra o domínio real após cutover, em vez do alias `vercel.app`.

---

## Estado verificado (snapshot 2026-04-26)

Comandos que rodei e outputs:

```bash
$ curl -sI https://vitorpereira-ia-br.vercel.app/ | head -1
HTTP/2 200

$ curl -s https://vitorpereira-ia-br.vercel.app/robots.txt | head -3
User-Agent: *
Allow: /

Sitemap: https://vitorpereira.ia.br/sitemap.xml

$ git log --oneline origin/main -5
bee3dce fix(a11y): set html lang dynamically based on locale (#6)
77499c8 docs: defer external SEO validators from US-003 to US-005 (post-cutover) (#5)
878a662 fix(seo): fallback og:image to /opengraph-image when post has no cover (#4)
8a20799 deploy: go-live provisional (US-003) (#3)
a5f8ce6 docs: replace scaffold README with project README
```

PRs mergeados nesta onda: #3 (deploy), #4 (og fallback), #5 (defer SEO validators), #6 (html lang dinâmico).

Decisão de design importante: **SEO validators externos foram movidos de US-003 para US-005** porque canonical/og/JSON-LD apontam para `vitorpereira.ia.br` (domínio real ainda no PHP antigo). Rodar agora capturaria o site velho. Documentado no task file de US-003 e a ser cumprido no task file de US-005.
