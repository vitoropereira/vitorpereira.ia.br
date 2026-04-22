# Onda 3 — Deploy provisório + acceptance

> **1 agent** | ~30-90 min (depende de fix loop se aparecerem bugs)
> **Pre-requisito**: Onda 2 completa (projeto Vercel criado via Dashboard, 14 env vars configuradas, Git integration GitHub↔Vercel conectada)

---

## Fluxo de deploy (sem CLI)

> **IMPORTANTE**: neste PRD **não usamos `vercel` CLI**. Todo deploy = **PR em `main`** → merge → Vercel auto-deploya via Git integration.
>
> - PR aberto (feature branch) → Vercel cria **Preview deployment** (URL `*.vercel.app` efêmera, robots.txt `Disallow`)
> - PR merged em `main` → Vercel cria **Production deployment** (alias estável `https://vitorpereira-ia-br.vercel.app`, robots.txt `Allow`)
>
> Gate antes de começar: confirmar com o Vitor que **GitHub ↔ Vercel está conectado** (Vercel Dashboard → projeto → Settings → Git → "Connected Git Repository: vitoropereira/vitorpereira.ia.br"). Se não estiver, pedir para conectar antes de prosseguir.

---

## Agent 1 — US-003: Deploy provisório passando aceite completo

```
Implementar US-003 do PRD 01. Ler o task file `docs/tasks/01/US-003_deploy-provisorio.md` para contexto completo.

CONTEXTO CRÍTICO: Não usamos Vercel CLI. Todo deploy = PR em `main` (merge → Vercel auto-deploya via Git integration GitHub↔Vercel). Não rodar `vercel --prod`, `vercel env ls`, `vercel env pull` em nenhum momento.

Resumo do que fazer:

1. Confirmar com o Vitor que Git integration GitHub↔Vercel está conectada (Vercel Dashboard → Settings → Git). Se não, pedir para conectar e aguardar.

2. Disparar deploy provisório:
   a. Garantir que `main` está limpa: `git status`, `git pull origin main`.
   b. Como esta é a primeira subida "oficial" do site em prod, o caminho mais direto é um PR vazio-ish (ou com um commit trivial tipo bump de README/notas) que force o Vercel a buildar em production scope. Opções:
      - Criar branch `deploy/go-live-provisional`, commit trivial (ex: adicionar nota no `docs/tasks/01/US-003_deploy-provisorio.md`), push, abrir PR para `main`, confirmar build preview passa (`gh pr checks`), merge via `gh pr merge --squash --delete-branch`.
      - Se `main` já tem commits não-deployados, basta confirmar que a Vercel vai rebuilar no próximo push; se não tem, seguir o fluxo do commit trivial acima.
   c. Após merge em `main`, Vercel auto-deploya em production scope. Aguardar build completar.

3. Monitorar o deploy sem CLI:
   - `gh pr checks <num>` para ver status do check Vercel no PR antes do merge.
   - Após merge: Vercel Dashboard → Deployments → aguardar status "Ready" no deployment de `main`.
   - Anotar a URL production: `https://vitorpereira-ia-br.vercel.app` (alias estável) + URL do deployment específico.

4. Se o build falhar na Vercel (velite build ou next build):
   - Ler logs no Dashboard → Deployment → View Build Logs.
   - Criar branch de fix (`fix/<nome-do-erro>`), commit, push, abrir PR, deixar Vercel buildar o preview, se passar → merge em `main`.
   - Repetir até build verde em `main`.

5. Smoke test sistemático das 16 rotas em incognito, **no alias de production** `https://vitorpereira-ia-br.vercel.app` (lista no task file §"Smoke test - 16 rotas"). Para cada falha: criar branch `fix/...`, commit, push, PR, merge → Vercel re-deploya → re-validar só o item falho. Não parar até as 16 rotas passarem.

6. Validar interações: theme toggle, language toggle, command palette ⌘K.

7. Validar analytics + consent: banner aparece na primeira visita; Aceitar → GA4 + Clarity carregam (Network tab); Recusar → não carregam; Vercel Analytics sempre carrega; footer "Gerenciar cookies" reabre.

8. Validar Giscus no hello-world post (PT + EN) → post de teste → aparece no GitHub → deletar.

