# Onda 3 — Deploy provisório + acceptance

> **1 agent** | ~30-60 min (depende de fix loop se aparecerem bugs)
> **Pre-requisito**: Onda 2 completa (Vercel linkado, 14 env vars)

---

## Agent 1 — US-003: Deploy provisório passando aceite completo

```
Implementar US-003 do PRD 01. Ler o task file `docs/tasks/01/US-003_deploy-provisorio.md` para contexto completo.

Resumo do que fazer:
1. Rodar `vercel --prod` (interativo — "! vercel --prod"). Aguardar build Vercel completar — acompanhar logs para capturar qualquer erro (velite build e next build rodam em sequência).
2. Anotar a URL provisória (formato `https://vitorpereira-ia-br-<hash>.vercel.app` ou alias `https://vitorpereira-ia-br.vercel.app`).
3. Guiar o Vitor por um smoke test sistemático das 16 rotas em incognito (lista no task file §"Smoke test - 16 rotas"). Para cada falha: criar um commit `fix: ...`, push, Vercel auto-deploya, re-validar só o item falho. Não parar até as 16 rotas passarem.
4. Validar interações: theme toggle, language toggle, command palette ⌘K.
5. Validar analytics + consent: banner aparece na primeira visita; Aceitar → GA4 + Clarity carregam (Network tab); Recusar → não carregam; Vercel Analytics sempre carrega; footer "Gerenciar cookies" reabre.
6. Validar Giscus no hello-world post (PT + EN) → post de teste → aparece no GitHub → deletar.
7. Validar drafts: listing `/posts` em prod NÃO mostra `draft-only-example-post`; URL direta de draft → 404.
8. Rodar 4 validators SEO na URL provisória:
   - Google Rich Results Test (BlogPosting)
   - Twitter Card Validator (summary_large_image)
   - W3C Feed Validator em /rss.xml e /en/rss.xml (RSS 2.0 valid)
   - Schema.org validator em post URL
9. Lighthouse mobile incognito em `/` e `/2026/04/21/hello-world`: Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90.
10. Revisar logs Vercel: nenhum 500/erro.
11. Marcar US-003 como Concluída em `docs/prd/INDEX.md` (3/5 US) e escrever uma nota no próprio task file ao final do checklist com a URL provisória + scores Lighthouse + qualquer issue conhecido remanescente.

Arquivos que você PODE modificar (caso fix loop):
- Qualquer arquivo do repo (bug encontrado → fix → commit → push)
- `docs/prd/INDEX.md`
- `docs/tasks/01/US-003_deploy-provisorio.md` (nota final)

NÃO alterar (fora de escopo):
- DNS do domínio real (US-004)
- Arquivos de docs/prd/ exceto INDEX.md e o task file da US-003

Gotchas conhecidos:
- `robots.txt` em URL `*.vercel.app` de scope production retorna `Allow: /`; previews retornam `Disallow: /`. Confirmar com `curl` para saber em qual scope o deploy caiu.
- Se Lighthouse Performance < 90, investigar: imagem OG muito grande? Fonts não otimizadas? CSS-in-JS bloqueando render? Fix antes de marcar US concluída.
- Se Twitter Card não renderizar, cachear pode demorar — usar o botão "Preview Card" múltiplas vezes ou adicionar ?v=<timestamp> na URL para invalidar.
- Se Giscus não carregar em prod mas carregava em dev, checar `vercel env ls` — NEXT_PUBLIC_GISCUS_* precisa estar em production scope.
- Fix loop é normal. Não pule itens do checklist para "ganhar tempo" — cada item quebrado em prod = bug que o usuário final vai encontrar.

Ao final rodar: `curl -sI https://<url-provisoria>/robots.txt` para confirmar policy correto no scope.
```

---

## Validação pós-onda

```bash
# 1. Site provisório no ar
curl -sI https://<url-provisoria>/ | head -3
# esperado: HTTP/2 200, server com headers Vercel

# 2. RSS valido (XML bem-formado)
curl -s https://<url-provisoria>/rss.xml | xmllint --noout - && echo "RSS OK"

# 3. Sitemap válido
curl -s https://<url-provisoria>/sitemap.xml | xmllint --noout - && echo "Sitemap OK"

# 4. Build local ainda roda (regressão sanity)
pnpm build

# 5. INDEX.md atualizado
grep "PRD 01" docs/prd/INDEX.md | head -1
# progresso deve mostrar "3/5 US"
```

**Checkpoint**: URL provisória smoke-passed + 4 validators SEO OK + Lighthouse ≥ 90 em 2 páginas + US-003 `Concluída`. Avançar para cutover (com aprovação).