9. Validar drafts: listing `/posts` em prod NÃO mostra `draft-only-example-post`; URL direta de draft → 404.

10. Rodar 4 validators SEO na URL de production alias:
    - Google Rich Results Test (BlogPosting)
    - Twitter Card Validator (summary_large_image)
    - W3C Feed Validator em /rss.xml e /en/rss.xml (RSS 2.0 valid)
    - Schema.org validator em post URL

11. Lighthouse mobile incognito em `/` e `/2026/04/21/hello-world`: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90.

12. Revisar logs Vercel (Dashboard → Logs do último deployment): nenhum 500/erro.

13. Marcar US-003 como Concluída em `docs/prd/INDEX.md` (3/5 US) e escrever uma nota no próprio task file ao final do checklist com: URL production alias + scores Lighthouse + qualquer issue conhecido remanescente + links dos PRs de fix (se houver).

Arquivos que você PODE modificar (caso fix loop):
- Qualquer arquivo do repo (bug encontrado → branch de fix → PR → merge em main)
- `docs/prd/INDEX.md`
- `docs/tasks/01/US-003_deploy-provisorio.md` (nota final)

NÃO fazer:
- Rodar Vercel CLI (`vercel`, `vercel env`, `vercel --prod`, etc.) — sempre PR em main.
- Commit direto em `main` sem PR. Regra do PRD: deploy = PR → merge.
- DNS do domínio real (US-004).
- Alterar env vars na Vercel (já estão da Onda 2 via Dashboard).

Gotchas conhecidos:
- **robots.txt**: alias de production (`vitorpereira-ia-br.vercel.app`) retorna `Allow: /`. Previews de PR (`*-git-<branch>-<scope>.vercel.app`) retornam `Disallow: /` por causa da lógica em `app/robots.ts` (checa `VERCEL_ENV === "production"`). Os validators externos (Google Rich Results, Twitter Card, Schema.org) só funcionam bem no alias production.
- **Cache de Preview**: PRs sucessivos geram URLs diferentes. Para smoke tests sérios, usar sempre o alias estável `https://vitorpereira-ia-br.vercel.app` (production), não a URL efêmera do PR.
- **Lighthouse Performance < 90**: investigar imagem OG pesada, fonts não otimizadas, CSS-in-JS bloqueando render. Fix em branch → PR → merge antes de marcar US concluída.
- **Twitter Card cache**: pode demorar — usar "Preview Card" múltiplas vezes ou `?v=<timestamp>` para invalidar.
- **Giscus não carrega em prod mas carregava em dev**: checar no Vercel Dashboard → Settings → Environment Variables se NEXT_PUBLIC_GISCUS_* estão no scope `Production`.
- **Fix loop é normal**. Não pule itens do checklist para "ganhar tempo" — cada item quebrado em prod = bug que o usuário final vai encontrar.

Ao final rodar: `curl -sI https://vitorpereira-ia-br.vercel.app/robots.txt` para confirmar `Allow: /` no scope production.
```

---

## Validação pós-onda

```bash
# 1. Site provisório no ar (alias production)
curl -sI https://vitorpereira-ia-br.vercel.app/ | head -3
# esperado: HTTP/2 200, header server/x-vercel-id

# 2. robots.txt em production scope
curl -s https://vitorpereira-ia-br.vercel.app/robots.txt | head -3
# esperado: "User-agent: *\nAllow: /"

# 3. RSS valido
curl -s https://vitorpereira-ia-br.vercel.app/rss.xml | xmllint --noout - && echo "RSS OK"

# 4. Sitemap válido
curl -s https://vitorpereira-ia-br.vercel.app/sitemap.xml | xmllint --noout - && echo "Sitemap OK"

# 5. Build local ainda roda (regressão sanity)
pnpm build

# 6. INDEX.md atualizado
grep "PRD 01" docs/prd/INDEX.md | head -1
# progresso deve mostrar "3/5 US"

# 7. main está em sincronia com origin
git fetch origin && git status -sb
# esperado: "## main...origin/main" sem "ahead" nem "behind"
```

**Checkpoint**: alias production smoke-passed + 4 validators SEO OK + Lighthouse ≥ 90 em 2 páginas + US-003 `Concluída`. Avançar para cutover (com aprovação).
